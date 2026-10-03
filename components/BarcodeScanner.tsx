"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "./icons";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  // Keep the latest callback without restarting the camera when the parent re-renders
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    let cancelled = false;
    let detected = false;

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();

        if (!videoRef.current || cancelled) return;

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result) => {
            // Errors on most frames just mean "no barcode yet" — ignore them
            if (cancelled || detected || !result) return;
            detected = true;
            controls.stop();
            if ("vibrate" in navigator) navigator.vibrate?.(40);
            onDetectedRef.current(result.getText());
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch {
        if (!cancelled) {
          setError("Camera not available. Please allow camera access and try again.");
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="pt-safe flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-white">Scan barcode</span>
        <button
          onClick={() => {
            controlsRef.current?.stop();
            onClose();
          }}
          aria-label="Close scanner"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
        {/* Aim guide */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-40 w-72 rounded-2xl border-4 border-green-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse bg-red-500/80" />
          </div>
        </div>
        {error && (
          <div className="absolute inset-x-4 top-4 rounded-xl bg-red-600 px-4 py-3 text-center text-sm text-white">
            {error}
          </div>
        )}
      </div>

      <p className="pb-safe pt-4 text-center text-sm text-gray-300">
        Point the camera at a product barcode
      </p>
    </div>
  );
}
