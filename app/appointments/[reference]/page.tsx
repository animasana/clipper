import ArrowLeft from "lucide-react/icons/arrow-left";
import ArrowUpRight from "lucide-react/icons/arrow-up-right";
import Phone from "lucide-react/icons/phone";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppointmentCard } from "@/components/clipper/appointment-card";
import { BookingConfirmation } from "@/components/clipper/booking-confirmation";
import { ManageAppointment } from "@/components/clipper/manage-appointment";
import { ThemeToggle } from "@/components/clipper/theme-toggle";
import { changeBlockedReason } from "@/lib/clipper/changes";
import { getAppointmentByReference } from "@/lib/clipper/data";

type AppointmentPageProps = {
  params: Promise<{ reference: string }>;
};

export const dynamic = "force-dynamic";

export default async function AppointmentPage({ params }: AppointmentPageProps) {
  const { reference } = await params;
  const appointment = await getAppointmentByReference(reference);

  if (!appointment) {
    notFound();
  }

  const isCancelled = appointment.status === "cancelled";

  return (
    <main className="relative min-h-screen overflow-clip bg-page text-ink">
      <div aria-hidden="true" className="absolute -right-[28rem] -top-[35rem] h-[62rem] w-[62rem] rotate-[24deg] bg-[linear-gradient(135deg,#ffdb80,#ff8f70_28%,#d783ff_52%,#7a73ff_74%,#68d5ff)] opacity-55 blur-[3px] dark:opacity-30" />
      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 lg:px-12">
        <header className="relative flex items-center justify-between py-6 sm:py-8">
          <Link href="/" className="text-2xl font-black tracking-[-0.07em] text-ink">clipper</Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link href="/#book-prism" className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-brand px-5 py-2.5 text-sm font-bold !text-white transition-colors hover:bg-night">
              <span className="max-[399px]:hidden">Book another visit</span><span className="min-[400px]:hidden">Book again</span> <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </header>

        <div className="relative mx-auto max-w-4xl pt-8 sm:pt-14">
          <Link href="/appointments" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-brand-text">
            <ArrowLeft aria-hidden="true" className="size-4" /> All appointments
          </Link>
          <BookingConfirmation appointment={appointment} />

          <div className="mt-7">
            <AppointmentCard appointment={appointment} />
          </div>

          {!isCancelled && (
            <div className="mt-8">
              <ManageAppointment reference={appointment.reference} blockedReason={changeBlockedReason(appointment)} />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-line bg-surface px-5 py-5 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <p className="font-semibold text-ink">{isCancelled ? "Questions about this visit?" : "Need to change something else?"}</p>
              <p className="mt-1">{isCancelled ? "Give our tiny team a call and we’ll take care of it." : "Within 24 hours of your visit, or for anything else, give our tiny team a call."}</p>
            </div>
            <a href="tel:+8225550142" className="inline-flex items-center gap-2 font-bold text-brand-text hover:text-ink">
              <Phone aria-hidden="true" className="size-4" /> 02-555-0142
            </a>
          </div>
        </div>

        <footer className="relative mx-auto mt-16 flex max-w-4xl flex-col gap-2 border-t border-line pt-5 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>Clipper · Seoul, Korea</span>
          <span>Thoughtful grooming, right at home.</span>
        </footer>
      </div>
    </main>
  );
}
