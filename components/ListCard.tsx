import Link from "next/link";
import { listDisplayName } from "@/lib/client";
import { TrashIcon } from "./icons";

interface ListCardProps {
  id: number;
  name: string | null;
  storeName: string | null;
  createdAt: string;
  completedAt: string | null;
  itemCount: number;
  checkedCount?: number;
  preview?: string[];
  onDelete?: () => void;
}

export default function ListCard({
  id,
  name,
  storeName,
  createdAt,
  completedAt,
  itemCount,
  checkedCount = 0,
  preview = [],
  onDelete,
}: ListCardProps) {
  const displayName = listDisplayName(name, storeName, createdAt);
  const isCompleted = !!completedAt;
  const progress = itemCount > 0 ? (checkedCount / itemCount) * 100 : 0;
  const more = itemCount - preview.length;

  return (
    <div
      className={`group relative rounded-2xl border bg-white shadow-sm transition-transform active:scale-[0.99] dark:bg-gray-900 ${
        isCompleted
          ? "border-gray-100 dark:border-gray-800"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <Link href={`/lists/${id}`} className="block p-4 pr-14">
        <div className="flex items-baseline gap-2">
          <span
            className={`truncate text-base font-semibold ${isCompleted ? "text-gray-500 dark:text-gray-400" : ""}`}
          >
            {displayName}
          </span>
          {isCompleted && (
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Done
            </span>
          )}
        </div>

        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {[name && storeName, `${itemCount} item${itemCount === 1 ? "" : "s"}`]
            .filter(Boolean)
            .join(" · ")}
          {!isCompleted && checkedCount > 0 && ` · ${checkedCount} ticked`}
        </p>

        {preview.length > 0 && (
          <p className="mt-1 truncate text-sm text-gray-400 dark:text-gray-500">
            {preview.join(", ")}
            {more > 0 && ` +${more}`}
          </p>
        )}

        {!isCompleted && itemCount > 0 && checkedCount > 0 && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${progress}%` }} />
          </div>
        )}
      </Link>

      {onDelete && (
        <button
          onClick={onDelete}
          aria-label={`Delete ${displayName}`}
          className="absolute right-1 top-1 flex h-12 w-12 items-center justify-center rounded-xl text-gray-300 transition-colors hover:text-red-500 active:text-red-500 dark:text-gray-600"
        >
          <TrashIcon className="h-[18px] w-[18px]" />
        </button>
      )}
    </div>
  );
}
