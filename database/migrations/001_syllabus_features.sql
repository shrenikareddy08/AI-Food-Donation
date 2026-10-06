-- ====================================================================
-- MealBridge AI 2.0: Syllabus Feature Extension & Advanced SQL
-- Migration: 001_syllabus_features.sql
-- Description: Additive schema updates for Events, Emails, RAG, Views, Triggers
-- ====================================================================

-- 1. Events Table (Feature E: Event-Based Food Donation)
CREATE TABLE IF NOT EXISTS public.events (
    event_id SERIAL PRIMARY KEY,
    organizer_id INTEGER NOT NULL,
    event_name VARCHAR(150) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    expected_attendees INTEGER NOT NULL DEFAULT 0,
    food_type VARCHAR(50) NOT NULL,
    estimated_leftover_meals INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED' CHECK (
        status IN ('CREATED', 'COMPLETED', 'FOOD_AVAILABLE', 'CONVERTED_TO_DONATION', 'CANCELLED')
    ),
    converted_donation_id INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_organizer FOREIGN KEY (organizer_id) REFERENCES public.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_event_donation FOREIGN KEY (converted_donation_id) REFERENCES public.donations(donation_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events (organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events (event_date);

-- 2. Email Notifications Table (Feature D: Email Communication)
CREATE TABLE IF NOT EXISTS public.email_notifications (
    email_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    recipient_email VARCHAR(150) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (
        status IN ('PENDING', 'SENT', 'FAILED')
    ),
    sent_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_email_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emails_recipient ON public.email_notifications (recipient_email);
CREATE INDEX IF NOT EXISTS idx_emails_type ON public.email_notifications (event_type);

-- 3. RAG Retrieval Logs Table (Feature B: Basic RAG Audit Trail)
CREATE TABLE IF NOT EXISTS public.rag_retrieval_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    query TEXT NOT NULL,
    retrieved_chunks TEXT,
    response TEXT NOT NULL,
    similarity_top_score NUMERIC(5, 4),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rag_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_rag_logs_created_at ON public.rag_retrieval_logs (created_at DESC);

-- 4. CO1 Database View 1: Available Donations Summary
CREATE OR REPLACE VIEW public.v_available_donations AS
SELECT 
    d.donation_id,
    d.food_name,
    d.food_type,
    d.quantity,
    d.unit,
    d.location,
    d.latitude,
    d.longitude,
    d.expiry_time,
    ROUND(CAST(EXTRACT(EPOCH FROM (d.expiry_time - CURRENT_TIMESTAMP)) / 3600.0 AS NUMERIC), 2) AS hours_until_expiry,
    d.status,
    u.name AS donor_name,
    u.phone AS donor_phone,
    u.email AS donor_email,
    d.created_at
FROM public.donations d
JOIN public.users u ON d.donor_id = u.user_id
WHERE d.status = 'POSTED' AND d.expiry_time > CURRENT_TIMESTAMP;

-- 5. CO1 Database View 2: NGO Capacity & Fulfillment Summary
CREATE OR REPLACE VIEW public.v_ngo_capacity_summary AS
SELECT 
    n.ngo_id,
    n.organization_name,
    n.address,
    n.capacity,
    n.capacity_unit,
    n.food_requirements,
    n.verification_status,
    COUNT(DISTINCT m.match_id) AS total_matches_received,
    COUNT(DISTINCT CASE WHEN m.status = 'ACCEPTED' THEN m.match_id END) AS accepted_matches,
    COUNT(DISTINCT a.assignment_id) AS total_deliveries_assigned,
    COUNT(DISTINCT CASE WHEN a.status = 'DELIVERED' THEN a.assignment_id END) AS completed_deliveries
FROM public.ngos n
LEFT JOIN public.matches m ON n.ngo_id = m.ngo_id
LEFT JOIN public.assignments a ON n.ngo_id = a.ngo_id
GROUP BY n.ngo_id, n.organization_name, n.address, n.capacity, n.capacity_unit, n.food_requirements, n.verification_status;

-- 6. CO1 Trigger Function: Audit Status Transitions on Donations
CREATE OR REPLACE FUNCTION public.fn_audit_donation_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (
            NEW.donor_id,
            'DONATION_STATUS_' || NEW.status,
            'DONATION',
            NEW.donation_id,
            'Status changed from ' || COALESCE(OLD.status, 'NONE') || ' to ' || NEW.status,
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_donation_status_audit ON public.donations;
CREATE TRIGGER trg_donation_status_audit
AFTER UPDATE OF status ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_donation_status_change();
