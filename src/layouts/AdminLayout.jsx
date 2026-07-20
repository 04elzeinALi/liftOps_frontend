import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

const NAV_GROUPS = [
  {
    label: "Fleet",
    items: [
      { to: "/admin/buses", label: "Buses" },
      { to: "/admin/maintenance", label: "Maintenance" },
    ],
  },
  {
    label: "Network",
    items: [
      { to: "/admin/routes", label: "Routes" },
      { to: "/admin/stations", label: "Stations" },
      { to: "/admin/route-stations", label: "Route Stations" },
    ],
  },
  {
    label: "Schedule",
    items: [
      { to: "/admin/schedules", label: "Schedules" },
      { to: "/admin/schedule-days", label: "Schedule Days" },
      { to: "/admin/trips", label: "Trips" },
    ],
  },
  {
    label: "People",
    items: [{ to: "/admin/drivers", label: "Drivers" }],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: "248px 1fr", background: "var(--bg)" }}>
      <aside
        className="flex flex-col p-4"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        <div className="mb-7 flex items-center gap-2 px-1">
          <div
            className="h-3 w-3 rounded-full"
            style={{ background: "var(--accent)", boxShadow: "0 0 0 4px color-mix(in srgb, var(--accent) 20%, transparent)" }}
          />
          <span className="font-display text-lg font-extrabold" style={{ color: "var(--text)" }}>
            LIFTOPS
          </span>
        </div>

        {NAV_GROUPS.map((group) => (
          <div className="mb-5" key={group.label}>
            <h4
              className="mb-2 px-2 text-[11px] font-bold uppercase"
              style={{ color: "var(--text-muted)", letterSpacing: "0.09em" }}
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
          <button
            onClick={logout}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold"
            style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            Log out
          </button>
        </header>

        <main className="flex-1 p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
