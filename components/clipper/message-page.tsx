import ArrowLeft from "lucide-react/icons/arrow-left";
import Link from "next/link";

import { ThemeToggle } from "@/components/clipper/theme-toggle";

type MessagePageProps = {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  /** Primary call to action (a brand-filled link or button). */
  action: React.ReactNode;
};

/** Full-page notice (not found, load error) in the same prism look as the rest of the app. */
export function MessagePage({ icon, eyebrow, title, body, action }: MessagePageProps) {
  return (
    <main className="relative min-h-screen overflow-clip bg-page text-ink">
      <div aria-hidden="true" className="absolute -right-[28rem] -top-[35rem] h-[62rem] w-[62rem] rotate-[24deg] bg-[linear-gradient(135deg,#ffdb80,#ff8f70_28%,#d783ff_52%,#7a73ff_74%,#68d5ff)] opacity-55 blur-[3px] dark:opacity-30" />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between py-6 sm:py-8">
          <Link href="/" className="text-2xl font-black tracking-[-0.07em] text-ink">clipper</Link>
          <ThemeToggle />
        </header>

        <section className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-surface px-6 py-10 text-center shadow-[0_28px_80px_rgb(38_46_77/10%)] sm:mt-16 sm:px-10">
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-brand-wash text-brand-text [&_svg]:size-6">{icon}</div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-text">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold leading-[1] tracking-[-0.05em]">{title}</h1>
          <p className="mt-4 text-sm leading-6 text-ink-muted">{body}</p>
          <div className="mt-7 flex flex-col items-center gap-4">
            {action}
            <Link href="/appointments" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-brand-text">
              <ArrowLeft aria-hidden="true" className="size-4" /> All appointments
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

/** Brand-filled CTA styling shared by the message pages' primary action. */
export const messagePageActionClass =
  "inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold !text-white transition-colors hover:bg-night";
