import { useState, useRef, useEffect } from "react";
import { buildPrompt, routeQuery } from "../lib/api";
import CopyButton from "../components/CopyButton";
import PersonaBadge from "../components/PersonaBadge";
import LoadingDots from "../components/LoadingDots";

const PERSONA_OPTIONS = [
  { value: "",        label: "Auto-detect" },
  { value: "robbins", label: "Tony Robbins" },
  { value: "hormozi", label: "Alex Hormozi" },
  { value: "both",    label: "Both" },
];

const WHISPER_OPTIONS = [
  { value: "tiny",   label: "Tiny  (fastest)" },
  { value: "base",   label: "Base  (recommended)" },
  { value: "small",  label: "Small (better)" },
  { value: "medium", label: "Medium (best)" },
];

export default function AskPage() {
  const [query, setQuery]         = useState("");
  const [persona, setPersona]     = useState("");
  const [numChunks, setNumChunks] = useState(5);

  const [result, setResult]       = useState(null);   // { mode, prompt, chunks_used }
  const [routing, setRouting]     = useState(null);   // { mode, emotional_score, ... }
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [isMac, setIsMac]         = useState(false);

  const textareaRef = useRef(null);
  const resultRef   = useRef(null);

  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [query]);

  // Preview routing as user types (debounced)
  useEffect(() => {
    if (!query.trim() || query.length < 10) { setRouting(null); return; }
    const t = setTimeout(async () => {
      try {
        const r = await routeQuery(query);
        setRouting(r);
      } catch { /* ignore preview errors */ }
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await buildPrompt({
        query,
        persona: persona || null,
        numChunks,
      });
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(e);
  }

  const modeColor = {
    robbins: "text-blue-400",
    hormozi: "text-emerald-400",
    both:    "text-violet-400",
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

      {/* ── Header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Ask your mentor</h1>
        <p className="text-muted text-sm mt-1">
          Type anything — hard day, business problem, strategic question.
          The system builds the perfect prompt for Claude.ai.
        </p>
      </div>

      {/* ── Input form ────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Query textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind? Be specific — the more context you give, the better the response."
            rows={4}
            className="w-full bg-panel border border-border rounded-xl px-4 py-3.5 text-sm text-neutral-100
                       placeholder:text-muted resize-none focus:outline-none focus:ring-1 focus:ring-accent/50
                       focus:border-accent/50 transition-colors"
          />

          {/* Live routing preview */}
          {routing && !persona && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className="text-xs text-muted">Detected:</span>
              <PersonaBadge mode={routing.mode} />
            </div>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Persona selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted whitespace-nowrap">Persona</label>
            <select
              value={persona}
              onChange={e => setPersona(e.target.value)}
              className="bg-panel border border-border rounded-lg px-3 py-1.5 text-sm text-neutral-200
                         focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40"
            >
              {PERSONA_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Chunks selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted whitespace-nowrap">Context</label>
            <select
              value={numChunks}
              onChange={e => setNumChunks(Number(e.target.value))}
              className="bg-panel border border-border rounded-lg px-3 py-1.5 text-sm text-neutral-200
                         focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40"
            >
              {[3, 5, 7, 10].map(n => (
                <option key={n} value={n}>{n} chunks</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="ml-auto flex items-center gap-2 px-5 py-2 rounded-lg bg-accent text-black
                       text-sm font-semibold disabled:opacity-40 hover:bg-amber-400 transition-colors"
          >
            {loading ? "Building…" : "Build prompt"}
            {!loading && (
              <span className="text-xs opacity-60">{isMac ? "⌘↵" : "Ctrl+↵"}</span>
            )}
          </button>
        </div>
      </form>

      {/* ── Loading ────────────────────────────────────────────── */}
      {loading && (
        <div className="bg-panel border border-border rounded-xl p-5">
          <LoadingDots label="Retrieving knowledge & building prompt" />
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          <span className="font-medium">Error: </span>{error}
          <p className="mt-1 text-xs text-red-500/70">
            Is the backend running? → <code className="font-mono">uvicorn api.main:app --reload</code>
          </p>
        </div>
      )}

      {/* ── Result ────────────────────────────────────────────── */}
      {result && (
        <div ref={resultRef} className="space-y-4">

          {/* Meta bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <PersonaBadge mode={result.mode} size="lg" />
            <span className="text-xs text-muted">
              {result.chunks_used} source {result.chunks_used === 1 ? "excerpt" : "excerpts"} retrieved
            </span>
            <div className="ml-auto flex items-center gap-2">
              <CopyButton text={result.prompt} />
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                           bg-neutral-800 text-neutral-200 border border-border hover:bg-neutral-700 transition-colors"
              >
                Open Claude.ai ↗
              </a>
            </div>
          </div>

          {/* Instruction banner */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-2.5 text-xs text-amber-400/80 flex items-center gap-2">
            <span>①</span>
            <span>Click <strong>Copy prompt</strong> → open Claude.ai → paste → send.</span>
          </div>

          {/* Prompt box */}
          <div className="bg-panel border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="text-xs text-muted font-medium uppercase tracking-wider">
                Prompt for Claude.ai
              </span>
              <CopyButton text={result.prompt} />
            </div>
            <div className="p-5 max-h-[520px] overflow-y-auto">
              <pre className="prompt-output text-neutral-300">{result.prompt}</pre>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
