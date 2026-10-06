import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.db.postgres import AsyncSessionLocal, engine
from app.models.user import User
from app.models.ngo import NGO
from app.models.volunteer import Volunteer
from app.models.donation import Donation
from app.models.match import Match
from app.models.assignment import Assignment
from app.models.notification import Notification
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_full_role_workflow_e2e():
    """
    Tests the complete 4-role connected lifecycle:
    DONOR creates donation ->
    System auto-matches & notifies NGO ->
    NGO accepts donation ->
    Volunteer delivery request created ->
    VOLUNTEER accepts assignment ->
    VOLUNTEER picks up food ->
    VOLUNTEER delivers food to NGO ->
    Statuses & notifications verified across all roles ->
    Unread notifications count & mark-all-read verified.
    """
    await engine.dispose()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        async with AsyncSessionLocal() as session:
            # 1. Fetch existing test users for each role
            donor_res = await session.execute(select(User).where(User.role == "DONOR"))
            donor = donor_res.scalars().first()

            ngo_res = await session.execute(
                select(NGO, User).join(User, NGO.user_id == User.user_id).where(NGO.verification_status == "VERIFIED")
            )
            ngo_row = ngo_res.first()
            assert ngo_row is not None, "Verified NGO must exist"
            ngo, ngo_user = ngo_row

            vol_res = await session.execute(
                select(Volunteer, User).join(User, Volunteer.user_id == User.user_id).where(Volunteer.availability == "AVAILABLE")
            )
            vol_row = vol_res.first()
            assert vol_row is not None, "Available volunteer must exist"
            volunteer, vol_user = vol_row

            admin_res = await session.execute(select(User).where(User.role == "ADMIN"))
            admin = admin_res.scalars().first()

        donor_token = create_access_token(donor.user_id, "DONOR")
        ngo_token = create_access_token(ngo_user.user_id, "NGO")
        vol_token = create_access_token(vol_user.user_id, "VOLUNTEER")
        admin_token = create_access_token(admin.user_id, "ADMIN")

        # STEP 1: Donor creates donation
        create_res = await client.post(
            "/api/donations/",
            headers={"Authorization": f"Bearer {donor_token}"},
            json={
                "food_name": "Fresh Biryani & Curry",
                "food_type": "Cooked Food",
                "quantity": 25.0,
                "unit": "kg",
                "expiry_time": "2026-12-31T20:00:00",
                "pickup_address": "Madhapur, Hyderabad",
            }
        )
        assert create_res.status_code == 201, create_res.text
        don_data = create_res.json()
        donation_id = don_data["donation_id"]
        assert don_data["status"] == "POSTED"

        # Check that matches were generated for candidate NGOs
        async with AsyncSessionLocal() as session:
            match_res = await session.execute(
                select(Match).where(Match.donation_id == donation_id, Match.ngo_id == ngo.ngo_id)
            )
            match = match_res.scalars().first()

        # STEP 2: NGO accepts donation
        if match:
            accept_res = await client.put(
                f"/api/matches/{match.match_id}/status",
                headers={"Authorization": f"Bearer {ngo_token}"},
                json={"status": "ACCEPTED"}
            )
            assert accept_res.status_code == 200, accept_res.text
        else:
            claim_res = await client.post(
                f"/api/matches/claim/{donation_id}",
                headers={"Authorization": f"Bearer {ngo_token}"}
            )
            assert claim_res.status_code == 200, claim_res.text

        # Verify open volunteer delivery request was created
        async with AsyncSessionLocal() as session:
            assignment_res = await session.execute(
                select(Assignment).where(Assignment.donation_id == donation_id)
            )
            assignment = assignment_res.scalars().first()
            assert assignment is not None, "Delivery assignment should be created automatically upon NGO acceptance"
            assert assignment.status in ["REQUESTED", "ASSIGNED"]
            assignment_id = assignment.assignment_id

        # STEP 3: Volunteer views available assignments and accepts
        vol_assignments_res = await client.get(
            "/api/assignments/",
            headers={"Authorization": f"Bearer {vol_token}"}
        )
        assert vol_assignments_res.status_code == 200
        vol_assignments = vol_assignments_res.json()
        assert any(a["assignment_id"] == assignment_id for a in vol_assignments)

        # Volunteer accepts the assignment
        claim_vol_res = await client.post(
            f"/api/assignments/{assignment_id}/accept",
            headers={"Authorization": f"Bearer {vol_token}"}
        )
        assert claim_vol_res.status_code == 200
        claimed_data = claim_vol_res.json()
        assert claimed_data["status"] == "ACCEPTED"
        assert claimed_data["volunteer_id"] == volunteer.volunteer_id

        # STEP 4: Volunteer picks up food
        pickup_res = await client.put(
            f"/api/assignments/{assignment_id}/status",
            headers={"Authorization": f"Bearer {vol_token}"},
            json={"status": "PICKED_UP"}
        )
        assert pickup_res.status_code == 200
        pickup_data = pickup_res.json()
        assert pickup_data["status"] == "PICKED_UP"

        # Check donation status
        don_check_res = await client.get(
            f"/api/donations/{donation_id}",
            headers={"Authorization": f"Bearer {donor_token}"}
        )
        assert don_check_res.status_code == 200
        assert don_check_res.json()["status"] == "PICKED_UP"

        # STEP 5: Volunteer completes delivery
        deliv_res = await client.put(
            f"/api/assignments/{assignment_id}/status",
            headers={"Authorization": f"Bearer {vol_token}"},
            json={"status": "DELIVERED"}
        )
        assert deliv_res.status_code == 200
        deliv_data = deliv_res.json()
        assert deliv_data["status"] == "DELIVERED"

        # Check donation status updated to DELIVERED
        don_deliv_res = await client.get(
            f"/api/donations/{donation_id}",
            headers={"Authorization": f"Bearer {donor_token}"}
        )
        assert don_deliv_res.status_code == 200
        assert don_deliv_res.json()["status"] == "DELIVERED"

        # STEP 6: Check unread notifications and mark all read
        unread_res = await client.get(
            "/api/notifications/unread-count",
            headers={"Authorization": f"Bearer {donor_token}"}
        )
        assert unread_res.status_code == 200
        unread_count = unread_res.json()["unread_count"]
        assert unread_count >= 1

        mark_res = await client.put(
            "/api/notifications/mark-all-read",
            headers={"Authorization": f"Bearer {donor_token}"}
        )
        assert mark_res.status_code == 200

        unread_after_res = await client.get(
            "/api/notifications/unread-count",
            headers={"Authorization": f"Bearer {donor_token}"}
        )
        assert unread_after_res.status_code == 200
        assert unread_after_res.json()["unread_count"] == 0
