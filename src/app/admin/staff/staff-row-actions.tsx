"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { setSalesStaffActive } from "./actions";

interface StaffRowActionsProps {
  id: string;
  name: string;
  active: boolean;
}

export function StaffRowActions({ id, name, active }: StaffRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{ status: "success" | "error"; message: string } | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isConfirming) confirmRef.current?.focus();
  }, [isConfirming]);

  useEffect(() => {
    if (!isConfirming) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsConfirming(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isConfirming]);

  function closeDialog() {
    setIsConfirming(false);
    triggerRef.current?.focus();
  }

  function applyStatus(nextActive: boolean) {
    setIsConfirming(false);
    triggerRef.current?.focus();
    setFeedback(null);
    startTransition(async () => {
      const result = await setSalesStaffActive({ id, active: nextActive });
      setFeedback({ status: result.status, message: result.message });
      if (result.status === "success") router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-3">
        <Link
          href={`/admin/staff/${id}/edit`}
          className="text-sm font-medium text-fire hover:text-fire-dark"
        >
          Edit
        </Link>
        <Button
          ref={triggerRef}
          variant="ghost"
          disabled={isPending}
          onClick={() => setIsConfirming(true)}
          className="text-sm"
        >
          {isPending ? "Saving..." : active ? "Deactivate" : "Reactivate"}
        </Button>
      </div>

      {feedback ? <Notice tone={feedback.status}>{feedback.message}</Notice> : null}

      {isConfirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`staff-status-title-${id}`}
            aria-describedby={`staff-status-desc-${id}`}
            className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-5 shadow-lg"
          >
            <h2
              id={`staff-status-title-${id}`}
              className="text-base font-semibold text-neutral-900"
            >
              {active ? "Deactivate account?" : "Reactivate account?"}
            </h2>
            <p id={`staff-status-desc-${id}`} className="mt-2 text-sm text-neutral-600">
              {active
                ? `${name} will no longer be able to sign in. Their inventory history is kept.`
                : `${name} will be able to sign in again.`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                ref={confirmRef}
                variant={active ? "danger" : "primary"}
                onClick={() => applyStatus(!active)}
              >
                {active ? "Deactivate" : "Reactivate"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
