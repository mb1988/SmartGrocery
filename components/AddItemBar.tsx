"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { ItemSearchResult } from "@/app/api/items/route";
import { getCategory } from "@/lib/categories";
import { api, haptic } from "@/lib/client";
import { formatQuantity, parseItemInput } from "@/lib/parseItem";
import { useToast } from "./Toast";
import { MicIcon, PlusIcon, ScanIcon } from "./icons";

const BarcodeScanner = dynamic(() => import("./BarcodeScanner"), { ssr: false });

// Minimal typing for the Web Speech API (not in TS's DOM lib)
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

interface AddItemBarProps {
  listId: number;
  onAdded: () => void;
}

export default function AddItemBar({ listId, onAdded }: AddItemBarProps) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ItemSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [adding, setAdding] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const parsed = parseItemInput(query);
  const searchTerm = query.trim() ? parsed.name : "";
  const qtyHint = query.trim() ? formatQuantity(parsed.quantity, parsed.unit) : null;

  useEffect(() => {
    setSpeechSupported(!!getSpeechRecognition());
    return () => recognitionRef.current?.stop();
  }, []);

  // Debounced, cancellable search — a slow older response can't overwrite a newer one
  useEffect(() => {
    if (searchTerm.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/items?search=${encodeURIComponent(searchTerm)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data: ItemSearchResult[] = await res.json();
        setSuggestions(data);
        setHighlight(-1);
        setOpen(data.length > 0);
      } catch {
        // Aborted or offline — keep whatever is showing
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm]);

  async function addItem(input: ItemSearchResult | null) {
    if (!query.trim() && !input) return;
    const name = input ? input.name : parsed.name;
    const body = {
      listId,
      itemName: name,
      quantity: parsed.quantity,
      unit: parsed.unit,
      ...(input
        ? {
            barcode: input.barcode ?? undefined,
            imageUrl: input.imageUrl ?? undefined,
            category: input.category ?? undefined,
          }
        : {}),
    };

    setAdding(true);
    setOpen(false);
    setQuery("");
    setHeard(null);
    try {
      const result = await api<{ merged: boolean }>("/api/list-items", {
        method: "POST",
        body,
      });
      haptic();
      if (result.merged) toast(`Already on your list — updated ${name}`);
      onAdded();
    } catch {
      toast(`Couldn't add ${name}`, { tone: "error" });
      setQuery(name);
    } finally {
      setAdding(false);
      inputRef.current?.focus();
    }
  }

  async function handleBarcodeDetected(barcode: string) {
    setScanning(false);
    setAdding(true);
    let product: ItemSearchResult;
    try {
      product = await api<ItemSearchResult>(`/api/barcode/${encodeURIComponent(barcode)}`);
    } catch {
      toast("Product not found — type the name instead", { tone: "error" });
      setAdding(false);
      return;
    }
    // Scanned products always go in as a single unit
    try {
      await api("/api/list-items", {
        method: "POST",
        body: {
          listId,
          itemName: product.name,
          barcode: product.barcode ?? undefined,
          imageUrl: product.imageUrl ?? undefined,
          category: product.category ?? undefined,
        },
      });
      haptic();
      toast(`Added ${product.name}`);
      onAdded();
    } catch {
      toast(`Couldn't add ${product.name}`, { tone: "error" });
    } finally {
      setAdding(false);
    }
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript?.trim() ?? "";
      if (transcript) {
        // Show what was heard and let the user confirm with Add (_plan/07_backlog.md)
        setQuery(transcript);
        setHeard(transcript);
        inputRef.current?.focus();
      }
    };
    recognition.onerror = (e) => {
      if (e.error === "not-allowed") toast("Microphone access was blocked", { tone: "error" });
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    haptic();
    recognition.start();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && open) {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp" && open) {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && query.trim() && !adding) {
      e.preventDefault();
      addItem(open && highlight >= 0 ? suggestions[highlight] : null);
    }
  }

  return (
    <div className="relative">
      {scanning && (
        <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setScanning(false)} />
      )}

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            enterKeyHint="done"
            placeholder={listening ? "Listening…" : "Add item, e.g. 2l milk"}
            value={query}
            maxLength={120}
            onChange={(e) => {
              setQuery(e.target.value);
              setHeard(null);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => suggestions.length > 0 && query.trim() && setOpen(true)}
            role="combobox"
            aria-expanded={open}
            aria-controls="add-item-suggestions"
            aria-label="Add an item"
            className={`w-full rounded-xl border bg-gray-50 py-3 pl-4 pr-12 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:focus:bg-gray-900 ${
              listening
                ? "border-red-400 dark:border-red-500"
                : "border-gray-200 dark:border-gray-700"
            }`}
            autoComplete="off"
          />
          {speechSupported && (
            <button
              onClick={toggleListening}
              disabled={adding}
              aria-label={listening ? "Stop listening" : "Add by voice"}
              aria-pressed={listening}
              className={`absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg transition-colors ${
                listening
                  ? "animate-pulse bg-red-500 text-white"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <MicIcon />
            </button>
          )}
        </div>
        <button
          onClick={() => setScanning(true)}
          disabled={adding}
          aria-label="Scan barcode"
          className="tap-target flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
        >
          <ScanIcon />
        </button>
        <button
          onClick={() => addItem(null)}
          disabled={adding || !query.trim()}
          aria-label="Add item"
          className="tap-target flex items-center justify-center rounded-xl bg-green-600 text-white active:bg-green-700 disabled:opacity-40"
        >
          {adding ? <span className="text-sm">…</span> : <PlusIcon />}
        </button>
      </div>

      {(heard || qtyHint) && query.trim() && (
        <p className="mt-1.5 px-1 text-xs text-gray-500 dark:text-gray-400">
          {heard && <>Heard “{heard}” · </>}
          Adding <strong className="text-gray-700 dark:text-gray-200">{parsed.name}</strong>
          {qtyHint && <> ({qtyHint})</>}
        </p>
      )}

      {open && (
        <ul
          id="add-item-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
        >
          {suggestions.map((item, i) => (
            <li
              key={`${item.source}-${item.id ?? item.barcode ?? item.name}`}
              role="option"
              aria-selected={i === highlight}
            >
              <button
                // onMouseDown fires before the input's blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault();
                  addItem(item);
                }}
                className={`tap-target flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-green-50 dark:hover:bg-green-950 ${
                  i === highlight ? "bg-green-50 dark:bg-green-950" : ""
                }`}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    className="h-9 w-9 flex-shrink-0 rounded-lg bg-white object-contain"
                  />
                ) : (
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-gray-800">
                    {getCategory(item.category).emoji}
                  </span>
                )}
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{item.name}</span>
                  <span className="truncate text-xs text-gray-400">
                    {[item.brand, item.category && getCategory(item.category).label]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
