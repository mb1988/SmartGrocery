/**
 * categories.ts — Canonical category list for SmartGrocery.
 *
 * Item categories come from two messy sources: free-text typed by the user and
 * very specific Open Food Facts tags ("semi skimmed milks"). Everything is
 * normalised to one of the fixed ids below so the UI can show a consistent
 * badge. See _plan/07_backlog.md → "Better Category System".
 */

export const CATEGORIES = [
  { id: "produce", label: "Fruit & Veg", emoji: "🥦" },
  { id: "dairy", label: "Dairy & Eggs", emoji: "🥛" },
  { id: "meat", label: "Meat & Fish", emoji: "🥩" },
  { id: "bakery", label: "Bakery", emoji: "🍞" },
  { id: "frozen", label: "Frozen", emoji: "🧊" },
  { id: "pantry", label: "Pantry", emoji: "🥫" },
  { id: "drinks", label: "Drinks", emoji: "🧃" },
  { id: "snacks", label: "Snacks", emoji: "🍫" },
  { id: "household", label: "Household", emoji: "🧻" },
  { id: "other", label: "Other", emoji: "🛒" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));

// Checked in order — earlier groups win (e.g. "frozen peas" → frozen, "apple juice" → drinks).
const KEYWORDS: [CategoryId, string[]][] = [
  // Phrases that would otherwise be caught by a broader group below
  ["pantry", ["peanut butter", "coconut milk", "tinned", "tuna chunks"]],
  ["frozen", ["frozen", "ice cream", "ice lolly", "fish finger", "oven chip"]],
  [
    "household",
    [
      "toilet",
      "kitchen roll",
      "tissue",
      "washing",
      "detergent",
      "bleach",
      "cleaner",
      "soap",
      "shampoo",
      "conditioner",
      "toothpaste",
      "toothbrush",
      "deodorant",
      "bin bag",
      "foil",
      "cling film",
      "sponge",
      "nappies",
      "nappy",
      "wipes",
      "battery",
      "batteries",
      "light bulb",
      "dishwasher",
      "fabric softener",
      "razor",
    ],
  ],
  [
    "drinks",
    [
      "juice",
      "water",
      "cola",
      "lemonade",
      "squash",
      "coffee",
      "tea",
      "beer",
      "lager",
      "cider",
      "wine",
      "gin",
      "vodka",
      "whisky",
      "soda",
      "smoothie",
      "beverage",
      "drink",
      "energy drink",
      "tonic",
    ],
  ],
  [
    "dairy",
    [
      "milk",
      "cheese",
      "cheddar",
      "mozzarella",
      "parmesan",
      "butter",
      "yoghurt",
      "yogurt",
      "cream",
      "egg",
      "dairy",
      "creme fraiche",
      "halloumi",
      "feta",
      "margarine",
    ],
  ],
  [
    "meat",
    [
      "chicken",
      "beef",
      "pork",
      "lamb",
      "mince",
      "bacon",
      "sausage",
      "ham",
      "turkey",
      "steak",
      "salmon",
      "tuna steak",
      "cod",
      "haddock",
      "prawn",
      "fish",
      "chorizo",
      "salami",
      "meat",
      "seafood",
    ],
  ],
  [
    "bakery",
    [
      "bread",
      "loaf",
      "baguette",
      "roll",
      "bagel",
      "croissant",
      "crumpet",
      "muffin",
      "wrap",
      "tortilla",
      "pitta",
      "naan",
      "bun",
      "cake",
      "brioche",
      "bakery",
    ],
  ],
  [
    "produce",
    [
      "apple",
      "banana",
      "orange",
      "lemon",
      "lime",
      "grape",
      "strawberr",
      "raspberr",
      "blueberr",
      "pear",
      "peach",
      "plum",
      "melon",
      "mango",
      "pineapple",
      "avocado",
      "tomato",
      "potato",
      "onion",
      "garlic",
      "carrot",
      "broccoli",
      "cauliflower",
      "cabbage",
      "lettuce",
      "spinach",
      "cucumber",
      "pepper",
      "courgette",
      "mushroom",
      "celery",
      "leek",
      "kale",
      "salad",
      "herb",
      "coriander",
      "basil",
      "parsley",
      "ginger",
      "chilli",
      "fruit",
      "vegetable",
      "veg",
      "sweetcorn",
      "beansprout",
      "spring onion",
      "sweet potato",
    ],
  ],
  [
    "snacks",
    [
      "crisps",
      "chocolate",
      "biscuit",
      "sweets",
      "popcorn",
      "nuts",
      "crackers",
      "snack",
      "cookie",
      "flapjack",
      "cereal bar",
    ],
  ],
  [
    "pantry",
    [
      "pasta",
      "spaghetti",
      "penne",
      "rice",
      "noodle",
      "flour",
      "sugar",
      "salt",
      "oil",
      "vinegar",
      "sauce",
      "ketchup",
      "mayo",
      "mustard",
      "beans",
      "chickpea",
      "lentil",
      "tinned",
      "soup",
      "stock",
      "cereal",
      "oats",
      "porridge",
      "granola",
      "jam",
      "honey",
      "peanut butter",
      "spice",
      "tuna",
      "passata",
      "pesto",
      "curry",
      "gravy",
      "couscous",
      "quinoa",
      "hummus",
      "olive",
      "dip",
    ],
  ],
];

const KEYWORD_REGEXES: [CategoryId, RegExp][] = KEYWORDS.map(([id, words]) => [
  id,
  // Match at a word start so "ham" doesn't hit "shampoo" and "egg" doesn't hit "veggie"
  new RegExp(`\\b(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`),
]);

/**
 * Normalise a raw category (any source) plus the item name into a canonical id.
 * Returns null if nothing matches — callers can display that as "other".
 */
export function normalizeCategory(
  raw: string | null | undefined,
  name?: string | null
): CategoryId | null {
  const cleaned = raw?.trim().toLowerCase() ?? "";
  if (CATEGORY_IDS.has(cleaned)) return cleaned as CategoryId;

  // Try the raw category text first (more reliable for OFF tags), then the name
  for (const text of [cleaned, name?.trim().toLowerCase() ?? ""]) {
    if (!text) continue;
    for (const [id, re] of KEYWORD_REGEXES) {
      if (re.test(text)) return id;
    }
  }
  return null;
}

export function getCategory(id: string | null | undefined) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
