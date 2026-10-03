/**
 * parseItem.ts — Natural-language item parsing.
 *
 * Turns "2 litres of semi-skimmed milk", "500g mince", "eggs x12" or
 * "a dozen eggs" into { name, quantity, unit }. Used by the typed add bar and
 * by voice input (_plan/07_backlog.md → "Voice Input").
 */

export interface ParsedItem {
  name: string;
  quantity: number;
  unit: string | null;
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  dozen: 12,
  half: 0.5,
  couple: 2,
};

const UNIT_ALIASES: Record<string, string> = {
  g: "g",
  gram: "g",
  grams: "g",
  gramme: "g",
  grammes: "g",
  kg: "kg",
  kgs: "kg",
  kilo: "kg",
  kilos: "kg",
  kilogram: "kg",
  kilograms: "kg",
  l: "l",
  litre: "l",
  litres: "l",
  liter: "l",
  liters: "l",
  ml: "ml",
  millilitre: "ml",
  millilitres: "ml",
  pint: "pint",
  pints: "pint",
  pack: "pack",
  packs: "pack",
  packet: "pack",
  packets: "pack",
  bottle: "bottle",
  bottles: "bottle",
  can: "can",
  cans: "can",
  tin: "tin",
  tins: "tin",
  box: "box",
  boxes: "box",
  bag: "bag",
  bags: "bag",
  jar: "jar",
  jars: "jar",
  loaf: "loaf",
  loaves: "loaf",
  bunch: "bunch",
  bunches: "bunch",
  tub: "tub",
  tubs: "tub",
};

function toNumber(token: string): number | null {
  const n = parseFloat(token.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseItemInput(input: string): ParsedItem {
  let text = input.trim().toLowerCase().replace(/\s+/g, " ");
  let quantity: number | null = null;
  let unit: string | null = null;

  // Trailing multiplier: "eggs x12", "milk × 2"
  const trailing = text.match(/^(.+?)\s*[x×]\s*(\d+(?:[.,]\d+)?)$/);
  if (trailing) {
    const n = toNumber(trailing[2]);
    if (n) {
      quantity = n;
      text = trailing[1].trim();
    }
  }

  const tokens = text.split(" ");

  if (quantity === null && tokens.length > 1) {
    // "500g", "2kg", "2", "1.5"
    const numeric = tokens[0].match(/^(\d+(?:[.,]\d+)?)([a-z]+)?$/);
    if (numeric && (!numeric[2] || UNIT_ALIASES[numeric[2]])) {
      quantity = toNumber(numeric[1]);
      if (numeric[2]) unit = UNIT_ALIASES[numeric[2]];
      if (quantity !== null) tokens.shift();
    } else if (NUMBER_WORDS[tokens[0]] !== undefined) {
      quantity = NUMBER_WORDS[tokens[0]];
      tokens.shift();
      // "a dozen eggs", "half a kilo"
      if (tokens[0] === "dozen" && quantity === 1) {
        quantity = 12;
        tokens.shift();
      } else if (tokens[0] === "a" || tokens[0] === "an") {
        tokens.shift();
      }
    }

    if (quantity !== null && !unit && tokens.length > 1 && UNIT_ALIASES[tokens[0]]) {
      unit = UNIT_ALIASES[tokens.shift() as string];
    }
    if (quantity !== null && tokens.length > 1 && tokens[0] === "of") {
      tokens.shift();
    }
  }

  const name = tokens.join(" ").trim();
  // Never return an empty name — fall back to the raw input
  if (!name) return { name: input.trim().toLowerCase(), quantity: 1, unit: null };

  return { name, quantity: quantity ?? 1, unit };
}

/** Human-friendly quantity label: "2", "1.5 kg", "500 g". Returns null for a plain "1". */
export function formatQuantity(quantity: number, unit: string | null): string | null {
  if (quantity === 1 && !unit) return null;
  const q = Number.isInteger(quantity) ? String(quantity) : String(+quantity.toFixed(2));
  if (!unit) return `×${q}`;
  return `${q} ${unit}`;
}
