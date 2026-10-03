"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ToastOptions {
  action?: { label: string; onClick: () => void };
  tone?: "default" | "error";
  durationMs?: number;
}

interface ToastState extends ToastOptions {
  id: number;
  message: string;
}

const ToastContext = createContext<(message: string, options?: ToastOptions) => void>(() => {});

/** Show a short message, optionally with an action such as "Undo". */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = ++idRef.current;
    setToast({ id, message, ...options });
    timerRef.current = setTimeout(
      () => setToast((t) => (t?.id === id ? null : t)),
      options.durationMs ?? (options.action ? 5000 : 3000)
    );
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4"
      >
        {toast && (
          <div
            key={toast.id}
            className={`animate-toast-in pointer-events-auto flex max-w-md items-center gap-4 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.tone === "error"
                ? "bg-red-600 text-white"
                : "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
            }`}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  setToast(null);
                }}
                className="shrink-0 font-bold text-green-400 dark:text-green-700"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
