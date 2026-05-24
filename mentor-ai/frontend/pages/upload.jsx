import { useState, useRef } from "react";
import { ingestYoutube, ingestUrl, ingestUpload } from "../lib/api";
import LoadingDots from "../components/LoadingDots";

const TABS = ["YouTube", "Web URL", "File"];

const WHISPER_OPTIONS = [
  { value: "tiny",   label: "Tiny — fastest, less accurate" },
  { value: "base",   label: "Base — recommended (default)" },
  { value: "small",  label: "Small — better accuracy" },
  { value: "medium", label: "Medium — best accuracy, slow" },
];

function StatusBox({ status }) {
  if (!status) return null;
  const isError   = status.type === "error";
  const isSuccess = status.type === "success";

  return (
    <div className={`rounded-xl border p-4 text-sm space-y-1 ${
      isError   ? "bg-red-500/10 border-red-500/30 text-red-400" :
      isSuccess ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                  "bg-neutral-800 border-border text-neutral-300"
    }`}>
      <p className="font-medium">{status.title}</p>
      {status.detail && <p className="text-xs opacity-70">{status.detail}</p>}
    </div>
  );
}

// ── YouTube Tab ────────────────────────────────────────────────────────────

function YouTubeForm() {
  const [url, setUrl]           = useState("");
  const [model, setModel]       = useState("base");
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setStatus({ type: "info", title: "Downloading & transcribing… this can take several minutes." });
    try {
      const res = await ingestYoutube({ url, whisperModel: model });
      setStatus({
        type: "success",
        title: `✅ Done — ${res.chunks_stored} chunks stored.`,
        detail: `Chunk IDs: ${res.chunk_ids.slice(0, 3).join(", ")}${res.chunk_ids.length > 3 ? "…" : ""}`,
      });
      setUrl("");
    } catch (err) {
      setStatus({ type: "error", title: "Failed", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-muted mb-1.5">YouTube URL</label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm
                     text-neutral-100 placeholder:text-muted focus:outline-none
                     focus:ring-1 focus:ring-accent/50 focus:border-accent/50"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1.5">Whisper model</label>
        <select
          value={model}
          onChange={e => setModel(e.target.value)}
          className="w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm
                     text-neutral-200 focus:outline-none focus:ring-1 focus:ring-accent/40"
        >
          {WHISPER_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p className="text-xs text-muted mt-1">Larger models are more accurate but take longer on CPU.</p>
      </div>

      {loading && <LoadingDots label="Processing — do not close this tab" />}
      <StatusBox status={status} />

      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="w-full py-2.5 rounded-lg bg-accent text-black text-sm font-semibold
                   disabled:opacity-40 hover:bg-amber-400 transition-colors"
      >
        {loading ? "Processing…" : "Ingest video"}
      </button>
    </form>
  );
}

// ── Web URL Tab ────────────────────────────────────────────────────────────

function WebUrlForm() {
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setStatus({ type: "info", title: "Scraping article…" });
    try {
      const res = await ingestUrl({ url });
      setStatus({
        type: "success",
        title: `✅ Done — ${res.chunks_stored} chunks stored.`,
      });
      setUrl("");
    } catch (err) {
      setStatus({ type: "error", title: "Failed", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-muted mb-1.5">Article / Blog URL</label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://www.alexhormozi.com/..."
          className="w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm
                     text-neutral-100 placeholder:text-muted focus:outline-none
                     focus:ring-1 focus:ring-accent/50 focus:border-accent/50"
        />
      </div>

      {loading && <LoadingDots label="Scraping" />}
      <StatusBox status={status} />

      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="w-full py-2.5 rounded-lg bg-accent text-black text-sm font-semibold
                   disabled:opacity-40 hover:bg-amber-400 transition-colors"
      >
        {loading ? "Scraping…" : "Ingest article"}
      </button>
    </form>
  );
}

// ── File Upload Tab ────────────────────────────────────────────────────────

function FileUploadForm() {
  const [file, setFile]       = useState(null);
  const [title, setTitle]     = useState("");
  const [model, setModel]     = useState("base");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState(null);
  const inputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setTitle(f.name.replace(/\.[^.]+$/, "")); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setStatus({ type: "info", title: `Processing ${file.name}…` });
    try {
      const res = await ingestUpload({ file, title, whisperModel: model });
      setStatus({
        type: "success",
        title: `✅ Done — ${res.chunks_stored} chunks stored.`,
      });
      setFile(null);
      setTitle("");
    } catch (err) {
      setStatus({ type: "error", title: "Failed", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-accent bg-accent/5"
            : file
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-border hover:border-neutral-500"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.mp3,.mp4,.wav,.m4a,.mov,.txt,.md"
          className="hidden"
          onChange={e => {
            const f = e.target.files[0];
            if (f) { setFile(f); setTitle(f.name.replace(/\.[^.]+$/, "")); }
          }}
        />
        {file ? (
          <div>
            <p className="text-emerald-400 font-medium">{file.name}</p>
            <p className="text-muted text-xs mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        ) : (
          <div>
            <p className="text-neutral-400 text-sm">Drop a file here or click to browse</p>
            <p className="text-muted text-xs mt-1">PDF · MP3 · MP4 · WAV · TXT · MD</p>
          </div>
        )}
      </div>

      {file && (
        <>
          <div>
            <label className="block text-xs text-muted mb-1.5">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. $100M Offers — Alex Hormozi"
              className="w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm
                         text-neutral-100 placeholder:text-muted focus:outline-none
                         focus:ring-1 focus:ring-accent/50 focus:border-accent/50"
            />
          </div>

          {/* Show whisper model selector only for audio/video */}
          {/\.(mp3|mp4|wav|m4a|mov|mkv|webm)$/i.test(file.name) && (
            <div>
              <label className="block text-xs text-muted mb-1.5">Whisper model</label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm
                           text-neutral-200 focus:outline-none focus:ring-1 focus:ring-accent/40"
              >
                {WHISPER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {loading && <LoadingDots label="Processing file" />}
      <StatusBox status={status} />

      <button
        type="submit"
        disabled={loading || !file}
        className="w-full py-2.5 rounded-lg bg-accent text-black text-sm font-semibold
                   disabled:opacity-40 hover:bg-amber-400 transition-colors"
      >
        {loading ? "Processing…" : "Ingest file"}
      </button>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const [tab, setTab] = useState("YouTube");

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Add knowledge</h1>
        <p className="text-muted text-sm mt-1">
          Ingest new content into the knowledge base. Everything is stored locally.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-panel border border-border rounded-lg p-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? "bg-neutral-700 text-white"
                : "text-muted hover:text-neutral-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-panel border border-border rounded-xl p-5">
        {tab === "YouTube" && <YouTubeForm />}
        {tab === "Web URL" && <WebUrlForm />}
        {tab === "File"    && <FileUploadForm />}
      </div>
    </div>
  );
}
