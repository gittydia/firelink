"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
}

/**
 * Built on the native <dialog> element: showModal() gives us the focus trap,
 * the inert background, Escape handling and top-layer stacking for free, so the
 * only focus work left is returning focus to whatever opened the dialog.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  closeLabel = "Close",
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      restoreFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Escape fires the native close event too, so every exit runs this path and
  // focus always comes back to the trigger.
  const handleClose = useCallback(() => {
    onClose();
    const previous = restoreFocusRef.current;
    restoreFocusRef.current = null;
    previous?.focus();
  }, [onClose]);

  // A backdrop click lands on the dialog element itself while a click inside the
  // content bubbles up from a child, so comparing the two is what separates them.
  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={handleClick}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "m-auto w-[min(48rem,calc(100vw-2rem))] rounded-lg border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-4 py-3">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="truncate text-base font-semibold text-neutral-900"
          >
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="truncate text-xs text-neutral-500">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="size-4 fill-current"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>
  );
}
