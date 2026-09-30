# QuickNotes Relational Data Model

This document outlines the database schema, entity relationships, DDL queries, index strategy, and relational architectural decisions for the QuickNotes backend database.

---

## 1. Entities & Schema Specification

The schema consists of four core relational tables:

1. **`users`**: Manages registered user accounts and authentication credentials.
2. **`notes`**: Stores note titles, bodies, and author ownership references.
3. **`tags`**: Stores unique user-defined tag labels (e.g., Work, Personal, Study).
4. **`note_tags`**: Join table managing the many-to-many relationships between notes and tags.

---

## 2. Entity Relationships

- **One-to-Many (1:N)**: `users` → `notes`
  - A single user can create many notes. Each note belongs to exactly one user (`user_id` foreign key on `notes`).
- **Many-to-Many (N:M)**: `notes` ↔ `tags`
  - A note can have multiple tags, and a tag can be attached to multiple notes. This is resolved via the `note_tags` join table containing foreign keys `note_id` and `tag_id`.

---

## 3. SQL DDL Statements (`CREATE TABLE`)

```sql
-- Enable Foreign Key constraints
PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Notes Table
CREATE TABLE notes (
    note_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Tags Table
CREATE TABLE tags (
    tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

-- 4. Note-Tags Join Table (Many-to-Many Bridge)
CREATE TABLE note_tags (
    note_id VARCHAR(36) NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);
```

---

## 4. Example SQL Queries

### Query 1: Fetch paginated notes for a user with author details (`JOIN`)
```sql
SELECT n.note_id, n.title, n.body, n.created_at, u.full_name AS author_name, u.email
FROM notes n
JOIN users u ON n.user_id = u.user_id
WHERE n.user_id = 'usr_99210'
ORDER BY n.created_at DESC
LIMIT 10 OFFSET 0;
```

### Query 2: Fetch notes associated with a specific tag name ('work')
```sql
SELECT n.note_id, n.title, n.body, t.name AS tag_name
FROM notes n
JOIN note_tags nt ON n.note_id = nt.note_id
JOIN tags t ON nt.tag_id = t.tag_id
WHERE n.user_id = 'usr_99210' AND t.name = 'work'
ORDER BY n.created_at DESC;
```

### Query 3: Count total notes per tag for a user (`GROUP BY`)
```sql
SELECT t.name AS tag_name, COUNT(nt.note_id) AS total_notes
FROM tags t
LEFT JOIN note_tags nt ON t.tag_id = nt.tag_id
WHERE t.user_id = 'usr_99210'
GROUP BY t.tag_id, t.name;
```

---

## 5. Indexing Strategy

```sql
CREATE INDEX idx_notes_user_created ON notes(user_id, created_at DESC);
```

### **Reason for Indexing:**
In QuickNotes, the single most frequent database operation is querying a user's recent notes ordered by creation date (`WHERE user_id = ? ORDER BY created_at DESC`). Without an index, PostgreSQL or SQLite must perform a full table scan over millions of rows across all users. The composite B-Tree index on `(user_id, created_at DESC)` allows the engine to jump directly to the specific user's pre-sorted index block in `O(log N)` time, dramatically cutting query execution times from hundreds of milliseconds to under 1 millisecond.

---

## 6. Storage Decision: SQL vs. NoSQL Justification

We chose a **Relational SQL Database (PostgreSQL)** over a NoSQL document database for QuickNotes. QuickNotes data is highly structured with clear relational dependencies (users own notes, notes link to tags via a join table). SQL databases enforce strict ACID compliance, preventing orphaned tag references and guaranteeing data durability during user actions. PostgreSQL also provides robust indexing options and native JSONB columns if unstructured metadata is ever needed in the future, offering the ideal balance of strict consistency and performance.
