# MEALBRIDGE AI — EXHAUSTIVE SYLLABUS COVERAGE & COMPLIANCE MATRIX

> **Academic Course Outcomes (CO1 – CO6) Verification and Code Traceability Report**

---

## 📋 Summary Table

| Course Outcome | Description | Status | Primary Code Artifacts |
|---|---|---|---|
| **CO1** | Relational Database Engineering | **100% COMPLETE** | `database/init.sql`<br>`backend/app/routers/analytics_sql.py` |
| **CO2** | Database Engineering (NoSQL + pgvector + RAG) | **100% COMPLETE** | `backend/app/services/embedding_service.py`<br>`backend/app/services/rag_service.py`<br>`backend/app/db/mongo.py` |
| **CO3** | Backend API Engineering (FastAPI + JWT + RBAC) | **100% COMPLETE** | `backend/app/main.py`<br>`backend/app/routers/`<br>`backend/app/core/security.py` |
| **CO4** | Multi-Framework Backend Engineering (Node.js/Express) | **100% COMPLETE** | `microservices/activity-service/server.js`<br>`microservices/activity-service/package.json` |
| **CO5** | Microservices Engineering (Gateway, DB-per-service) | **100% COMPLETE** | `backend/app/routers/activities.py`<br>`microservices/activity-service/` |
| **CO6** | Deployment, Observability & Delivery (Docker, Metrics) | **100% COMPLETE** | `docker-compose.yml`<br>`backend/Dockerfile`<br>`Dockerfile.frontend`<br>`backend/app/routers/health.py` |

---

## 🏛️ CO1 — RELATIONAL DATABASE ENGINEERING

### 1.1 RDBMS Foundations & Architecture
- **Three-Schema Architecture**:
  - *Internal/Physical Schema*: Managed via PostgreSQL 16 storage engine with custom tablespaces, B-tree indexes, and HNSW vector indexing.
  - *Conceptual Schema*: Fully defined relational schema with 15 tables (`users`, `donations`, `ngos`, `volunteers`, `matches`, `assignments`, `delivery_tracking`, `delivery_confirmations`, `notifications`, `audit_logs`, `kb_documents`, `kb_chunks`, `events`, `email_notifications`, `rag_retrieval_logs`).
  - *External/View Schema*: Provided via database views `v_available_donations` and `v_ngo_capacity_summary` and decoupled Pydantic response models preventing internal schema leak.
- **Catalog Tools**: Integrated **pgAdmin 4** service in `docker-compose.yml` (Port 5050) providing full visual catalog browsing, execution plan analysis (`EXPLAIN ANALYZE`), sequence monitoring, and table statistics.

### 1.2 Entity-Relationship (ER) Modeling
- **Entities & Cardinalities**:
  - `USERS` (1) to `DONATIONS` (N): One donor can create multiple food donations.
  - `USERS` (1) to `NGOS` (1): One user account maps to one NGO entity profile.
  - `USERS` (1) to `VOLUNTEERS` (1): One user account maps to one volunteer profile.
  - `DONATIONS` (1) to `MATCHES` (N): One donation can generate compatibility matches across multiple candidate NGOs.
  - `DONATIONS` (1) to `ASSIGNMENTS` (1..N): Matched donation is dispatched to volunteer.
  - `EVENTS` (1) to `DONATIONS` (0..1): Leftover surplus event is converted into a live donation.
- **ER Diagram**: Fully visualized in [README.md](file:///Users/punreddyshrenikareddy/.gemini/antigravity/scratch/MealBridge_extracted/MealBridge/project/README.md) using Mermaid syntax.

### 1.3 Schema Design & Normalization
- **Normal Forms**:
  - *1NF*: All attributes are atomic (no repeating groups, multi-valued attributes like food items are structured cleanly).
  - *2NF*: All non-key attributes are fully functional dependent on primary keys (composite keys avoided; synthetic surrogate integer keys used).
  - *3NF/BCNF*: No transitive dependencies. User contact details reside strictly in `users`, NGO capacity in `ngos`, donation details in `donations`.
- **Integrity Constraints**:
  - Primary Keys (`PRIMARY KEY`) on every table.
  - Foreign Keys with cascade rules (`ON DELETE CASCADE` on `events.organizer_id`, `ON DELETE SET NULL` on `events.converted_donation_id`).
  - Unique Constraints on `users.email` and `ngos.user_id`.
  - Check Constraints on status fields (`status IN ('PLANNING', 'COMPLETED', ...)`).

### 1.4 SQL Advanced Querying
Implemented in `backend/app/routers/analytics_sql.py`:
- **Common Table Expressions (CTEs)**:
  - `ActiveDonationCTE`: Pre-filters and joins active donations with donor details.
  - `NgoMetricsCTE`: Pre-aggregates matches and delivery counts per NGO before computing fulfillment percentages.
- **Window Functions**:
  - `DENSE_RANK() OVER (ORDER BY expiry_time ASC)`: Urgency ranking of donations.
  - `ROW_NUMBER() OVER (PARTITION BY food_type ORDER BY quantity DESC)`: Within-category size ranking.
  - `SUM(quantity) OVER (PARTITION BY food_type)`: Total food volume per category.
  - `DENSE_RANK() OVER (ORDER BY completed_deliveries DESC, capacity DESC)`: Performance ranking of NGOs.
- **Multi-Table JOINs & Aggregations**:
  - Multi-table `LEFT JOIN` across `ngos`, `matches`, and `assignments` with `GROUP BY` and `ROUND()`.

### 1.5 Transactions & Stored Logic
- **ACID Transactions**: Handled via SQLAlchemy `async with session.begin()` guaranteeing atomicity across multi-entity workflows (e.g. converting event leftover to donation + updating event status).
- **Triggers & PL/pgSQL Functions**:
  - Trigger Function: `public.fn_audit_donation_status_change()`
  - Trigger: `trg_donation_status_audit AFTER UPDATE OF status ON public.donations FOR EACH ROW`
  - Automatically records every lifecycle change into `audit_logs` without requiring application-level boilerplate.
- **Database Views**:
  - `v_available_donations`: Computes live expiry windows (`hours_until_expiry`).
  - `v_ngo_capacity_summary`: Computes aggregate delivery completion metrics.

---

## 🚀 CO2 — DATABASE ENGINEERING & VECTOR SEARCH

### 2.1 SQL vs. NoSQL Comparative Study & Polyglot Persistence
MealBridge operates a dual-database architecture:
1. **PostgreSQL 16 (Relational/ACID)**:
   - Houses transactional data requiring strict consistency, foreign keys, and ACID guarantees (`users`, `donations`, `matches`, `assignments`).
2. **MongoDB 7.0 (Document/BSON)**:
   - Houses unstructured telemetry, high-velocity user actions, and activity streams without schema lock-in (`mealbridge_activity`).

### 2.2 MongoDB Document Engineering
- **CRUD Operations**: Document insertion and querying via Motor (Python) and Mongoose/native driver (Node.js).
- **Aggregation Pipeline**: Implemented in `/api/activity/stats` utilizing `$group` and `$sort` stages to compute action frequencies and temporal distributions.

### 2.3 Vector Database & Embeddings
- **Vector Dimension**: 384 dimensions matching `all-MiniLM-L6-v2` dense embeddings.
- **Metric**: Cosine similarity (`cosine_similarity(v1, v2)`), clamping normalized dot products to `[0.0, 1.0]`.
- **pgvector Integration**:
  - Database table `kb_chunks` utilizes `embedding vector(384)`.
  - Database migration `database/migrations/001_syllabus_features.sql` applies pgvector extensions and query mechanisms.

### 2.4 Grounded Retrieval-Augmented Generation (RAG)
Implemented in `backend/app/services/rag_service.py`:
- **Query Embedding**: User input is vectorized into 384-dimensional space.
- **Top-K Vector Retrieval**: Semantically retrieves matching records from `donations`, `ngos`, and `events`.
- **Context Construction**: Formats verified database facts with explicit citation headers `[Source N - ENTITY #ID]`.
- **Strict Grounding**: When no external LLM key is configured, a deterministic domain synthesis engine compiles verified answers directly from retrieved records, completely eliminating hallucinations.
- **Audit Logging**: Every RAG retrieval query and response is recorded in `rag_retrieval_logs`.

---

## ⚡ CO3 — BACKEND API ENGINEERING

### 3.1 FastAPI RESTful API Design & OpenAPI Contracts
- Full adherence to REST conventions (`GET`, `POST`, `PUT`, `DELETE`).
- Automatic interactive documentation generated at `/docs` (Swagger UI) and `/redoc` (ReDoc).
- Pydantic v2 schemas validating request payloads and enforcing strict typing.

### 3.2 Authentication, Security & Rate Limiting
- **JWT Authentication**: OAuth2 Password bearer flow producing signed tokens with user ID and role claims (`backend/app/core/security.py`).
- **Role-Based Access Control (RBAC)**: Role checks guarding endpoints (`DONOR`, `NGO`, `VOLUNTEER`, `ADMIN`).
- **Argon2 Password Hashing**: State-of-the-art memory-hard hashing preventing GPU dictionary attacks.
- **Sliding-Window Rate Limiting**: In-memory rate limiter (`backend/app/core/rate_limiter.py`) protecting OTP generation (5 req/min) and login attempts (10 req/min).

### 3.3 Monolith Layered Architecture
Strict separation of concerns across:
- `app/routers/`: HTTP routing, request parsing, and status code handling.
- `app/services/`: Business logic, matching algorithms, RAG pipelines, email dispatch.
- `app/models/`: SQLAlchemy 2.0 ORM declarations.
- `app/schemas/`: Pydantic input/output contracts.
- `app/core/`: Security, rate limiters, configurations.
- `app/db/`: Asynchronous engine and session lifecycles.

---

## 🟢 CO4 — MULTI-FRAMEWORK BACKEND ENGINEERING

### 4.1 Node.js / Express Microservice
- Located in `microservices/activity-service/`.
- Demonstrates event-loop non-blocking I/O handling high-throughput telemetry.
- Provides endpoints for activity logging (`POST /api/activity/log`), real-time feeds (`GET /api/activity/feed`), and analytics aggregation (`GET /api/activity/stats`).
- Dual runtime support: operates with zero external dependencies via native Node.js HTTP engine or via Express/Mongoose when node modules are present.

---

## 🔄 CO5 — MICROSERVICES ENGINEERING

### 5.1 Service Decomposition & Database-Per-Service
- Monolith Core (FastAPI) owns PostgreSQL `MealBridge_food_donation`.
- Activity Telemetry Microservice (Node.js) owns MongoDB `mealbridge_activity`.
- Neither service directly mutates the other's database, honoring the fundamental microservices principle of loose coupling.

### 5.2 API Gateway Pattern
Implemented in `backend/app/routers/activities.py`:
- Routes client requests through the FastAPI gateway to the internal Node.js service.
- Performs **Token Forwarding** (`Authorization` header pass-through).
- Implements **Circuit Breaker Fallback**: If the microservice container is offline or unreachable, the gateway intercepts the timeout and returns a cached/in-memory response, preventing client-facing 500 errors.

---

## 🐳 CO6 — DEPLOYMENT, OBSERVABILITY & DELIVERY

### 6.1 Containerization with Docker & Docker Compose
- `docker-compose.yml` orchestrates 6 distinct services:
  1. `mealbridge-db` (PostgreSQL 16 + pgvector)
  2. `mealbridge-mongo` (MongoDB 7.0)
  3. `mealbridge-backend` (FastAPI)
  4. `mealbridge-activity-service` (Node.js)
  5. `mealbridge-frontend` (React + Nginx)
  6. `mealbridge-pgadmin` (pgAdmin 4)
- Multi-stage frontend build optimizes image size and serves production bundles with Nginx.

### 6.2 Observability & Health Monitoring
- Health check probes at `/health` verifying PostgreSQL connectivity, MongoDB status, and system timestamps.
- Prometheus metrics endpoint at `/metrics` exporting request counts, process memory, and error statistics.

---

## ✅ Summary Verification

All 6 syllabus Course Outcomes and the 5 specific features requested by the sir have been integrated, tested, and verified.
