import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-9 w-9 place-items-center rounded-lg"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
    >
      {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </button>
  );
}
