"use client";

import { useState } from "react";

import { SlotPicker } from "@/components/clipper/slot-picker";
import { Alert, AlertDescription, Button } from "@/components/ui";
import type { AvailableSlot } from "@/lib/clipper/types";

type ManageAppointmentProps = {
  reference: string;
  /** Why online changes are closed, or null when the customer can change the visit. */
  blockedReason: string | null;
};

type Mode = "idle" | "confirm-cancel" | "reschedule";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

export function ManageAppointment({ reference, blockedReason }: ManageAppointmentProps) {
  const [mode, setMode] = useState<Mode>("idle");
  // null while the reschedule slots are loading.
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [selectedStart, setSelectedStart] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Loading the reschedule times failed; shown inside the picker with a retry.
  const [slotsError, setSlotsError] = useState("");

  const basePath = `/api/appointments/${encodeURIComponent(reference)}`;

  if (blockedReason) {
    return (
      <section className="rounded-2xl border border-line bg-surface px-5 py-5 text-sm text-ink-muted sm:px-7">
        <p className="font-semibold text-ink">Changes</p>
        <p className="mt-1">{blockedReason}</p>
      </section>
    );
  }

  function startReschedule() {
    setMode("reschedule");
    setError("");
    setSlotsError("");
    setSlots(null);
    setSelectedStart("");
    requestJson<{ slots: AvailableSlot[] }>(`${basePath}/availability`)
      .then((data) => setSlots(data.slots))
      .catch((requestError: Error) => {
        setSlots([]);
        setSlotsError(requestError.message);
      });
  }

  function submit(action: "cancel" | "reschedule") {
    setSubmitting(true);
    setError("");
    requestJson(`${basePath}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: action === "reschedule" ? JSON.stringify({ startsAt: selectedStart }) : undefined,
    })
      .then(() => window.location.reload())
      .catch((requestError: Error) => {
        setSubmitting(false);
        setError(requestError.message);
      });
  }

  function reset() {
    setMode("idle");
    setError("");
  }

  return (
    <section className="rounded-2xl border border-line bg-surface px-5 py-5 text-sm text-ink-muted sm:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-ink">Plans changed?</p>
          <p className="mt-1">Move or cancel this visit online up to 24 hours before it starts.</p>
        </div>
        {mode === "idle" && (
          <div className="flex gap-2">
            <Button type="button" onClick={startReschedule} className="h-10 rounded-md bg-brand px-4 text-sm font-bold !text-white shadow-none hover:bg-night">Reschedule</Button>
            <Button type="button" variant="outline" onClick={() => { setMode("confirm-cancel"); setError(""); }} className="h-10 rounded-md border-line bg-surface px-4 text-sm font-bold text-danger">Cancel visit</Button>
          </div>
        )}
        {mode === "confirm-cancel" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-full font-semibold text-ink sm:w-auto">Cancel this visit?</span>
            <Button type="button" onClick={() => submit("cancel")} disabled={submitting} className="h-10 rounded-md bg-danger-fill px-4 text-sm font-bold !text-white shadow-none">{submitting ? "Cancelling…" : "Yes, cancel"}</Button>
            <Button type="button" variant="outline" onClick={reset} disabled={submitting} className="h-10 rounded-md border-line bg-surface px-4 text-sm font-bold text-ink">Keep it</Button>
          </div>
        )}
      </div>

      {error && <Alert className="mt-4 border-danger-line bg-danger-wash text-danger"><AlertDescription>{error}</AlertDescription></Alert>}

      {mode === "reschedule" && (
        <div className="mt-6 border-t border-line-soft pt-5">
          <p className="mb-1 font-bold text-ink">Pick a new arrival time</p>
          <p className="mb-4 text-xs text-ink-faint">All times KST · same length, same address</p>
          <SlotPicker
            slots={slots}
            selected={selectedStart}
            onSelect={(startsAt) => { setSelectedStart(startsAt); setError(""); }}
            emptyMessage="No other times are open this week."
            error={slotsError}
            onRetry={startReschedule}
          />
          <div className="mt-5 flex gap-2">
            <Button type="button" onClick={() => submit("reschedule")} disabled={submitting || !selectedStart} className="h-10 rounded-md bg-brand px-4 text-sm font-bold !text-white shadow-none hover:bg-night">{submitting ? "Moving your visit…" : "Move visit →"}</Button>
            <Button type="button" variant="outline" onClick={reset} disabled={submitting} className="h-10 rounded-md border-line bg-surface px-4 text-sm font-bold text-ink">Never mind</Button>
          </div>
        </div>
      )}
    </section>
  );
}
