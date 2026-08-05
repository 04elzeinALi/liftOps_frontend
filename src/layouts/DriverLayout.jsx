import { Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import HeaderMenu from "@/components/HeaderMenu";

export default function DriverLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Stacked explicitly so the header menu's dropdown stays above the page
          instead of relying on nothing below it being positioned. */}
      <header
        className="relative z-40 flex items-center justify-between px-7 py-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-extrabold" style={{ color: "var(--text)" }}>
              LIFT-OPS
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.09em" }}>
              Driver
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {user?.name}
          </span>
          <HeaderMenu />
        </div>
      </header>

      <main className="p-7">
        <Outlet />
      </main>
    </div>
  );
}
