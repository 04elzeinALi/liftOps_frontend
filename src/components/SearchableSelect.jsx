import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { filterStationOptions } from "@/lib/filterOptions";

/**
 * A picker with a search box, for lists long enough that scrolling is worse
 * than typing (the station lists run to ~40 entries).
 *
 * `options` is [{ value, label }] with string values.
 *
 * WHY THIS ISN'T A <Select>
 * It was, with the search box pinned inside the dropdown, and that is broken
 * on any device with an on-screen keyboard. Radix Select closes itself on
 * window "resize" (it registers the listener itself, in SelectContentImpl —
 * it can't be stopPropagation'd away), and on Android, focusing a text field
 * opens the keyboard, which resizes the viewport. So the list vanished the
 * instant you tapped the search box. Desktop never fired it, because no
 * keyboard appears, which is why it looked fine there for so long.
 *
 * A dialog is built for exactly this — it owns focus, expects to contain
 * inputs, and doesn't dismiss itself when the viewport changes shape. The
 * trigger below is a plain button styled to match the other select triggers,
 * so nothing looks different until it's opened.
 */
export default function SearchableSelect({
  value,
  onValueChange,
  options = [],
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches.",
  title,
  id,
  disabled,
  className = "w-full",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  // Start each opening from the full list — a filter left over from last time
  // looks like options have gone missing.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(
    () => filterStationOptions(options, query, value),
    [options, query, value]
  );

  function choose(optionValue) {
    onValueChange?.(optionValue);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(true)}
        // Matches SelectTrigger's styling so this reads as the same control
        // it replaced.
        className={`flex h-9 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 ${className}`}
      >
        <span
          className="line-clamp-1 text-left"
          style={{ color: selected ? "var(--text)" : "var(--text-muted)" }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[85vh] gap-3 overflow-hidden p-4 sm:max-w-md"
          // Focus the search box rather than whatever the dialog would pick,
          // so typing works immediately without a second tap.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-base">{title ?? placeholder}</DialogTitle>
          </DialogHeader>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          />

          <div className="-mx-1 max-h-[55vh] overflow-y-auto px-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                {emptyMessage}
              </p>
            ) : (
              filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => choose(option.value)}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm"
                    style={{
                      background: isSelected
                        ? "color-mix(in srgb, var(--accent) 14%, transparent)"
                        : "transparent",
                      color: "var(--text)",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <span aria-hidden="true" style={{ color: "var(--accent-strong)" }}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
