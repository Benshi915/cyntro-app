/**
 * API client — all calls to the FastAPI backend (localhost:8000).
 */

const BASE = process.env.API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Prompt ────────────────────────────────────────────────────────────────────

export async function buildPrompt({ query, persona = null, numChunks = 5 }) {
  return request("/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, persona, num_chunks: numChunks }),
  });
}

export async function routeQuery(q) {
  return request(`/route?q=${encodeURIComponent(q)}`);
}

// ── Ingestion ─────────────────────────────────────────────────────────────────

export async function ingestYoutube({ url, whisperModel = "base" }) {
  return request("/ingest/youtube", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, whisper_model: whisperModel }),
  });
}

export async function ingestUrl({ url }) {
  return request("/ingest/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export async function ingestUpload({ file, title = "", whisperModel = "base" }) {
  const form = new FormData();
  form.append("file", file);
  if (title) form.append("title", title);
  form.append("whisper_model", whisperModel);
  return request("/ingest/upload", { method: "POST", body: form });
}

export async function ingestBatch({ items }) {
  return request("/ingest/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

export async function getJob(jobId) {
  return request(`/jobs/${jobId}`);
}

// ── Knowledge base ────────────────────────────────────────────────────────────

export async function getSources() {
  return request("/sources");
}

export async function getStats() {
  return request("/stats");
}

export async function search({ q, limit = 5, persona = null, tag = null }) {
  const params = new URLSearchParams({ q, limit });
  if (persona) params.set("persona", persona);
  if (tag) params.set("tag", tag);
  return request(`/search?${params}`);
}

export async function healthCheck() {
  return request("/health");
}
