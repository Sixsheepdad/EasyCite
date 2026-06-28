import type { ImportPayload } from "./schema.js";

export function validateImportPayload(payload: unknown): { ok: true; payload: ImportPayload } | { ok: false; message: string } {
  if (!isRecord(payload)) return { ok: false, message: "Payload is not an object." };
  const record = payload;
  const data = payload as Partial<ImportPayload>;
  if (data.protocolVersion !== 1) return { ok: false, message: "Unsupported protocol version." };
  if (data.action !== "importItems") return { ok: false, message: "Unsupported payload action." };
  if (data.source !== "zotero") return { ok: false, message: "Unsupported payload source." };
  const requestId = validateString(record, "requestId", { required: true, maxLength: 128 });
  if (requestId) return requestId;
  const targetProjectId = validateString(record, "targetProjectId", { required: true, maxLength: 256 });
  if (targetProjectId) return targetProjectId;
  const projectToken = validateString(record, "projectToken", { required: true, maxLength: 256 });
  if (projectToken) return projectToken;
  const createdAt = validateString(record, "createdAt", { maxLength: 64 });
  if (createdAt) return createdAt;
  if (!Array.isArray(data.items) || data.items.length === 0) return { ok: false, message: "Payload has no items." };
  if (data.items.length > 500) return { ok: false, message: "Payload contains too many items." };
  for (const [index, item] of data.items.entries()) {
    const error = validatePayloadItem(item, index);
    if (error) return error;
  }
  return { ok: true, payload: data as ImportPayload };
}

function validatePayloadItem(item: unknown, index: number): { ok: false; message: string } | undefined {
  const prefix = `items[${index}]`;
  if (!isRecord(item)) return { ok: false, message: `${prefix} is not an object.` };
  for (const field of ["libraryType", "libraryId", "itemKey"] as const) {
    const error = validateString(item, field, { required: true, maxLength: 128, label: `${prefix}.${field}` });
    if (error) return error;
  }
  for (const field of [
    "itemType",
    "title",
    "year",
    "date",
    "doi",
    "publicationTitle",
    "volume",
    "issue",
    "pages",
    "url",
    "abstractNote",
    "zoteroURI",
    "preferredCitationKey"
  ] as const) {
    const error = validateString(item, field, { maxLength: stringLimit(field), allowNull: field === "preferredCitationKey", label: `${prefix}.${field}` });
    if (error) return error;
  }
  const bibtex = validateString(item, "bibtex", { maxLength: 1000000, allowNull: true, label: `${prefix}.bibtex` });
  if (bibtex) return bibtex;
  if (item.creators !== undefined) {
    if (!Array.isArray(item.creators)) return { ok: false, message: `${prefix}.creators must be an array.` };
    if (item.creators.length > 200) return { ok: false, message: `${prefix}.creators contains too many entries.` };
    for (const [creatorIndex, creator] of item.creators.entries()) {
      if (!isRecord(creator)) return { ok: false, message: `${prefix}.creators[${creatorIndex}] is not an object.` };
      for (const field of ["creatorType", "firstName", "lastName", "name"] as const) {
        const error = validateString(creator, field, { maxLength: 512, label: `${prefix}.creators[${creatorIndex}].${field}` });
        if (error) return error;
      }
    }
  }
  if (item.attachments !== undefined) {
    if (!Array.isArray(item.attachments)) return { ok: false, message: `${prefix}.attachments must be an array.` };
    if (item.attachments.length > 200) return { ok: false, message: `${prefix}.attachments contains too many entries.` };
    for (const [attachmentIndex, attachment] of item.attachments.entries()) {
      if (!isRecord(attachment)) return { ok: false, message: `${prefix}.attachments[${attachmentIndex}] is not an object.` };
      for (const field of ["type", "title", "path", "filename"] as const) {
        const error = validateString(attachment, field, {
          maxLength: field === "path" ? 4096 : 512,
          label: `${prefix}.attachments[${attachmentIndex}].${field}`
        });
        if (error) return error;
      }
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validateString(
  data: Record<string, unknown>,
  field: string,
  options: { required?: boolean; maxLength: number; allowNull?: boolean; label?: string }
): { ok: false; message: string } | undefined {
  const label = options.label ?? field;
  const value = data[field];
  if (value === undefined) {
    return options.required ? { ok: false, message: `${label} is required.` } : undefined;
  }
  if (value === null && options.allowNull) return undefined;
  if (typeof value !== "string") return { ok: false, message: `${label} must be a string.` };
  if (options.required && value.trim() === "") return { ok: false, message: `${label} cannot be empty.` };
  if (value.length > options.maxLength) return { ok: false, message: `${label} is too long.` };
  return undefined;
}

function stringLimit(field: string): number {
  if (field === "abstractNote") return 20000;
  if (field === "url" || field === "zoteroURI") return 4096;
  if (field === "title" || field === "publicationTitle") return 2000;
  return 512;
}

export function timestampId(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}
