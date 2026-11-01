"use client";

import { formatSeoulDate, formatSeoulTime } from "@/lib/clipper/time";
import type { AvailableSlot } from "@/lib/clipper/types";
import { cn } from "@/lib/utils";

type SlotPickerProps = {
  /** null while availability is loading. */
  slots: AvailableSlot[] | null;
  /** `startsAt` of the chosen slot, or "" for none. */
  selected: string;
  onSelect: (startsAt: string) => void;
  /** Shown when loading succeeded but nothing is open. */
  emptyMessage: string;
  /** Set when loading failed; takes the place of the empty message. */
  error?: string;
  onRetry?: () => void;
};

/** Arrival-time grid grouped by Seoul date, shared by booking and rescheduling. */
export function SlotPicker({ slots, selected, onSelect, emptyMessage, error, onRetry }: SlotPickerProps) {
  // Date labels are unique within the 7-day window, so they double as group keys.
  const groupedSlots = (slots ?? []).reduce<Record<string, AvailableSlot[]>>((groups, slot) => {
    const dateLabel = formatSeoulDate(slot.startsAt) ?? "";
    groups[dateLabel] = [...(groups[dateLabel] ?? []), slot];
    return groups;
  }, {});

  if (slots === null) {
    return <p className="text-xs font-semibold text-ink-faint">Checking this week’s available routes…</p>;
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-danger-line bg-danger-wash px-4 py-3 text-sm text-danger">
        <span className="font-semibold">{error}</span>
        {onRetry && <button type="button" onClick={onRetry} className="rounded-md border border-danger-line bg-surface px-3 py-1.5 font-bold">Try again</button>}
      </div>
    );
  }

  if (!slots.length) {
    return <p className="text-sm text-ink-muted">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {Object.entries(groupedSlots).map(([dateLabel, dateSlots]) => (
        <div key={dateLabel}>
          <p className="mb-2 text-sm font-bold text-ink">{dateLabel}</p>
          <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-3 sm:grid-cols-2">
            {dateSlots.map((slot) => (
              <button
                type="button"
                key={slot.startsAt}
                onClick={() => onSelect(slot.startsAt)}
                className={cn(
                  "whitespace-nowrap rounded-md border px-2 py-3 text-sm font-bold sm:px-3",
                  selected === slot.startsAt ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-soft",
                )}
              >
                {formatSeoulTime(slot.startsAt)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
