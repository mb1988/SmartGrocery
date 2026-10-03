/* eslint-disable @next/next/no-img-element */
import { getCategory } from "@/lib/categories";

interface ItemThumbProps {
  imageUrl?: string | null;
  category: string | null;
  size?: "sm" | "md";
}

/** Product photo when we have one, otherwise the category emoji. */
export default function ItemThumb({ imageUrl, category, size = "sm" }: ItemThumbProps) {
  const cat = getCategory(category);
  const box = size === "md" ? "h-11 w-11 text-2xl" : "h-9 w-9 text-lg";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className={`${box} shrink-0 rounded-lg bg-white object-contain ring-1 ring-gray-100 dark:ring-gray-800`}
      />
    );
  }
  return (
    <span
      title={cat.label}
      className={`${box} flex shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800`}
    >
      {cat.emoji}
    </span>
  );
}
