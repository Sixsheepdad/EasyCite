import type { CiteBridgeIndexItem, ZoteroPayloadItem } from "./schema.js";
import { creatorDisplayName } from "./citekey.js";

const ENTRY_TYPES: Record<string, string> = {
  journalArticle: "article",
  conferencePaper: "inproceedings",
  book: "book",
  bookSection: "incollection",
  thesis: "phdthesis",
  preprint: "misc",
  report: "techreport",
  webpage: "misc"
};

export function parseBibtexKeys(content: string): Set<string> {
  const keys = new Set<string>();
  const regex = /@\w+\s*\{\s*([^,\s]+)\s*,/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content))) {
    keys.add(match[1]);
  }
  return keys;
}

export function bibtexHasDoi(content: string, doi?: string): boolean {
  if (!doi) return false;
  const normalized = normalizeDoi(doi);
  return normalizeDoi(content).includes(normalized);
}

export function withBibtexKey(bibtex: string, citekey: string): string {
  return bibtex.replace(/(@\w+\s*\{\s*)[^,\s]+(\s*,)/, `$1${citekey}$2`);
}

export function createMinimalBibtex(item: ZoteroPayloadItem, citekey: string): string {
  const type = ENTRY_TYPES[item.itemType ?? ""] ?? "misc";
  const fields: [string, string | undefined][] = [
    ["author", formatAuthors(item)],
    ["title", item.title],
    [type === "article" ? "journal" : "booktitle", item.publicationTitle],
    ["volume", item.volume],
    ["number", item.issue],
    ["pages", item.pages],
    ["year", item.year ?? item.date?.match(/\d{4}/)?.[0]],
    ["doi", item.doi],
    ["url", item.url]
  ];

  const rendered = fields
    .filter(([, value]) => value && value.trim().length > 0)
    .map(([key, value]) => `  ${key} = {${escapeBibtex(value ?? "")}}`)
    .join(",\n");

  return `@${type}{${citekey},\n${rendered}\n}`;
}

export function indexItemToBibtex(item: CiteBridgeIndexItem): string | undefined {
  return item.bibtex ? withBibtexKey(item.bibtex, item.citekey) : undefined;
}

function formatAuthors(item: ZoteroPayloadItem): string | undefined {
  const authors = item.creators?.filter((creator) => !creator.creatorType || creator.creatorType === "author");
  if (!authors?.length) return undefined;
  return authors.map(creatorDisplayName).filter(Boolean).join(" and ");
}

function escapeBibtex(value: string): string {
  return value.replace(/[{}]/g, "");
}

function normalizeDoi(value: string): string {
  return value.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "").replace(/\s+/g, "");
}
