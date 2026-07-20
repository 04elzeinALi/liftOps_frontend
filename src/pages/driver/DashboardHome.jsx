import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";

export default function DashboardHome() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen p-8" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--accent)", letterSpacing: "0.09em" }}>
            Driver
          </p>
          <h1 className="font-display text-3xl font-extrabold">Welcome, {user?.name}</h1>
        </div>
        <Button variant="secondary" onClick={logout}>
          Log out
        </Button>
      </div>
      <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
        Your trips, boarding, and attendance screens are built in a later phase.
      </p>
    </div>
  );
}
