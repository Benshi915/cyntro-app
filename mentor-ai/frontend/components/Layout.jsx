import Link from "next/link";
import { useRouter } from "next/router";

const nav = [
  { href: "/",        label: "Ask",     icon: "💬" },
  { href: "/upload",  label: "Add",     icon: "＋" },
  { href: "/sources", label: "Sources", icon: "📚" },
];

export default function Layout({ children }) {
  const { pathname } = useRouter();

  return (
    <div className="flex min-h-screen bg-surface text-neutral-200">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-border flex flex-col py-6 px-4 gap-1">
        {/* Logo */}
        <div className="mb-8 px-2">
          <span className="text-accent font-bold text-lg tracking-tight">Mentor AI</span>
          <p className="text-muted text-xs mt-0.5">Robbins × Hormozi</p>
        </div>

        {/* Nav */}
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-neutral-800 text-white font-medium"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}

        {/* Footer */}
        <div className="mt-auto px-2 text-xs text-muted space-y-1">
          <p>Fully local. No APIs.</p>
          <p>Powered by Claude.ai</p>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
