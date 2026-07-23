import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { to: "/passenger/trips", label: "Book a Trip" },
  { to: "/passenger/cards", label: "My Travel Cards" },
  { to: "/passenger/reservations", label: "My Reservations" },
  { to: "/passenger/payments", label: "My Payments" },
];

export default function PassengerLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="flex items-center justify-between px-7 py-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ background: "var(--accent)", boxShadow: "0 0 0 4px color-mix(in srgb, var(--accent) 20%, transparent)" }}
          />
          <span className="font-display text-lg font-extrabold" style={{ color: "var(--text)" }}>
            LIFTOPS
          </span>
          <span className="ml-1 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.09em" }}>
            Passenger
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
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

      <nav
        className="flex gap-1 px-7 py-2"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold no-underline"
            style={({ isActive }) => ({
              background: isActive ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="p-7">
        <Outlet />
      </main>
    </div>
  );
}
