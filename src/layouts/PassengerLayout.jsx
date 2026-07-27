import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import PassengerBackdrop from "@/components/passenger/PassengerBackdrop";
import PassengerFooter from "@/components/passenger/PassengerFooter";

const TABS = [
  {
    to: "/passenger",
    end: true,
    label: "Book",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v11" /><path d="M17 8h2.5L21 12v5h-4" /><circle cx="7.5" cy="17.5" r="1.6" /><circle cx="16.5" cy="17.5" r="1.6" /></svg>
    ),
  },
  {
    to: "/passenger/cards",
    label: "Cards",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg>
    ),
  },
  {
    to: "/passenger/reservations",
    label: "Trips",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
    ),
  },
  {
    to: "/passenger/payments",
    label: "Payments",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    ),
  },
];

export default function PassengerLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="passenger-theme relative flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <PassengerBackdrop />

      <header
        className="relative z-10 flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-extrabold" style={{ color: "var(--accent)" }}>
            LIFTOPS
          </span>
         
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm font-semibold sm:inline" style={{ color: "var(--text)" }}>
            {user?.name}
          </span>
          <ThemeToggle />
          <button
            onClick={logout}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold"
            style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 pb-28 pt-6">
        <Outlet />
        <PassengerFooter />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto grid max-w-[520px] grid-cols-4 gap-1 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2"
        style={{
          background: "color-mix(in srgb, var(--bg) 84%, transparent)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid var(--border)",
        }}
        aria-label="Passenger sections"
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10.5px] font-semibold no-underline"
            style={({ isActive }) => ({
              color: isActive ? "var(--accent)" : "var(--text-muted)",
              background: isActive ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
            })}
          >
            <span className="grid h-5 w-5 place-items-center">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
