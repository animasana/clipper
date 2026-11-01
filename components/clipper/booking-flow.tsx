"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, Button, Input } from "@/components/ui";
import { formatSeoulDate, formatSeoulTime } from "@/lib/clipper/time";
import type { AvailableSlot, BookingOption, GroomingPackage } from "@/lib/clipper/types";
import { cn } from "@/lib/utils";

type SlotOption = AvailableSlot & {
  dateLabel: string;
  timeLabel: string;
};

function formatMoney(cents: number) {
  return `₩${cents.toLocaleString("ko-KR")}`;
}

function toSlotOption(slot: AvailableSlot): SlotOption {
  return {
    ...slot,
    dateLabel: formatSeoulDate(slot.startsAt) ?? "",
    timeLabel: formatSeoulTime(slot.startsAt) ?? "",
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${url}`);
  return response.json() as Promise<T>;
}

const fallbackOptions: BookingOption = {
  packages: [
    { id: "pkg_bath_brush", name: "Bath & Brush", description: "A refreshing bath, blow dry, brush-out, and nail trim.", durationMinutes: 60, priceCents: 65000 },
    { id: "pkg_full_groom", name: "Full Groom", description: "Bath, brush-out, haircut, nail trim, and ear cleaning.", durationMinutes: 90, priceCents: 95000 },
    { id: "pkg_deluxe", name: "Deluxe Spa", description: "Full grooming plus teeth brushing and a soothing paw treatment.", durationMinutes: 120, priceCents: 135000 },
  ],
  neighborhoods: ["Hannam-dong", "Yeonnam-dong", "Seongsu-dong", "Itaewon", "Gangnam", "Mangwon-dong"],
};

const breeds = ["Golden Retriever", "Labrador Retriever", "French Bulldog", "German Shepherd", "Poodle", "Miniature Poodle", "Pomeranian", "Shiba Inu", "Welsh Corgi", "Yorkshire Terrier", "Mixed Breed"];

const legendClass = "text-lg font-bold tracking-[-0.025em] text-ink";
const fieldLabelClass = "text-xs font-bold text-ink-muted";
const inputClass = "h-12 rounded-md border-line bg-surface px-4 text-base font-normal text-ink focus-visible:ring-brand";
const selectClass = "h-12 w-full rounded-md border border-line bg-surface px-4 text-base font-normal text-ink outline-none focus:border-brand";

export function BookingFlow({ sectionId = "book" }: { sectionId?: string }) {
  const [options, setOptions] = useState<BookingOption>(fallbackOptions);
  // null while availability for the current selection is loading.
  const [slotState, setSlotState] = useState<SlotOption[] | null>(null);
  const [petName, setPetName] = useState("Luna");
  const [petBreed, setPetBreed] = useState("Miniature Poodle");
  const [selectedPackageId, setSelectedPackageId] = useState("pkg_full_groom");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("Itaewon");
  const [address, setAddress] = useState("42 Itaewon-ro 27ga-gil");
  const [selectedSlotStart, setSelectedSlotStart] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const slots = slotState ?? [];
  const loadingSlots = slotState === null;
  const loading = loadingOptions || loadingSlots;
  const selectedPackage = options.packages.find((pkg) => pkg.id === selectedPackageId);
  // Keep the customer's pick while it's still offered; otherwise default to the earliest slot.
  const selectedSlot = slots.find((slot) => slot.startsAt === selectedSlotStart) ?? slots[0];

  // Catalog (packages + neighborhoods) is static: load it once.
  useEffect(() => {
    let cancelled = false;
    fetchJson<BookingOption>("/api/booking-options")
      .then((data) => {
        if (cancelled) return;
        setOptions({
          packages: data.packages.length ? data.packages : fallbackOptions.packages,
          neighborhoods: data.neighborhoods.length ? data.neighborhoods : fallbackOptions.neighborhoods,
        });
      })
      .catch(() => {
        // Keep the local booking options available when the API is offline.
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Availability depends on the selection: refetch whenever it changes.
  useEffect(() => {
    if (!selectedNeighborhood || !selectedPackageId) {
      setSlotState([]);
      return;
    }
    let cancelled = false;
    setSlotState(null);
    const params = new URLSearchParams({ neighborhood: selectedNeighborhood, packageId: selectedPackageId });
    fetchJson<{ slots: AvailableSlot[] }>(`/api/availability?${params}`)
      .then((data) => {
        if (!cancelled) setSlotState(data.slots.map(toSlotOption));
      })
      .catch(() => {
        // Never offer unverified times; the empty-slots message covers this.
        if (!cancelled) setSlotState([]);
      });
    return () => { cancelled = true; };
  }, [selectedNeighborhood, selectedPackageId]);

  function validateAndSubmit() {
    if (!petName.trim() || !petBreed || !selectedPackageId || !selectedNeighborhood || !address || !selectedSlot) {
      setFormError("Please complete each step before booking your Clipper visit.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ petName: petName.trim(), petBreed, packageId: selectedPackageId, neighborhood: selectedNeighborhood, address, startsAt: selectedSlot.startsAt }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not create booking");
        return response.json() as Promise<{ reference?: string; bookingReference?: string }>;
      })
      .then((data) => {
        const reference = data.reference ?? data.bookingReference;
        if (!reference) throw new Error("Booking reference missing");
        window.location.assign(`/appointments/${encodeURIComponent(reference)}`);
      })
      .catch(() => {
        setSubmitting(false);
        setFormError("We couldn’t save that visit. Please check your details and try again.");
      });
  }

  return (
    <section id={sectionId} className="scroll-mt-5 border-y border-line bg-page pt-20">
      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-12">
        <div className="mb-10 max-w-3xl pt-2">
          <p className="text-sm font-bold text-brand-text">Book a Clipper visit</p>
          <h2 className="mt-3 text-[clamp(2.7rem,6vw,5.25rem)] font-bold leading-[0.95] tracking-[-0.06em] text-ink">Everything your pet needs. One calm visit.</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Choose the pet, service, location, and time. We’ll match the route with a trusted Seoul groomer.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line-soft bg-surface shadow-[0_28px_80px_rgb(38_46_77/12%)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-10 p-5 sm:p-8 lg:p-10">
              {formError && <Alert className="border-danger-line bg-danger-wash text-danger"><AlertDescription>{formError}</AlertDescription></Alert>}
              {loading && <p className="text-xs font-semibold text-ink-faint">Checking this week’s available routes…</p>}

              <PetStep petName={petName} onPetNameChange={setPetName} petBreed={petBreed} onPetBreedChange={setPetBreed} />
              <ServiceStep
                packages={options.packages}
                selectedPackageId={selectedPackageId}
                onSelect={(id) => { setSelectedPackageId(id); setFormError(""); }}
              />
              <AddressStep
                address={address}
                onAddressChange={setAddress}
                neighborhoods={options.neighborhoods}
                selectedNeighborhood={selectedNeighborhood}
                onNeighborhoodChange={setSelectedNeighborhood}
              />
              <TimeStep
                slots={slots}
                loading={loadingSlots}
                selectedStart={selectedSlot?.startsAt}
                onSelect={(startsAt) => { setSelectedSlotStart(startsAt); setFormError(""); }}
              />
            </div>

            <VisitSummary
              petName={petName}
              selectedPackage={selectedPackage}
              selectedSlot={selectedSlot}
              neighborhood={selectedNeighborhood}
              submitting={submitting}
              disabled={submitting || loading}
              onConfirm={validateAndSubmit}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PetStep({ petName, onPetNameChange, petBreed, onPetBreedChange }: {
  petName: string;
  onPetNameChange: (value: string) => void;
  petBreed: string;
  onPetBreedChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className={cn("mb-4", legendClass)}>1. Who are we grooming?</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={fieldLabelClass}>
          Pet name
          <Input aria-label="Pet name" value={petName} onChange={(event) => onPetNameChange(event.target.value)} placeholder="e.g. Luna" className={cn("mt-2", inputClass)} />
        </label>
        <label className={fieldLabelClass}>
          Breed
          <select aria-label="Breed" value={petBreed} onChange={(event) => onPetBreedChange(event.target.value)} className={cn("mt-2", selectClass)}>
            <option value="">Choose a breed</option>
            {breeds.map((breed) => <option key={breed}>{breed}</option>)}
          </select>
        </label>
      </div>
    </fieldset>
  );
}

function ServiceStep({ packages, selectedPackageId, onSelect }: {
  packages: GroomingPackage[];
  selectedPackageId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className={cn("mb-4", legendClass)}>2. Choose a service</legend>
      <div className="divide-y divide-line-soft border-y border-line-soft">
        {packages.map((pkg) => {
          const selected = selectedPackageId === pkg.id;
          return (
            <button type="button" key={pkg.id} onClick={() => onSelect(pkg.id)} className={cn("grid w-full grid-cols-[1fr_auto] items-center gap-5 px-1 py-5 text-left", !selected && "opacity-70 hover:opacity-100")}>
              <span>
                <span className="flex items-center gap-2 font-bold text-ink">
                  <span className={cn("size-2 rounded-full", selected ? "bg-brand" : "bg-line")} />
                  {pkg.name}
                </span>
                <span className="mt-1 block pl-4 text-xs leading-5 text-ink-faint">{pkg.description}</span>
              </span>
              <span className="text-right">
                <span className="block font-bold text-ink">{formatMoney(pkg.priceCents)}</span>
                <span className="text-xs text-ink-faint">{pkg.durationMinutes} min</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function AddressStep({ address, onAddressChange, neighborhoods, selectedNeighborhood, onNeighborhoodChange }: {
  address: string;
  onAddressChange: (value: string) => void;
  neighborhoods: string[];
  selectedNeighborhood: string;
  onNeighborhoodChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className={cn("mb-4", legendClass)}>3. Where should we arrive?</legend>
      <div className="grid gap-3 sm:grid-cols-[1.25fr_0.75fr]">
        <Input aria-label="Street address" value={address} onChange={(event) => onAddressChange(event.target.value)} placeholder="Street address" className={inputClass} />
        <select aria-label="Neighborhood" value={selectedNeighborhood} onChange={(event) => onNeighborhoodChange(event.target.value)} className={selectClass}>
          <option value="">Neighborhood</option>
          {neighborhoods.map((neighborhood) => <option key={neighborhood} value={neighborhood}>{neighborhood}</option>)}
        </select>
      </div>
      <Input placeholder="Apt, floor, or gate code (optional)" className="mt-3 h-11 rounded-md border-line bg-surface px-4 text-base" />
    </fieldset>
  );
}

function TimeStep({ slots, loading, selectedStart, onSelect }: {
  slots: SlotOption[];
  loading: boolean;
  selectedStart: string | undefined;
  onSelect: (startsAt: string) => void;
}) {
  // Date labels are unique within the 7-day window, so they double as group keys.
  const groupedSlots = slots.reduce<Record<string, SlotOption[]>>((groups, slot) => {
    groups[slot.dateLabel] = [...(groups[slot.dateLabel] ?? []), slot];
    return groups;
  }, {});

  return (
    <fieldset>
      <legend className={cn("mb-1", legendClass)}>4. Pick an arrival time</legend>
      <p className="mb-4 text-xs text-ink-faint">All times KST · matched against live groomer routes</p>
      <div className="grid gap-5 sm:grid-cols-2">
        {Object.entries(groupedSlots).map(([dateLabel, dateSlots]) => (
          <div key={dateLabel}>
            <p className="mb-2 text-sm font-bold text-ink">{dateLabel}</p>
            <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-3 sm:grid-cols-2">
              {dateSlots.map((slot) => (
                <button type="button" key={slot.startsAt} onClick={() => onSelect(slot.startsAt)} className={cn("whitespace-nowrap rounded-md border px-2 py-3 text-sm font-bold sm:px-3", selectedStart === slot.startsAt ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-soft")}>
                  {slot.timeLabel}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!loading && !slots.length && <p className="text-sm text-ink-muted">No routes are open for this address yet.</p>}
      </div>
    </fieldset>
  );
}

function VisitSummary({ petName, selectedPackage, selectedSlot, neighborhood, submitting, disabled, onConfirm }: {
  petName: string;
  selectedPackage: GroomingPackage | undefined;
  selectedSlot: SlotOption | undefined;
  neighborhood: string;
  submitting: boolean;
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <aside className="border-t border-line-soft bg-page p-5 sm:p-7 lg:border-l lg:border-t-0">
      <div className="lg:sticky lg:top-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">Visit summary</p>
        <p className="mt-5 text-2xl font-bold tracking-[-0.04em] text-ink">{petName || "Your pet"}</p>
        <p className="mt-1 text-sm text-ink-muted">{selectedPackage?.name ?? "Choose a service"}</p>
        <dl className="mt-7 space-y-4 border-y border-line py-5 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-ink-faint">Arrival</dt><dd className="text-right font-semibold text-ink">{selectedSlot ? `${selectedSlot.dateLabel}, ${selectedSlot.timeLabel}` : "Not selected"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-faint">Duration</dt><dd className="font-semibold text-ink">{selectedPackage?.durationMinutes ?? 0} min</dd></div>
          <div className="flex justify-between"><dt className="text-ink-faint">Neighborhood</dt><dd className="font-semibold text-ink">{neighborhood || "Not selected"}</dd></div>
        </dl>
        <div className="my-6 flex items-end justify-between">
          <span className="text-sm font-semibold text-ink-muted">Total</span>
          <span className="text-3xl font-bold tracking-[-0.05em] text-ink">{formatMoney(selectedPackage?.priceCents ?? 0)}</span>
        </div>
        <Button type="button" onClick={onConfirm} disabled={disabled} className="h-12 w-full rounded-md bg-brand text-sm font-bold !text-white shadow-none hover:bg-brand">{submitting ? "Saving your spot…" : "Confirm visit →"}</Button>
        <p className="mt-3 text-center text-[0.68rem] leading-5 text-ink-faint">No charge until your groomer is confirmed.</p>
      </div>
    </aside>
  );
}
