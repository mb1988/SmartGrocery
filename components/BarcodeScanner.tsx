"use client";

import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();

        if (!videoRef.current || cancelled) return;

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              controls.stop();
              onDetected(result.getText());
            }
            // err is just "not found yet" on most frames — ignore
            void err;
          }
        );

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
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-white">Scan barcode</span>
        <button
          onClick={() => {
            controlsRef.current?.stop();
            onClose();
          }}
          className="rounded-full bg-white/10 px-3 py-1 text-sm text-white active:bg-white/20"
        >
          Cancel
        </button>
      </div>

      {/* Viewfinder */}
      <div className="relative flex flex-1 items-center justify-center">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
        {/* Aim guide */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-40 w-72 rounded-2xl border-4 border-green-400 opacity-80" />
        </div>
        {error && (
          <div className="absolute inset-x-4 top-4 rounded-xl bg-red-600 px-4 py-3 text-center text-sm text-white">
            {error}
          </div>
        )}
      </div>

      <p className="py-4 text-center text-xs text-gray-400">
        Point the camera at a product barcode
      </p>
    </div>
  );
}
