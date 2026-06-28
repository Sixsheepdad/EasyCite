import type { Creator, ZoteroPayloadItem } from "./schema.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "based",
  "by",
  "for",
  "from",
  "in",
  "into",
  "of",
  "on",
  "the",
  "to",
  "toward",
  "towards",
  "using",
  "via",
  "with"
]);

export function creatorDisplayName(creator: Creator): string {
  if (creator.name) return creator.name;
  const parts = [creator.lastName, creator.firstName].filter(Boolean);
  return parts.join(", ");
}

export function firstAuthorLastName(item: ZoteroPayloadItem): string {
  const first = item.creators?.find((creator) => creator.creatorType === "author") ?? item.creators?.[0];
  const value = first?.lastName ?? first?.name ?? "Unknown";
  return sanitizePart(value) || "Unknown";
}

export function itemYear(item: ZoteroPayloadItem): string {
  const source = item.year || item.date || "";
  return source.match(/\d{4}/)?.[0] ?? "n.d.";
}

export function generateCitekey(item: ZoteroPayloadItem, existing: Iterable<string> = []): string {
  const used = new Set(Array.from(existing));
  const base = `${firstAuthorLastName(item)}${itemYear(item)}${titleKeyword(item.title ?? "")}`;
  let candidate = base || "Reference";
  if (!used.has(candidate)) return candidate;

  for (let code = 65; code <= 90; code += 1) {
    candidate = `${base}${String.fromCharCode(code)}`;
    if (!used.has(candidate)) return candidate;
  }

  let suffix = 2;
  do {
    candidate = `${base}${suffix}`;
    suffix += 1;
  } while (used.has(candidate));
  return candidate;
}

function titleKeyword(title: string): string {
  const acronym = title.match(/\b[A-Z][A-Z0-9]{2,}[A-Za-z0-9-]*\b/)?.[0];
  if (acronym) return sanitizePart(acronym);

  for (const word of title.split(/\s+/)) {
    const clean = word.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length >= 4 && !STOP_WORDS.has(clean.toLowerCase())) {
      return capitalize(clean);
    }
  }
  return "Reference";
}

function sanitizePart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
