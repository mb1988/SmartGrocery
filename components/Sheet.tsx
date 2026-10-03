"use client";

import { useEffect } from "react";
import { CloseIcon } from "./icons";

interface SheetProps {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Bottom sheet modal — thumb-reachable on tall phones (_plan/05_ui_ux_plan.md). */
export default function Sheet({ title, onClose, children }: SheetProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Stop the page behind the sheet from scrolling
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-up pb-safe max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white px-5 pt-3 shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        {title && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="tap-target -mr-3 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

interface ConfirmSheetProps {
  title: string;
  message?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

export function ConfirmSheet({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  busy,
  onConfirm,
  onClose,
  children,
}: ConfirmSheetProps) {
  return (
    <Sheet title={title} onClose={onClose}>
      {message && <p className="mb-5 text-gray-500 dark:text-gray-400">{message}</p>}
      <div className="space-y-2">
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`tap-target w-full rounded-2xl text-base font-bold text-white transition-colors disabled:opacity-50 ${
            destructive ? "bg-red-600 active:bg-red-700" : "bg-green-600 active:bg-green-700"
          }`}
        >
          {busy ? "Please wait…" : confirmLabel}
        </button>
        {children}
        <button
          onClick={onClose}
          className="tap-target w-full rounded-2xl border border-gray-200 text-base font-semibold active:bg-gray-50 dark:border-gray-700 dark:active:bg-gray-800"
        >
          {cancelLabel}
        </button>
      </div>
    </Sheet>
  );
}
