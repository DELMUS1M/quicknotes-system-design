# QuickNotes REST API Specifications

This document defines the production RESTful API specifications for the scalable **QuickNotes** cloud backend platform.

---

## 1. Base URL & Versioning

- **Production Base URL:** `https://api.quicknotes.com/v1`
- **Data Format:** `application/json` (UTF-8 encoded)
- **Authentication:** Bearer JWT Token passed in `Authorization: Bearer <token>` header

---

## 2. API Endpoints Table

| Method | Endpoint Path | Description | Success Status | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1/notes` | List paginated notes for authenticated user | `200 OK` | Yes |
| **`POST`** | `/api/v1/notes` | Create a new note record | `201 Created` | Yes |
| **`GET`** | `/api/v1/notes/{id}` | Retrieve details of a specific note | `200 OK` | Yes |
| **`PUT`** | `/api/v1/notes/{id}` | Replace an existing note completely | `200 OK` | Yes |
| **`PATCH`**| `/api/v1/notes/{id}` | Partially update note attributes | `200 OK` | Yes |
| **`DELETE`**| `/api/v1/notes/{id}` | Delete a note by ID | `204 No Content`| Yes |
| **`GET`** | `/api/v1/tags` | Retrieve all tags for user | `200 OK` | Yes |

---

## 3. Request & Response Examples

### A. Creating a Note (`POST /api/v1/notes`)

#### **Request Headers:**
```http
POST /api/v1/notes HTTP/1.1
Host: api.quicknotes.com
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
Content-Type: application/json
```

#### **Request Body:**
```json
{
  "title": "System Architecture Review",
  "body": "Finalize Redis caching layer and read replica configurations.",
  "tag_ids": [10, 14]
}
```

#### **Response (`201 Created`):**
```json
{
  "status": "success",
  "data": {
    "id": "f8a29b41-3a0c-4b3c-99d1-81f129a022d4",
    "user_id": "usr_99210",
    "title": "System Architecture Review",
    "body": "Finalize Redis caching layer and read replica configurations.",
    "tags": [
      { "id": 10, "name": "work" },
      { "id": 14, "name": "architecture" }
    ],
    "created_at": "2026-09-30T14:30:00Z",
    "updated_at": "2026-09-30T14:30:00Z"
  }
}
```

---

### B. Listing Notes (`GET /api/v1/notes?page=1&limit=10&tag=work`)

#### **Request Headers:**
```http
GET /api/v1/notes?page=1&limit=10&tag=work HTTP/1.1
Host: api.quicknotes.com
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

#### **Response (`200 OK`):**
```json
{
  "status": "success",
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "total_pages": 5
  },
  "data": [
    {
      "id": "f8a29b41-3a0c-4b3c-99d1-81f129a022d4",
      "user_id": "usr_99210",
      "title": "System Architecture Review",
      "body": "Finalize Redis caching layer and read replica configurations.",
      "tags": [
        { "id": 10, "name": "work" }
      ],
      "created_at": "2026-09-30T14:30:00Z",
      "updated_at": "2026-09-30T14:30:00Z"
    }
  ]
}
```

---

## 4. Error Handling & HTTP Status Codes

The QuickNotes API returns standard HTTP status codes along with a consistent structured error JSON body.

### **Supported HTTP Error Codes:**
- **`400 Bad Request`**: Validation failure or malformed JSON payload.
- **`401 Unauthorized`**: Missing or expired Bearer authentication token.
- **`403 Forbidden`**: Authenticated user lacks permission to access requested resource.
- **`404 Not Found`**: Target note or endpoint resource does not exist.
- **`500 Internal Server Error`**: Unexpected system or database exception.

### **Example Error Response Payload (`400 Bad Request`):**
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload attributes.",
    "details": [
      {
        "field": "title",
        "issue": "Title is required and must not exceed 100 characters."
      }
    ],
    "timestamp": "2026-09-30T14:32:10Z"
  }
}
```
