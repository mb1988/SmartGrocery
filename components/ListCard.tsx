import Link from "next/link";

interface ListCardProps {
  id: number;
  name: string | null;
  storeName: string | null;
  createdAt: string;
  completedAt: string | null;
  itemCount: number;
  checkedCount?: number;
}

export default function ListCard({
  id,
  name,
  storeName,
  createdAt,
  completedAt,
  itemCount,
  checkedCount = 0,
}: ListCardProps) {
  const displayName =
    name ??
    `${storeName ?? "Shop"} – ${new Date(createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })}`;

  const isCompleted = !!completedAt;

  return (
    <Link
      href={`/lists/${id}`}
      className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-transform active:scale-[0.98] dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-base font-semibold">{displayName}</span>
        {storeName && <span className="text-sm text-gray-500 dark:text-gray-400">{storeName}</span>}
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
  );
}
