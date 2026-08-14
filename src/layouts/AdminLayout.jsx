import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

// Ordered the way the network is actually built up: first the places and the
// lines between them, then the work run on those lines, then who runs it and
// what they run it in. Accounts last — it's the customer side, not operations.
//
// Within Network the order is the same build-up: a station exists on its own,
// a route joins two of them, and route stations sequence the stops in between,
// so each page depends on the one above it.
const NAV_GROUPS = [
  {
    label: "Network",
    items: [
      { to: "/admin/stations", label: "Stations" },
      { to: "/admin/routes", label: "Routes" },
      { to: "/admin/route-stations", label: "Route Stations" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/shifts", label: "Shifts" },
      { to: "/admin/trips", label: "Trips" },
    ],
  },
  {
    label: "Operators",
    items: [{ to: "/admin/drivers", label: "Drivers" }],
  },
  {
    label: "Vehicles",
    items: [
      { to: "/admin/buses", label: "Buses" },
      { to: "/admin/maintenance", label: "Maintenance" },
      { to: "/admin/reports/fleet", label: "Maintenance Report" },
    ],
  },
  {
    // Was "Accounts" — renamed once the revenue/driver-cash reports moved in,
    // since "Accounts" on its own reads as passenger accounts, not money.
    label: "Accounting",
    items: [
      { to: "/admin/passengers", label: "Passengers" },
      { to: "/admin/travel-cards", label: "Travel Cards" },
      { to: "/admin/payments", label: "Payments" },
      { to: "/admin/reports/revenue", label: "Revenue Report" },
      { to: "/admin/reports/driver-cash", label: "Driver Cash Report" },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: "248px 1fr", background: "var(--bg)" }}>
      <aside
        className="sticky top-0 flex h-screen flex-col self-start overflow-y-auto p-4"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        <div className="mb-7 flex items-center gap-2.5 px-1">
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-lg" />
          <span className="font-display text-2xl font-black" style={{ color: "var(--text)", letterSpacing: "0.01em" }}>
            LIFT-OPS
          </span>
        </div>

        {NAV_GROUPS.map((group) => (
          <div className="mb-5" key={group.label}>
            <h4
              className="mb-2 px-2 text-[13px] font-extrabold uppercase"
              style={{ color: "var(--accent)", letterSpacing: "0.07em" }}
            >
              {group.label}
            </h4>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="mb-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium no-underline"
                style={({ isActive }) => ({
                  background: isActive ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  fontWeight: isActive ? 600 : 500,
                })}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor", opacity: 0.7 }} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>

      <div className="flex flex-col">
        <header
          className="flex items-center justify-between px-7 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
            <div
              className="font-display flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            {user?.name}
          </div>
          <div className="flex items-center gap-2">
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

        <main className="flex-1 p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
