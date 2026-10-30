import CalendarDays from "lucide-react/icons/calendar-days";
import Check from "lucide-react/icons/check";
import Clock3 from "lucide-react/icons/clock-3";
import Dog from "lucide-react/icons/dog";
import MapPin from "lucide-react/icons/map-pin";
import Scissors from "lucide-react/icons/scissors";
import StickyNote from "lucide-react/icons/sticky-note";
import UserRound from "lucide-react/icons/user-round";

import { formatSeoulDate, formatSeoulTime } from "@/lib/clipper/time";
import type { AppointmentDetails } from "@/lib/clipper/types";

type AppointmentCardProps = {
  appointment: AppointmentDetails;
};

type DetailsForDisplay = {
  reference?: string | null;
  bookingReference?: string;
  address?: string | null;
  neighborhood?: string | null;
  startsAt?: Date | number | string | null;
  endsAt?: Date | number | string | null;
  status?: string | null;
  priceCents?: number | null;
  notes?: string | null;
  pet?: {
    name?: string | null;
    breed?: string | null;
  } | null;
  groomer?: { name?: string | null; bio?: string | null } | null;
  package?: {
    name?: string | null;
    description?: string | null;
    durationMinutes?: number | null;
  } | null;
  groomingPackage?: {
    name?: string | null;
    description?: string | null;
    durationMinutes?: number | null;
  } | null;
};

const statusLabels: Record<string, { label: string; className: string }> = {
  confirmed: {
    label: "Confirmed",
    className: "border-success-line bg-success-wash text-success",
  },
  completed: {
    label: "Completed",
    className: "border-info-line bg-info-wash text-info",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-danger-line bg-danger-wash text-danger",
  },
  pending: {
    label: "Pending",
    className: "border-warn-line bg-warn-wash text-warn",
  },
};

function formatPrice(priceCents: number | null | undefined) {
  if (typeof priceCents !== "number") return "Price to be confirmed";
  return `₩${priceCents.toLocaleString("ko-KR")}`;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const details = appointment as unknown as DetailsForDisplay;
  const service = details.package ?? details.groomingPackage;
  const status = statusLabels[details.status ?? ""] ?? {
    label: details.status ?? "Booked",
    className: "border-info-line bg-info-wash text-info",
  };
  const appointmentDate = formatSeoulDate(details.startsAt, "full") ?? "Date to be confirmed";
  const startTime = formatSeoulTime(details.startsAt) ?? "Time to be confirmed";
  const endTime = formatSeoulTime(details.endsAt) ?? "Time to be confirmed";
  const address = details.address ?? "Address to be confirmed";
  const neighborhood = details.neighborhood ? `, ${details.neighborhood}` : "";
  const petName = details.pet?.name ?? "Your pet";

  return (
    <section aria-labelledby="appointment-details-heading" className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_20px_60px_rgba(38,46,77,0.08)]">
      <div className="border-b border-line-soft px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-text">Your Clipper visit</p>
            <h2 id="appointment-details-heading" className="text-3xl font-bold leading-none tracking-[-0.04em] text-ink sm:text-4xl">
              {petName}&apos;s appointment
            </h2>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}>
            <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
            {status.label}
          </span>
        </div>
      </div>

      <div className="grid gap-0 divide-y divide-line-soft sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="space-y-5 px-5 py-6 sm:px-8 sm:py-7">
          <DetailRow icon={<CalendarDays aria-hidden="true" />} label="When">
            <strong className="block font-semibold text-ink">{appointmentDate}</strong>
            <span>{startTime} – {endTime}</span>
          </DetailRow>
          <DetailRow icon={<MapPin aria-hidden="true" />} label="Where">
            <strong className="block font-semibold text-ink">At your home</strong>
            <span>{address}{neighborhood}</span>
          </DetailRow>
          <DetailRow icon={<Clock3 aria-hidden="true" />} label="Visit length">
            <strong className="block font-semibold text-ink">{service?.durationMinutes ?? "—"} minutes</strong>
            <span>Our groomer brings everything</span>
          </DetailRow>
        </div>

        <div className="space-y-5 px-5 py-6 sm:px-8 sm:py-7">
          <DetailRow icon={<Dog aria-hidden="true" />} label="Pet">
            <strong className="block font-semibold text-ink">{petName}</strong>
            <span>{details.pet?.breed ?? "Breed not specified"}</span>
          </DetailRow>
          <DetailRow icon={<Scissors aria-hidden="true" />} label="Service">
            <strong className="block font-semibold text-ink">{service?.name ?? "Grooming visit"}</strong>
            <span>{service?.description ?? "A thoughtful grooming visit, right at home."}</span>
          </DetailRow>
          <DetailRow icon={<UserRound aria-hidden="true" />} label="Your groomer">
            <strong className="block font-semibold text-ink">{details.groomer?.name ?? "A Clipper groomer"}</strong>
            <span>{details.groomer?.bio ?? "A friendly professional from the Clipper team."}</span>
          </DetailRow>
        </div>
      </div>

      <div className="grid gap-0 border-t border-line-soft bg-page sm:grid-cols-[1fr_auto]">
        <div className="px-5 py-5 sm:px-8">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-faint">Notes for your groomer</p>
          <p className="flex items-start gap-2 text-sm leading-6 text-ink-muted">
            <StickyNote aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand-text" />
            <span>{details.notes ?? "No special notes added for this visit."}</span>
          </p>
        </div>
        <div className="border-t border-line-soft px-5 py-5 sm:border-l sm:border-t-0 sm:px-8 sm:text-right">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-faint">Total</p>
          <p className="text-3xl font-bold tracking-[-0.04em] text-ink">{formatPrice(details.priceCents)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-5 py-4 text-xs text-ink-faint sm:px-8">
        <span>Booked with Clipper</span>
        <span className="font-mono tracking-[0.12em] text-ink-muted">{details.reference ?? details.bookingReference ?? "CLP—"}</span>
      </div>
    </section>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand-text [&_svg]:size-4">{icon}</div>
      <div className="min-w-0 text-sm leading-6 text-ink-muted">
        <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint">{label}</p>
        {children}
      </div>
    </div>
  );
}
