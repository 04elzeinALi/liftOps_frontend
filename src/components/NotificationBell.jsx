import { useEffect, useRef, useState } from "react";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/api/notifications";
import { formatDateTime } from "@/lib/dates";

// Messages addressed to whoever is signed in — currently "your trip was
// cancelled" for a passenger and its counterpart for the driver. Sits in the
// header next to the menu, badged with however many are still unread.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.data ?? [];
  const unreadCount = data?.unread_count ?? 0;

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

  // Escape closes, matching the header menu next to it.
  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-lg"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 grid min-w-[17px] place-items-center rounded-full px-1 text-[10px] font-bold leading-[17px]"
            style={{ background: "var(--critical)", color: "#FFFFFF" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.16)" }}
        >
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span className="font-display text-sm font-bold" style={{ color: "var(--text)" }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs font-semibold"
                style={{ color: "var(--accent-strong)" }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Nothing yet.
              </p>
            ) : (
              notifications.map((n) => {
                const unread = !n.read_at;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => unread && markRead.mutate(n.id)}
                    className="block w-full px-3 py-2.5 text-left"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: unread ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent",
                      cursor: unread ? "pointer" : "default",
                    }}
                  >
                    <span className="flex items-start gap-2">
                      {/* An unread marker rather than colour alone, so it
                          doesn't rely on being able to tell the tints apart. */}
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: unread ? "var(--accent-strong)" : "transparent" }}
                      />
                      <span className="min-w-0">
                        <span
                          className="block text-sm"
                          style={{ color: "var(--text)", fontWeight: unread ? 700 : 500 }}
                        >
                          {n.title}
                        </span>
                        <span className="mt-0.5 block text-xs" style={{ color: "var(--text-muted)" }}>
                          {n.body}
                        </span>
                        <span
                          className="mt-1 block text-[11px]"
                          style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                        >
                          {formatDateTime(n.created_at)}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
