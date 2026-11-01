"use client";

import CloudOff from "lucide-react/icons/cloud-off";
import RefreshCcw from "lucide-react/icons/refresh-ccw";

import { MessagePage, messagePageActionClass } from "@/components/clipper/message-page";

export default function AppointmentError({ reset }: { reset: () => void }) {
  return (
    <MessagePage
      icon={<CloudOff aria-hidden="true" />}
      eyebrow="A small snag"
      title="We couldn’t load that visit."
      body="Something went wrong on our end. Please try again in a moment."
      action={
        <button type="button" onClick={reset} className={messagePageActionClass}>
          <RefreshCcw aria-hidden="true" className="size-4" /> Try again
        </button>
      }
    />
  );
}
