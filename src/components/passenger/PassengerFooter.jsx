// Footer for the passenger app: the line it serves, social links, and a
// copyright. Sits at the end of the scrollable content, above the fixed tab
// bar. Social hrefs are placeholders until real accounts exist.

const SOCIALS = [
  {
    label: "Instagram",
    href: "#",
    path: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    label: "Facebook",
    href: "#",
    path: <path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v3H8v8h3v-8h2.5l.5-3H11V7.5a1 1 0 0 1 1-1h3z" />,
  },
  {
    label: "X",
    href: "#",
    path: <path d="M4 4l7 8m0 0l-7 8m7-8l9 8m-9-8l9-8" />,
  },
  {
    label: "WhatsApp",
    href: "#",
    path: (
      <>
        <path d="M4 20l1.4-4A8 8 0 1 1 8.5 18.6z" />
        <path d="M9 9.5c.3 2.3 3.2 5.2 5.5 5.5.6.1 1.3-.4 1.6-1 .1-.3 0-.6-.2-.7l-1.6-.9c-.2-.1-.5-.1-.7.1l-.5.6c-1-.5-1.9-1.4-2.4-2.4l.6-.5c.2-.2.2-.5.1-.7l-.9-1.6c-.1-.2-.4-.3-.7-.2-.6.3-1.1 1-1 1.6z" />
      </>
    ),
  },
];

export default function PassengerFooter() {
  return (
    <footer className="mx-auto mt-10 w-full max-w-[452px]">
      <div
        className="rounded-2xl px-5 py-6 text-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p className="font-display text-lg font-extrabold" style={{ color: "var(--text)" }}>
          LIFT-OPS
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          Beirut ⇄ Saida ⇄ Tyre
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="grid h-9 w-9 place-items-center rounded-full transition-colors"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                {s.path}
              </svg>
            </a>
          ))}
        </div>

        <p className="mt-5 text-[11px]" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} Lift-Ops · The coastal line
        </p>
      </div>
    </footer>
  );
}
