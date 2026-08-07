import { useEffect, useMemo, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterStationOptions } from "@/lib/filterOptions";

/**
 * A Select with a filter box pinned to the top of its dropdown, for pickers
 * long enough that scrolling is worse than typing (the station lists run to
 * ~40 entries).
 *
 * `options` is [{ value, label }] with string values, matching what Radix
 * Select expects.
 *
 * Two Radix behaviours have to be worked around, both commented at the point
 * they're handled below: its built-in typeahead competes for the keystrokes
 * meant for the filter box, and filtering the selected option out of the list
 * would blank the trigger.
 */
export default function SearchableSelect({
  value,
  onValueChange,
  options = [],
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches.",
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

  // Radix moves focus to the selected item when the dropdown opens, so the
  // filter box only keeps focus if we take it back afterwards.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  const filtered = useMemo(
    () => filterStationOptions(options, query, value),
    [options, query, value]
  );

  return (
    <Select value={value} onValueChange={onValueChange} open={open} onOpenChange={setOpen} disabled={disabled}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72">
        <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-1 border-b bg-popover px-2 py-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full rounded-md border px-2.5 py-1.5 text-sm outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            // Radix Select listens for printable keys to jump to a matching
            // option. Left alone it would hijack the letters being typed here
            // (and reset the box). Navigation and dismissal keys are let
            // through so arrows, Enter and Escape still drive the list.
            onKeyDown={(e) => {
              if (!["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab"].includes(e.key)) {
                e.stopPropagation();
              }
            }}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            {emptyMessage}
          </p>
        ) : (
          filtered.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
