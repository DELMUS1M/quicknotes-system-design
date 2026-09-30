/**
 * QuickNotes API Client
 * Interfaces with JSONPlaceholder mock REST API
 */

const API_URL = "https://jsonplaceholder.typicode.com/posts";

// DOM Element Selections using querySelector
const loadBtn = document.querySelector("#load-btn");
const submitBtn = document.querySelector("#submit-btn");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const notesList = document.querySelector("#notes-list");
const statusMsg = document.querySelector("#status");

// In-memory array store for notes loaded from server and created client-side
let notes = [];

/**
 * Displays feedback messages on screen with styled status classes
 * @param {string} text - Message content
 * @param {'loading'|'success'|'error'|'info'} type - Status theme
 */
function setStatus(text, type = "info") {
  statusMsg.textContent = text;
  statusMsg.className = `status-msg show ${type}`;
}

/**
 * Reusable helper function calling fetch, checking response.ok, throwing errors
 * @param {string} url - Target Endpoint
 * @param {object} options - Fetch Configuration
 * @returns {Promise<any>} Parsed JSON response
 */
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`HTTP Error ${response.status}: ${response.statusText || errorText}`);
  }

  // 204 No Content handling
  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

/**
 * Renders notes list safely using createElement and textContent (NO innerHTML)
 */
function renderNotes() {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "empty-state";
    emptyLi.textContent = "No notes available. Click 'Load notes' or create one above.";
    notesList.appendChild(emptyLi);
    return;
  }

  notesList.append(
    ...notes.map((note) => {
      const li = document.createElement("li");
      li.className = "note-item";

      const bodyDiv = document.createElement("div");
      bodyDiv.className = "note-body";

      const h3 = document.createElement("h3");
      h3.className = "note-title";
      h3.textContent = note.title;

      const p = document.createElement("p");
      p.className = "note-text";
      p.textContent = note.body || "(No content)";

      bodyDiv.appendChild(h3);
      bodyDiv.appendChild(p);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-delete";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteNote(note.id));

      li.appendChild(bodyDiv);
      li.appendChild(deleteBtn);

      return li;
    })
  );
}

/**
 * Task 1: Load 10 notes (GET request)
 */
async function loadNotes() {
  loadBtn.disabled = true;
  setStatus("Loading notes...", "loading");

  try {
    const data = await request(`${API_URL}?_limit=10`);
    notes = data;
    renderNotes();

    if (notes.length === 0) {
      setStatus("Server returned 0 notes.", "info");
    } else {
      setStatus(`Loaded ${notes.length} notes from the server.`, "success");
    }
  } catch (err) {
    console.error("GET Request failed:", err);
    setStatus(`Failed to load notes: ${err.message}`, "error");
  } finally {
    loadBtn.disabled = false;
  }
}

/**
 * Task 2: Create a note (POST request)
 */
async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  // Client-side Validation
  if (!title) {
    setStatus("Validation Error: Title is required.", "error");
    return;
  }

  if (title.length > 100) {
    setStatus("Validation Error: Title must be 100 characters or fewer.", "error");
    return;
  }

  submitBtn.disabled = true;
  setStatus("Creating note on server...", "loading");

  try {
    const newNotePayload = {
      title: title,
      body: body,
      userId: 1,
    };

    // Send POST request
    const createdNote = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(newNotePayload),
    });

    // Add returned note to the top of the local list
    notes.unshift(createdNote);
    renderNotes();

    // Reset form fields
    noteForm.reset();

    setStatus(`Note created (status 201, id ${createdNote.id}).`, "success");
  } catch (err) {
    console.error("POST Request failed:", err);
    setStatus(`Failed to create note: ${err.message}`, "error");
  } finally {
    submitBtn.disabled = false;
  }
}

/**
 * Task 3: Delete a note (DELETE request)
 * Note on Mock API Behavior:
 * JSONPlaceholder is a mock API. When you send POST requests, it responds with status 201
 * and an ID (e.g. 101), but does NOT actually persist the item on its backend database.
 * Therefore, subsequent DELETE /posts/101 requests will fail on the remote server with HTTP 404.
 * To provide a realistic user experience:
 * - For fake client-created IDs (> 100), we mock the network deletion success locally.
 * - For real mock IDs (1-100), we send the actual DELETE /posts/{id} HTTP request.
 */
async function deleteNote(id) {
  setStatus(`Deleting note #${id}...`, "loading");

  try {
    if (id > 100) {
      // Mock deletion for client-created transient items
      notes = notes.filter((note) => note.id !== id);
      renderNotes();
      setStatus(`Note #${id} deleted successfully (local mock sync).`, "success");
      return;
    }

    // Actual DELETE call for server-known IDs
    await request(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    notes = notes.filter((note) => note.id !== id);
    renderNotes();
    setStatus(`Note #${id} deleted successfully (status 200/204).`, "success");
  } catch (err) {
    console.error("DELETE Request failed:", err);
    setStatus(`Failed to delete note #${id}: ${err.message}`, "error");
  }
}

// Event Listeners
loadBtn.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

// Initial empty state display
renderNotes();
