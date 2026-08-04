import { useEffect, useRef, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/theme/ThemeContext";

// Collapses the theme toggle and logout action behind a hamburger button —
// used on the driver and passenger headers, where the admin panel's
// always-visible buttons stay as they are.
export default function HeaderMenu() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-lg"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-40 flex w-44 flex-col gap-1 rounded-xl p-1.5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.16)" }}
        >
          <button
            type="button"
            onClick={() => {
              toggleTheme();
              setOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold"
            style={{ color: "var(--text)" }}
          >
            {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold"
            style={{ color: "var(--critical)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
