import { useState, useRef, useEffect } from "react";
import { ingestBatch, ingestUpload, getJob } from "../lib/api";
import LoadingDots from "../components/LoadingDots";

const TABS = ["YouTube", "Web URL", "File"];

const WHISPER_OPTIONS = [
  { value: "tiny",   label: "Tiny — fastest, less accurate" },
  { value: "base",   label: "Base — recommended (default)" },
  { value: "small",  label: "Small — better accuracy" },
  { value: "medium", label: "Medium — best accuracy, slow" },
];

// ── Queue display ──────────────────────────────────────────────────────────

function QueueItem({ item }) {
  const icon = {
    pending:    <span className="text-neutral-500 text-base leading-none">○</span>,
    processing: <span className="animate-pulse text-amber-400 text-base leading-none">◉</span>,
    done:       <span className="text-emerald-400 text-base leading-none">✓</span>,
    error:      <span className="text-red-400 text-base leading-none">✗</span>,
  }[item.status];

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0 text-sm">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-neutral-300">{item.url}</p>
        {item.status === "done" && (
          <p className="text-xs text-emerald-400 mt-0.5">{item.chunks_stored} chunks stored</p>
        )}
        {item.status === "error" && (
          <p className="text-xs text-red-400/80 mt-0.5">{item.error || "Unknown error"}</p>
        )}
        {item.status === "processing" && (
          <p className="text-xs text-amber-400/70 mt-0.5">Processing — this may take a few minutes…</p>
        )}
        {item.status === "pending" && (
          <p className="text-xs text-neutral-500 mt-0.5">Waiting in queue</p>
        )}
      </div>
    </div>
  );
}

function JobQueue({ job }) {
  if (!job) return null;
  const done  = job.items.filter(i => i.status === "done").length;
  const error = job.items.filter(i => i.status === "error").length;
  const total = job.items.length;
  const isDone = job.status === "done";

  return (
    <div className="bg-neutral-900 border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Queue</p>
        <div className="flex items-center gap-3">
          {isDone ? (
            <span className="text-xs text-emerald-400">
              {done}/{total} done{error > 0 ? `, ${error} failed` : ""}
            </span>
          ) : (
            <>
              <span className="text-xs text-neutral-500">{done}/{total}</span>
              <LoadingDots />
            </>
          )}
        </div>
      </div>
      {job.items.map((item, i) => <QueueItem key={i} item={item} />)}
    </div>
  );
}

// ── Batch URL form (YouTube + Web URL tabs) ────────────────────────────────

function BatchUrlForm({ type }) {
  const [text, setText]   = useState("");
  const [model, setModel] = useState("base");
  const [jobId, setJobId] = useState(null);
  const [job, setJob]     = useState(null);
  const [error, setError] = useState(null);
  const pollRef           = useRef(null);

  const urls = text.split("\n").map(s => s.trim()).filter(Boolean);
  const isRunning = job?.status === "running";

  useEffect(() => {
    if (!jobId) return;
    pollRef.current = setInterval(async () => {
      try {
        const data = await getJob(jobId);
        setJob(data);
        if (data.status === "done") clearInterval(pollRef.current);
      } catch {}
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [jobId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!urls.length) return;
    setError(null);

    const items = urls.map(url => ({
      type,
      url,
      ...(type === "youtube" ? { whisper_model: model } : {}),
    }));

    try {
      const res = await ingestBatch({ items });
      setJobId(res.job_id);
      setJob({
        id: res.job_id,
        status: "running",
        items: items.map(item => ({ ...item, status: "pending", chunks_stored: 0, error: null })),
      });
      setText("");
    } catch (err) {
      setError(err.message);
    }
  }

  const placeholder = type === "youtube"
    ? "https://www.youtube.com/watch?v=abc123\nhttps://www.youtube.com/watch?v=def456\n..."
    : "https://www.alexhormozi.com/some-article\nhttps://www.tonyrobbins.com/blog/...";

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-muted mb-1.5">
            {type === "youtube" ? "YouTube URLs" : "Article / blog URLs"}
            <span className="ml-1 opacity-50">— one per line, paste as many as you want</span>
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            rows={6}
            disabled={isRunning}
            className="w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm
                       text-neutral-100 placeholder:text-muted focus:outline-none
                       focus:ring-1 focus:ring-accent/50 focus:border-accent/50
                       resize-y disabled:opacity-40 font-mono leading-relaxed"
          />
          {urls.length > 0 && (
            <p className="text-xs text-muted mt-1">{urls.length} URL{urls.length !== 1 ? "s" : ""} ready</p>
          )}
        </div>

        {type === "youtube" && (
          <div>
            <label className="block text-xs text-muted mb-1.5">Whisper model (applies to all)</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              disabled={isRunning}
              className="w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm
                         text-neutral-200 focus:outline-none focus:ring-1 focus:ring-accent/40
                         disabled:opacity-40"
            >
              {WHISPER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">Base is recommended. Switch to Small/Medium for better accuracy on dense lectures.</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isRunning || !urls.length}
          className="w-full py-2.5 rounded-lg bg-accent text-black text-sm font-semibold
                     disabled:opacity-40 hover:bg-amber-400 transition-colors"
        >
          {isRunning
            ? `Processing ${job?.items.filter(i => i.status === "done").length ?? 0} / ${job?.items.length ?? 0}…`
            : `Start ingesting ${urls.length ? `${urls.length} ` : ""}item${urls.length !== 1 ? "s" : ""}`}
        </button>
      </form>

      <JobQueue job={job} />
    </div>
  );
}

// ── File Upload Tab ────────────────────────────────────────────────────────

function FileUploadForm() {
  const [file, setFile]         = useState(null);
  const [title, setTitle]       = useState("");
  const [model, setModel]       = useState("base");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState(null);
  const inputRef                = useRef(null);

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
      setStatus({ type: "success", title: `Done — ${res.chunks_stored} chunks stored.` });
      setFile(null);
      setTitle("");
    } catch (err) {
      setStatus({ type: "error", title: "Failed", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  const isAudioVideo = file && /\.(mp3|mp4|wav|m4a|mov|mkv|webm)$/i.test(file.name);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging          ? "border-accent bg-accent/5" :
          file              ? "border-emerald-500/50 bg-emerald-500/5" :
                              "border-border hover:border-neutral-500"
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

          {isAudioVideo && (
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

      {loading && <LoadingDots label="Processing file — do not close this tab" />}

      {status && (
        <div className={`rounded-xl border p-4 text-sm space-y-1 ${
          status.type === "error"   ? "bg-red-500/10 border-red-500/30 text-red-400" :
          status.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                      "bg-neutral-800 border-border text-neutral-300"
        }`}>
          <p className="font-medium">{status.title}</p>
          {status.detail && <p className="text-xs opacity-70">{status.detail}</p>}
        </div>
      )}

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
          Paste as many URLs as you like — they'll queue up and process one by one in the background.
        </p>
      </div>

      <div className="flex gap-1 bg-panel border border-border rounded-lg p-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-neutral-700 text-white" : "text-muted hover:text-neutral-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-panel border border-border rounded-xl p-5">
        {tab === "YouTube" && <BatchUrlForm type="youtube" />}
        {tab === "Web URL" && <BatchUrlForm type="url" />}
        {tab === "File"    && <FileUploadForm />}
      </div>
    </div>
  );
}
