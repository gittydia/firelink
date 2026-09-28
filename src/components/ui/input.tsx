import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /**
   * Class for the error message text. Defaults to the shared red so existing
   * callers are unchanged; override only where a form has its own error palette.
   */
  errorClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    label,
    error,
    errorClassName = "text-red-600",
    id,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const inputId = id ?? props.name;
  // Ties the field error to the input so screen readers announce *why* it is
  // invalid, not just that it is. Any caller-supplied description is kept.
  const errorId = inputId ? `${inputId}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className="space-y-1">
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-fire focus:outline-none focus:ring-1 focus:ring-fire",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className={cn("text-sm", errorClassName)}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
