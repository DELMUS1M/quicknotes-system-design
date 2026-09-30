# QuickNotes High-Availability System Architecture

This document presents the system design, load estimations, architectural topology, request lifecycle flows, and trade-offs for scaling **QuickNotes** to 1 million active users.

---

## 1. Requirements

### **Functional Requirements:**
- Users can create, view, edit, and delete text notes.
- Users can attach tags to notes and search notes by title/text.
- Notes must persist reliably across sessions and sync across devices.

### **Non-Functional Requirements:**
- **High Availability:** 99.9% uptime (less than 8.76 hours downtime/year).
- **Low Latency:** Read operations < 50ms, Write operations < 100ms.
- **Scalability:** System must handle 1 million registered users effortlessly.
- **Data Durability:** Zero data loss for saved notes.

---

## 2. Load & Capacity Estimations (1 Million Users)

### **Base Assumptions:**
- **Total Registered Users:** 1,000,000
- **Daily Active Users (DAU):** 10% = 100,000 active users/day
- **User Activity:** Each active user reads notes 20 times/day and creates/updates 2 notes/day.
- **Average Note Size:** 1 KB (including title, body, and metadata).

### **Throughput Calculations:**
1. **Reads per Second:**
   - Total Daily Reads = 100,000 × 20 = 2,000,000 reads/day
   - Average Reads/sec = 2,000,000 / 86,400 ≈ **23.15 reads/sec**
   - Peak Reads/sec (5× multiplier) = 23.15 × 5 = **115.75 reads/sec**

2. **Writes per Second:**
   - Total Daily Writes = 100,000 × 2 = 200,000 writes/day
   - Average Writes/sec = 200,000 / 86,400 ≈ **2.31 writes/sec**
   - Peak Writes/sec (5× multiplier) = 2.31 × 5 = **11.57 writes/sec**

3. **Annual Storage Growth:**
   - Total Daily Notes = 200,000 notes/day
   - Daily Storage = 200,000 × 1 KB = 200,000 KB = 200 MB/day
   - Annual Storage = 200 MB × 365 days = **73,000 MB ≈ 73 GB/year**

*Conclusion:* The workload is **read-heavy (10:1 ratio)**, requiring heavy read-caching strategies.

---

## 3. System Architecture Diagram

```text
                                  +-------------------+
                                  |    Client App     |
                                  |  (Browser/Mobile) |
                                  +---------+---------+
                                            |
                                            v
                                  +-------------------+
                                  |    DNS (Route53)  |
                                  +---------+---------+
                                            |
                                            v
                                  +-------------------+
                                  |  CDN (Cloudflare) |  <--- Caches Static Assets (JS/CSS)
                                  +---------+---------+
                                            |
                                            v
                                  +-------------------+
                                  |   Load Balancer   |  <--- AWS ALB (SSL Termination)
                                  +---------+---------+
                                            |
                          +-----------------+-----------------+
                          |                                   |
                          v                                   v
                +-------------------+               +-------------------+
                |   App Server 1    |               |   App Server 2    |
                |  (Node.js REST)   |               |  (Node.js REST)   |
                +---------+---------+               +---------+---------+
                          |                                   |
            +-------------+-------------+                     |
            |                           |                     |
            v                           v                     v
   +-----------------+        +------------------+   +-------------------+
   | Cache (Redis)   |        | Primary DB       |   | Message Queue     |
   | (User Notes)    |        | (PostgreSQL Write|   | (RabbitMQ / SQS)  |
   +-----------------+        +--------+---------+   +---------+---------+
                                       |                       |
                                       v                       v
                              +------------------+   +-------------------+
                              | Read Replica DB  |   | Background Worker |
                              | (PostgreSQL Read)|   | (Index & Email)   |
                              +------------------+   +-------------------+
```

---

## 4. Component Descriptions

1. **Client App:** Web browser running the API client interface.
2. **DNS (Route 53):** Resolves `api.quicknotes.com` domain to the Load Balancer IP addresses.
3. **CDN (Cloudflare):** Caches static web assets (`index.html`, `style.css`, `api.js`) globally at edge locations.
4. **Load Balancer (AWS ALB):** Distributes incoming HTTPS requests across multiple application servers.
5. **App Servers (Node.js/Express):** Stateless web servers executing business logic, validation, and database queries.
6. **Cache (Redis Cluster):** In-memory cache holding hot user notes to deliver sub-10ms read latency.
7. **Primary Database (PostgreSQL Write):** Handles insert, update, and delete transactions with full ACID guarantees.
8. **Read Replica Database (PostgreSQL Read):** Asynchronously mirrors the primary database to serve all read queries.
9. **Message Queue (RabbitMQ):** Decouples background processing tasks (search indexing, email notifications).
10. **Background Worker:** Consumes queue tasks asynchronously without blocking HTTP response cycles.

---

## 5. Request Lifecycle Flows

### **Flow A: `GET /notes` (Read Request)**
1. Client sends `GET /api/v1/notes` request to Load Balancer.
2. Load Balancer forwards request to an available **App Server**.
3. App Server checks **Redis Cache** for key `user:usr_99210:notes`.
4. **Cache Hit:** Redis returns note list instantly (sub-10ms); App Server responds to Client with `200 OK`.
5. **Cache Miss:** App Server queries **Read Replica Database**, populates Redis Cache, and returns `200 OK` to Client.

### **Flow B: `POST /notes` (Write Request)**
1. Client submits form data via `POST /api/v1/notes` with JSON payload.
2. Load Balancer routes request to an **App Server**.
3. App Server validates title length and required attributes.
4. App Server executes `INSERT` query on **Primary Database** (`201 Created`).
5. App Server invalidates/updates the user's Redis cache key (`user:usr_99210:notes`).
6. App Server publishes a `note_created` message to **Message Queue** for background search indexing.
7. App Server returns `201 Created` HTTP response to Client with created note JSON.

---

## 6. Single Point of Failure (SPOF) & Trade-Offs

### **Mitigating Single Points of Failure (SPOF):**
- **App Tier:** Multiple stateless app servers deployed across 2+ Availability Zones behind an Auto Scaling Group.
- **Database Tier:** Primary PostgreSQL configured with automatic failover to a Standby replica using Multi-AZ deployment.
- **Cache Tier:** Redis deployed in Cluster mode with primary/replica shards.

### **System Trade-Offs:**
1. **Cache Consistency vs. Read Speed:**
   - *Trade-off:* We use a Cache-Aside strategy with TTL. Updating cache on write guarantees speed, but occasional asynchronous replication lag from Primary to Read Replica might briefly show stale data if cache is bypassed.
2. **Asynchronous Worker Processing vs. Immediate Consistency:**
   - *Trade-off:* Pushing search indexing to background workers keeps HTTP POST response times under 50ms, but search results may take ~1 second to reflect newly added notes.
