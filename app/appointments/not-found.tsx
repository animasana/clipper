import ArrowUpRight from "lucide-react/icons/arrow-up-right";
import SearchX from "lucide-react/icons/search-x";
import Link from "next/link";

import { MessagePage, messagePageActionClass } from "@/components/clipper/message-page";

export default function AppointmentNotFound() {
  return (
    <MessagePage
      icon={<SearchX aria-hidden="true" />}
      eyebrow="That link wandered off"
      title="We can’t find that visit."
      body="Check the booking reference and try again, or start a fresh Clipper booking."
      action={
        <Link href="/#book-prism" className={messagePageActionClass}>
          Book a visit <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      }
    />
  );
}
