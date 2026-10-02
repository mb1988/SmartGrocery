"use client";

import { useEffect, useState } from "react";
import { CloseIcon, DownloadIcon } from "./icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "sg-install-dismissed";

/** "Install SmartGrocery" banner using the browser's beforeinstallprompt event (Android/Chrome). */
export default function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // Storage blocked — still offer the prompt
    }
    function onPrompt(e: Event) {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!event) return null;

  function dismiss() {
    setEvent(null);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
        <DownloadIcon />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Install SmartGrocery</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          One tap from your home screen when you&apos;re in the shop.
        </p>
      </div>
      <button
        onClick={async () => {
          await event.prompt();
          await event.userChoice;
          dismiss();
        }}
        className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white active:bg-green-700"
      >
        Install
      </button>
      <button onClick={dismiss} aria-label="Dismiss" className="p-1 text-gray-400">
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
