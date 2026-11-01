import Check from "lucide-react/icons/check";
import Clock3 from "lucide-react/icons/clock-3";
import X from "lucide-react/icons/x";

type StatusDisplay = {
  label: string;
  /** Badge colours (border + wash + text). */
  className: string;
  /** Text colour alone, for inline status text. */
  textClassName: string;
  Icon: typeof Check;
};

const statuses: Record<string, StatusDisplay> = {
  confirmed: { label: "Confirmed", className: "border-success-line bg-success-wash text-success", textClassName: "text-success", Icon: Check },
  completed: { label: "Completed", className: "border-info-line bg-info-wash text-info", textClassName: "text-info", Icon: Check },
  cancelled: { label: "Cancelled", className: "border-danger-line bg-danger-wash text-danger", textClassName: "text-danger", Icon: X },
  pending: { label: "Pending", className: "border-warn-line bg-warn-wash text-warn", textClassName: "text-warn", Icon: Clock3 },
};

const unknownStatus: StatusDisplay = { label: "Booked", className: "border-info-line bg-info-wash text-info", textClassName: "text-info", Icon: Check };

/** Label, colours and icon for an appointment status; every page renders status through this. */
export function statusDisplay(status: string | null | undefined): StatusDisplay {
  return statuses[status ?? ""] ?? unknownStatus;
}
