import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  /** Error message class; defaults to the shared red. Override for a form-local error palette. */
  errorClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, errorClassName = "text-red-600", id, ...props },
  ref
) {
  const textareaId = id ?? props.name;
  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={textareaId} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-fire focus:outline-none focus:ring-1 focus:ring-fire",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error ? <p className={cn("text-sm", errorClassName)}>{error}</p> : null}
    </div>
  );
});