# MealBridge AI — Syllabus Gap Analysis & Feature Extension Mapping

**Project**: MealBridge AI — Food Donation & Redistribution Platform  
**Target Syllabus**: Relational Database & Backend API Engineering (CO1 — CO6)  
**Evaluation Date**: October 2026  
**Status**: Comprehensive Baseline Audited

---

## 1. Executive Summary

A deep architectural inspection was conducted across:
1. **Source of Truth 1 (Codebase)**: Extracted from `MealBridge (2).zip` — React 18 + Vite frontend, FastAPI async backend, SQLAlchemy models, Pydantic schemas, and MongoDB OTP integration.
2. **Source of Truth 2 (Database Backup)**: Extracted from `MealBridge_food_donation.backup` (PostgreSQL custom format 1.16, restored to full SQL schema and data with 12 tables and 119 catalog objects).

The project already exhibits strong foundations in **Relational Database Engineering**, **RBAC Authentication**, **Geo-Spatial Haversine NGO Matching**, and **Multi-Role User Portals** (Donor, NGO, Volunteer, Admin). However, critical gaps exist with respect to **pgvector Semantic Search**, **Grounded RAG**, **Email Dispatch**, **Event-Based Surplus Food Lifecycles**, **Advanced SQL Constructs (Views, Triggers, Window Functions)**, and **Multi-Service / Polyglot Architecture Demonstrations**.

---

## 2. Existing Feature Inventory

| Existing Feature | Location / File | Current Status | Action |
|---|---|---|---|
| User Authentication (Register/Login) | `backend/app/routers/auth.py`, `src/pages/Login.jsx` | Fully Functional (Argon2id + JWT + OTP verification) | **KEEP** (Coexist with new features) |
| Role-Based Access Control (RBAC) | `backend/app/core/dependencies.py` (`require_role`) | Fully Functional (`ADMIN`, `DONOR`, `NGO`, `VOLUNTEER`) | **KEEP** |
| Surplus Food Donation Lifecycle | `backend/app/routers/donations.py`, `src/pages/DonateFood.jsx` | Fully Functional (POSTED → MATCHED → ASSIGNED → DELIVERED) | **KEEP & EXTEND** (Hook into Event Surplus) |
| Deterministic NGO Matching | `backend/app/services/matching_service.py` | Fully Functional (Haversine 25% + Qty 20% + Expiry 25% + Capacity 20% + Req 10%) | **KEEP STRICTLY PRESERVED** (Hybridized with Semantic Search) |
| Delivery Coordination & Realtime GPS | `backend/app/routers/delivery_tracking.py`, `src/pages/volunteer/LiveTracking.jsx` | Fully Functional (GPS telemetry logging, status progression) | **KEEP** |
| Delivery Confirmation (Photos/Remarks) | `backend/app/routers/delivery_confirmations.py`, `src/pages/volunteer/Delivery.jsx` | Fully Functional (Dual verification with audit logging) | **KEEP** |
| In-App Notifications | `backend/app/services/notification_service.py`, `src/pages/DonorNotifications.jsx` | Fully Functional (PostgreSQL notifications table) | **KEEP & EXTEND** (Mirror with Email notifications) |
| System Audit Trail | `backend/app/services/audit_service.py`, `src/pages/admin/AdminAuditLogs.jsx` | Fully Functional (Audit log capture on all major domain events) | **KEEP** |
| MongoDB OTP Temporary Storage | `backend/app/db/mongo.py`, `backend/app/services/otp_service.py` | Functional (6-digit HMAC-SHA256, 5 min TTL, 5 max attempts) | **KEEP & ENHANCE** (Rate-limiting & cooldown) |
| PostgreSQL Relational Store | `backend/app/db/postgres.py`, `MealBridge_food_donation_restored.sql` | Fully Functional (12 tables, foreign keys, constraints) | **KEEP & EXTEND** (Add additive tables for Events & RAG logs) |
| pgvector Extension & HNSW Indexes | Present in PostgreSQL backup (`vector(384)`, 3 HNSW indexes) | Schema Ready, Unwired in Backend | **ACTIVATE & IMPLEMENT** |
| Interactive Maps | `src/components/MapView.jsx`, Leaflet integration | Fully Functional (Live markers, routing preview) | **KEEP** |

---

## 3. Syllabus Mapping (CO1 to CO6)

### CO1 — Relational Database Engineering

| Syllabus Requirement | Existing Implementation | Gap / Missing Elements | Planned Enhancement |
|---|---|---|---|
| **DBMS Architecture & 3-Schema Model** | Internal PostgreSQL engine, physical storage + conceptual models | Missing explicit external schema views | Introduce PostgreSQL database views (`v_available_donations`, `v_ngo_capacity_summary`) |
| **ER Modeling & Normalization** | 12 Normalized 3NF tables in PostgreSQL backup | Fully aligned with 3NF; lacks Event domain entities | Add additive `events` and `event_food_declarations` tables with 3NF FK relations |
| **Advanced SQL (Joins, CTEs, Aggregates)** | Basic inner/left joins in SQLAlchemy routers | No explicit Common Table Expressions (CTEs) or Window functions demonstrated | Add advanced SQL analytics module demonstrating CTEs (recursive/multi-stage), `DENSE_RANK()`, `ROW_NUMBER()` |
| **Transactions & Stored Logic (ACID, MVCC)** | SQLAlchemy async commit/rollback, row-level updates | No database triggers or stored functions in backup | Implement safe database triggers for auto-updating audit logs and donation status validation |

---

### CO2 — Database Engineering (Polyglot, NoSQL & Vector DB)

| Syllabus Requirement | Existing Implementation | Gap / Missing Elements | Planned Enhancement |
|---|---|---|---|
| **SQL vs NoSQL Comparative Study** | PostgreSQL used for relational core; MongoDB used for OTPs | No comparative architectural documentation or activity storage | Add MongoDB Activity & Audit Stream service; document CAP/ACID trade-offs in docs |
| **MongoDB Document Engineering** | `AsyncMongoClient` with `otp_records` collection | Basic CRUD only; no aggregation pipelines or indexes | Add MongoDB compound indexes and aggregation pipelines for search & activity metrics |
| **Vector Database Foundations** | Schema contains `vector(384)` on `donations`, `ngos`, `kb_chunks` with HNSW indexes | No embedding generation model or similarity search API in FastAPI | Integrate lightweight embedding pipeline (`all-MiniLM-L6-v2`, 384-dim) matching existing schema |
| **Vector DB Implementation & Hybrid Search** | HNSW index defined in DB backup | No search router or hybrid scoring algorithm | Implement `GET /api/search/semantic` with hybrid weighted ranking (Cosine Similarity + Business Rules) |
| **Basic RAG (Retrieval-Augmented Gen)** | `kb_chunks` table with 11 domain documentation chunks exists | No RAG orchestration, context builder, or LLM grounding endpoint | Implement `POST /api/rag/query` with pgvector retrieval, strict context grounding, and fallback |

---

### CO3 — Backend API Engineering

| Syllabus Requirement | Existing Implementation | Gap / Missing Elements | Planned Enhancement |
|---|---|---|---|
| **FastAPI RESTful Architecture** | Layered architecture (`routers/`, `services/`, `models/`, `schemas/`) | Compliant, clean OpenAPI schema | Maintain full OpenAPI (`/docs`) compliance across all new routes |
| **Pydantic Validation & Async DI** | Pydantic v2 schemas for all requests/responses | Fully implemented | Add schemas for Events, Semantic Search, RAG, and Email notifications |
| **Authentication & Security** | JWT (HS256) + Argon2id password hashing + MongoDB OTP | Rate-limiting missing on sensitive endpoints | Add in-memory / Redis rate limiter middleware on OTP, login, and RAG routes |
| **Testing & Coverage** | 26 isolated unit tests in `backend/test_*.py` | Tests cannot execute due to Windows `.pyd` dependencies in imported venv | Establish macOS-compatible virtualenv; create unified pytest test suite for all modules |

---

### CO4 — Multi-Framework Backend Engineering

| Syllabus Requirement | Existing Implementation | Gap / Missing Elements | Planned Enhancement |
|---|---|---|---|
| **Node.js / Express Service** | None in active project | Missing syllabus demonstration of Node.js / Express | Provide lightweight, independent `services/activity-service` (Express + MongoDB) for telemetry/activity |
| **Spring Boot Supporting Service** | None in active project | Missing syllabus demonstration of Spring Boot | Provide lightweight independent `services/notification-service` (Spring Boot 3 + JPA) as documented reference |

---

### CO5 — Microservices Engineering

| Syllabus Requirement | Existing Implementation | Gap / Missing Elements | Planned Enhancement |
|---|---|---|---|
| **Service Boundaries & DB-per-Service** | Core monolith with MongoDB polyglot persistence | Microservice boundaries not formalized | Architect clear logical boundaries: Core API (Postgres), Activity Service (Mongo), Notification Dispatch |
| **API Gateway & Routing** | FastAPI handles all routing | Gateway token forwarding not explicitly demonstrated | Configure FastAPI gateway router with token forwarding and standardized error middleware |
| **Distributed Transactions (Saga / Compensation)** | Sequential DB commits | Compensating actions not formalized | Document & implement automated compensation: if assignment fails, revert donation to `POSTED`/`MATCHED` |

---

### CO6 — Deployment, Observability & Delivery

| Syllabus Requirement | Existing Implementation | Gap / Missing Elements | Planned Enhancement |
|---|---|---|---|
| **Docker & Docker Compose** | Missing root Dockerfile & compose in active ZIP | Cannot run with one command | Provide production-grade `Dockerfile` (frontend & backend) and multi-service `docker-compose.yml` |
| **Observability (Logging & Metrics)** | Basic print/logging statements | Missing `/health`, structured JSON logging, Prometheus metrics | Add `/health` endpoint, request-id middleware, and Prometheus `/metrics` exporter |
| **CI/CD & Documentation** | `README.md` is minimal (188 bytes) | Missing C4 diagrams, ER diagrams, test pipelines | Create comprehensive `README.md`, `SYLLABUS_COVERAGE.md`, and C4 architecture diagrams |

---

## 4. Prioritized Feature Extension Plan

1. **Feature A — Semantic Search**:
   - Leverage existing `donations.embedding` and `ngos.embedding` `vector(384)` with `USING hnsw`.
   - Embed incoming queries using 384-dimensional cosine similarity.
   - Dual-tier matching: Semantic retrieval rank + Existing deterministic score validation.
2. **Feature B — Basic Grounded RAG**:
   - Query `kb_chunks`, `donations`, and `ngos` using vector cosine distance (`<=>`).
   - Ground context builder strictly preventing hallucinations.
   - LLM generation with graceful local fallback if API key is unconfigured.
3. **Feature C — Hardened OTP & Rate Limiter**:
   - Add sliding-window / token-bucket rate limiter.
   - Resend cooldown (60 seconds) and brute-force attempt lockout.
4. **Feature D — Email Communication Service**:
   - Pluggable `EmailService` with mock/console fallback for dev and SMTP for production.
   - Triggers for: Donation Created, Match Found, Delivery Assigned, OTP Dispatch, Delivery Delivered.
5. **Feature E — Event-Based Food Redistribution**:
   - Model `events` table (wedding, birthday, corporate) with attendee count and surplus estimation.
   - Direct 1-click action: "Convert Leftover Food to Donation" feeding into the existing donation workflow.
