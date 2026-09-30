# QuickNotes System Design & API Client

This repository contains the complete capstone implementation for **QuickNotes**, covering both an interactive JavaScript API client harness and full production system design documentation for scaling the service to 1 million active users.

---

## 1. Project Overview

QuickNotes has evolved from a browser-only prototype into a scalable cloud web service. This repository demonstrates:
1. **Interactive API Client**: A vanilla JS front-end integrating with a REST API (`https://jsonplaceholder.typicode.com/posts`) featuring GET, POST, and DELETE capabilities, input validation, and user feedback states.
2. **Production System Documentation**: Architectural blueprints, database schemas, REST specifications, and scaling strategies for supporting 1M active users.

---

## 2. Repository Documentation Links

All backend system design documentation is located inside the [`docs/`](./docs) folder:

- 📄 **[API Design Documentation (`docs/api-design.md`)](./docs/api-design.md)** - Complete REST endpoint table, JSON payload schemas, and error status code definitions.
- 🗄️ **[Data Model Documentation (`docs/data-model.md`)](./docs/data-model.md)** - Relational ERD schema, `CREATE TABLE` DDLs, indexed query strategies, and SQL vs. NoSQL analysis.
- 🏗️ **[Architecture & Scaling Plan (`docs/architecture.md`)](./docs/architecture.md)** - System topology diagram, 1M user load calculations, request lifecycle flows, SPOF mitigation, and trade-offs.

---

## 3. How to Run the API Client Locally

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/DELMUS1M/quicknotes-system-design.git
   cd quicknotes-system-design
   ```

2. **Launch the Application:**
   - Open `index.html` directly in any web browser (Chrome, Firefox, Edge, Safari).
   - Alternatively, open the directory in Visual Studio Code and launch using the **Live Server** extension.

3. **Test API Features:**
   - Click **"Load notes"** to execute a `GET` request fetching 10 posts.
   - Use the **"Create New Note"** form to submit a `POST` request (validates title length ≤ 100 chars).
   - Click **"Delete"** on any note card to fire a `DELETE` HTTP request.

---

## 4. What I Learned

1. **Asynchronous API Integration & State Management**: Mastered handling `async`/`await` HTTP cycles with `fetch()`, disabling UI controls during requests, and managing distinct loading, success, error, and empty status UI states.
2. **Relational Database Design & Indexing**: Designed a 1NF/2NF/3NF database schema featuring 1:N and N:M relationships with join tables, and optimized query execution using composite B-Tree indexes.
3. **High-Availability Cloud System Architecture**: Learned how to estimate traffic loads (RPS and annual storage), structure read-heavy caching layers with Redis and read replicas, and eliminate Single Points of Failure (SPOF) using load balancers and Multi-AZ deployments.
