import Link from "next/link";

interface ListCardProps {
  id: number;
  name: string | null;
  storeName: string | null;
  createdAt: string;
  completedAt: string | null;
  itemCount: number;
  checkedCount?: number;
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
  onDelete,
}: ListCardProps) {
  const displayName =
    name ??
    `${storeName ?? "Shop"} – ${new Date(createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })}`;

  const isCompleted = !!completedAt;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/lists/${id}`}
        className="flex flex-1 items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-transform active:scale-[0.98] dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-base font-semibold">{displayName}</span>
          {storeName && (
            <span className="text-sm text-gray-500 dark:text-gray-400">{storeName}</span>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {checkedCount} / {itemCount} items
          </span>
        </div>

        <span
          className={`ml-4 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            isCompleted
              ? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          }`}
        >
          {isCompleted ? "Completed" : "Active"}
        </span>
      </Link>

      {onDelete && (
        <button
          onClick={onDelete}
          aria-label="Delete list"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors active:bg-red-50 active:text-red-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      )}
    </div>
  );
}
