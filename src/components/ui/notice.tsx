import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const toneClasses = {
  success: "bg-emerald-50 text-emerald-800",
  error: "bg-red-50 text-red-700",
} as const;

type NoticeProps = HTMLAttributes<HTMLParagraphElement> & {
  tone?: keyof typeof toneClasses;
};

/**
 * Inline feedback for form and row actions. There is no toast system, and the
 * message text is what conveys the outcome, so the ARIA role matches the tone.
 */
export function Notice({
  tone = "error",
  className,
  children,
  ...props
}: NoticeProps) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md px-3 py-2 text-sm",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
