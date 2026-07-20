export default function ComingSoon({ title }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase" style={{ color: "var(--accent)", letterSpacing: "0.09em" }}>
        Admin
      </p>
      <h1 className="font-display mb-2 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
        {title}
      </h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        This section is coming soon.
      </p>
    </div>
  );
}
