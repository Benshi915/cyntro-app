export default function LoadingDots({ label = "Thinking" }) {
  return (
    <div className="flex items-center gap-2 text-muted text-sm">
      <span>{label}</span>
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-muted dot-pulse" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted dot-pulse-2" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted dot-pulse-3" />
      </span>
    </div>
  );
}
