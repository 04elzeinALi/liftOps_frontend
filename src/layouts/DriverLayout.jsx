import { Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export default function DriverLayout() {
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
            Driver
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {user?.name}
          </span>
          <button
            onClick={logout}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold"
            style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="p-7">
        <Outlet />
      </main>
    </div>
  );
}
