from datetime import datetime, timezone
from math import radians, sin, cos, sqrt, atan2


# ---------------------------------------------------------
# HAVERSINE DISTANCE
# ---------------------------------------------------------

def calculate_distance_km(
    latitude1: float | None,
    longitude1: float | None,
    latitude2: float | None,
    longitude2: float | None
) -> float:

    if (
        latitude1 is None
        or longitude1 is None
        or latitude2 is None
        or longitude2 is None
    ):
        return 9999.0

    earth_radius_km = 6371.0

    lat1 = radians(float(latitude1))
    lon1 = radians(float(longitude1))
    lat2 = radians(float(latitude2))
    lon2 = radians(float(longitude2))

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return earth_radius_km * c


# ---------------------------------------------------------
# LOCATION SCORE
# ---------------------------------------------------------

def calculate_location_score(
    donation,
    ngo
) -> float:

    distance = calculate_distance_km(
        donation.latitude,
        donation.longitude,
        ngo.latitude,
        ngo.longitude
    )

    if distance <= 0:
        return 100.0

    if distance <= 10:
        score = 100 - (distance * 10)

        if score < 0:
            score = 0

        return round(score, 2)

    return 0.0


# ---------------------------------------------------------
# QUANTITY SCORE
# ---------------------------------------------------------

def calculate_quantity_score(
    donation,
    ngo
) -> float:

    donation_quantity = float(donation.quantity or 0)
    ngo_capacity = float(ngo.capacity or 0)

    if donation_quantity <= 0:
        return 0.0

    if ngo_capacity <= 0:
        return 0.0

    if ngo_capacity >= donation_quantity:
        return 100.0

    score = (ngo_capacity / donation_quantity) * 100

    return round(score, 2)


# ---------------------------------------------------------
# EXPIRY SCORE
# ---------------------------------------------------------

def calculate_expiry_score(
    donation
) -> float:

    if donation.expiry_time is None:
        return 0.0

    expiry_time = donation.expiry_time

    # Database timestamp is timezone-naive
    if expiry_time.tzinfo is None:
        expiry_time = expiry_time.replace(
            tzinfo=timezone.utc
        )

    current_time = datetime.now(timezone.utc)

    hours_left = (
        expiry_time - current_time
    ).total_seconds() / 3600

    if hours_left <= 0:
        return 0.0

    if hours_left >= 24:
        return 100.0

    if hours_left >= 12:
        return 80.0

    if hours_left >= 6:
        return 60.0

    if hours_left >= 2:
        return 40.0

    return 20.0


# ---------------------------------------------------------
# REQUIREMENT SCORE
# ---------------------------------------------------------

def calculate_requirement_score(
    donation,
    ngo
) -> float:

    requirements = ngo.food_requirements

    if not requirements:
        return 30.0

    requirements = requirements.lower()

    food_name = (
        str(donation.food_name or "")
        .lower()
    )

    food_type = (
        str(donation.food_type or "")
        .lower()
    )

    # Exact food name or type match
    if (
        food_name
        and food_name in requirements
    ):
        return 100.0

    if (
        food_type
        and food_type in requirements
    ):
        return 100.0

    # Check individual words
    words = []

    if food_name:
        words.extend(food_name.split())

    if food_type:
        words.extend(food_type.split())

    for word in words:

        if len(word) > 2 and word in requirements:
            return 70.0

    return 30.0


# ---------------------------------------------------------
# CAPACITY SCORE
# ---------------------------------------------------------

def calculate_capacity_score(
    donation,
    ngo
) -> float:

    donation_quantity = float(donation.quantity or 0)
    ngo_capacity = float(ngo.capacity or 0)

    if donation_quantity <= 0:
        return 0.0

    if ngo_capacity <= 0:
        return 0.0

    if ngo_capacity >= donation_quantity:
        return 100.0

    score = (
        ngo_capacity / donation_quantity
    ) * 100

    return round(score, 2)


# ---------------------------------------------------------
# MAIN MATCHING FUNCTION
# ---------------------------------------------------------

def calculate_match_scores(
    donation,
    ngo
) -> dict:

    location_score = calculate_location_score(
        donation,
        ngo
    )

    quantity_score = calculate_quantity_score(
        donation,
        ngo
    )

    expiry_score = calculate_expiry_score(
        donation
    )

    capacity_score = calculate_capacity_score(
        donation,
        ngo
    )

    requirement_score = calculate_requirement_score(
        donation,
        ngo
    )

    # Weighted total score
    total_score = (
        location_score * 0.25
        + quantity_score * 0.20
        + expiry_score * 0.25
        + capacity_score * 0.20
        + requirement_score * 0.10
    )

    total_score = round(total_score, 2)

    return {
        "location_score": round(location_score, 2),
        "quantity_score": round(quantity_score, 2),
        "expiry_score": round(expiry_score, 2),
        "capacity_score": round(capacity_score, 2),
        "requirement_score": round(requirement_score, 2),
        "total_score": total_score
    }