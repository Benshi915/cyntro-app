const config = {
  robbins: { label: "Tony Robbins", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  hormozi: { label: "Alex Hormozi", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  both:    { label: "Both",         color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
};

export default function PersonaBadge({ mode, size = "sm" }) {
  const c = config[mode] || config.both;
  const base = size === "lg"
    ? "px-3 py-1 text-sm font-semibold"
    : "px-2 py-0.5 text-xs font-medium";

  return (
    <span className={`inline-flex items-center rounded-full border ${c.color} ${base}`}>
      {c.label}
    </span>
  );
}
