import { useEffect, useState } from "react";
import { getSources, getStats, search } from "../lib/api";
import PersonaBadge from "../components/PersonaBadge";
import LoadingDots from "../components/LoadingDots";

const SOURCE_TYPE_ICONS = {
  youtube: "▶",
  web:     "🌐",
  pdf:     "📄",
  upload:  "📁",
};

const ALL_TAGS = [
  "mindset", "identity", "state-management", "6-human-needs",
  "offer-creation", "pricing", "scaling", "unit-economics",
  "lead-generation", "sales", "hormozi-framework", "hard-day",
  "habits", "motivation", "peak-performance", "relationships", "health",
  "business-strategy",
];

function StatCard({ label, value }) {
  return (
    <div className="bg-panel border border-border rounded-xl p-4">
      <p className="text-muted text-xs uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value ?? "—"}</p>
    </div>
  );
}

function SourceCard({ source }) {
  const icon = SOURCE_TYPE_ICONS[source.source_type] || "•";
  return (
    <div className="bg-panel border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-start gap-3">
        <span className="text-base mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">
            {source.title || source.source_url}
          </p>
          <a
            href={source.source_url.startsWith("local://") ? undefined : source.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted hover:text-neutral-400 truncate block"
          >
            {source.source_url}
          </a>
        </div>
      </div>
      <div className="flex items-center gap-2 pl-7">
        <PersonaBadge mode={source.persona} />
        <span className="text-xs text-muted capitalize">{source.source_type}</span>
      </div>
    </div>
  );
}

function SearchResults({ results }) {
  if (!results.length) {
    return <p className="text-muted text-sm text-center py-8">No results found.</p>;
  }
  return (
    <div className="space-y-3">
      {results.map(r => (
        <div key={r.id} className="bg-panel border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <PersonaBadge mode={r.persona} />
            <span className="text-xs text-muted">Score: {r.score}</span>
            <div className="flex flex-wrap gap-1 ml-auto">
              {(r.tags || []).slice(0, 4).map(t => (
                <span key={t} className="text-xs bg-neutral-800 border border-border rounded px-1.5 py-0.5 text-neutral-400">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-neutral-300 line-clamp-4">{r.content}</p>
          <p className="text-xs text-muted truncate">{r.title || r.source_url}</p>
        </div>
      ))}
    </div>
  );
}

export default function SourcesPage() {
  const [sources, setSources]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [activeTag, setActiveTag]       = useState(null);
  const [activePersona, setActivePersona] = useState(null);
  const [searchQ, setSearchQ]           = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching]       = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [s, st] = await Promise.all([getSources(), getStats()]);
        setSources(s);
        setStats(st);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQ.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const r = await search({
        q: searchQ,
        limit: 8,
        persona: activePersona || undefined,
        tag: activeTag || undefined,
      });
      setSearchResults(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }

  // Filter sources client-side
  const filteredSources = sources.filter(s => {
    if (activePersona && s.persona !== activePersona && s.persona !== "both") return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Knowledge base</h1>
        <p className="text-muted text-sm mt-1">Everything ingested. Browse sources or search chunks.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total chunks" value={stats.total_vectors?.toLocaleString()} />
          <StatCard label="Sources"       value={sources.length} />
          <StatCard label="Status"        value={stats.status} />
        </div>
      )}

      {loading && <LoadingDots label="Loading knowledge base" />}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error} — Is the backend running?
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Search ──────────────────────────────────────────── */}
          <div className="space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search chunks… e.g. 'value equation' or 'pattern interrupt'"
                className="flex-1 bg-panel border border-border rounded-lg px-3 py-2.5 text-sm
                           text-neutral-100 placeholder:text-muted focus:outline-none
                           focus:ring-1 focus:ring-accent/50 focus:border-accent/50"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-4 py-2.5 rounded-lg bg-neutral-700 text-neutral-200 text-sm
                           font-medium hover:bg-neutral-600 transition-colors disabled:opacity-40"
              >
                {searching ? "…" : "Search"}
              </button>
              {searchResults && (
                <button
                  type="button"
                  onClick={() => { setSearchResults(null); setSearchQ(""); }}
                  className="px-3 py-2.5 rounded-lg text-muted hover:text-neutral-300 text-sm"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Persona filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted">Filter:</span>
              {["robbins", "hormozi", "both"].map(p => (
                <button
                  key={p}
                  onClick={() => setActivePersona(activePersona === p ? null : p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    activePersona === p
                      ? p === "robbins" ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                        : p === "hormozi" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-violet-500/20 text-violet-400 border-violet-500/40"
                      : "border-border text-muted hover:text-neutral-300"
                  }`}
                >
                  {p === "robbins" ? "Tony Robbins" : p === "hormozi" ? "Alex Hormozi" : "Both"}
                </button>
              ))}
            </div>

            {/* Tag filter */}
            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                    activeTag === tag
                      ? "bg-accent/20 text-accent border-accent/40"
                      : "border-border text-muted hover:text-neutral-400 hover:border-neutral-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* ── Search results or source list ────────────────────── */}
          {searching && <LoadingDots label="Searching" />}

          {searchResults ? (
            <div className="space-y-3">
              <p className="text-xs text-muted">{searchResults.length} chunks found</p>
              <SearchResults results={searchResults} />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted">{filteredSources.length} sources</p>
              {filteredSources.length === 0 ? (
                <div className="bg-panel border border-border rounded-xl p-8 text-center">
                  <p className="text-muted text-sm">No sources ingested yet.</p>
                  <a href="/upload" className="text-accent text-sm mt-2 inline-block hover:underline">
                    Add your first source →
                  </a>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredSources.map(s => (
                    <SourceCard key={s.source_url} source={s} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
