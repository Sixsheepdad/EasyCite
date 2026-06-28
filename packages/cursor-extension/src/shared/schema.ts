export type Creator = {
  creatorType?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
};

export type Attachment = {
  type?: string;
  title?: string;
  path?: string;
  filename?: string;
};

export type ZoteroPayloadItem = {
  libraryType: string;
  libraryId: string;
  itemKey: string;
  itemType?: string;
  title?: string;
  creators?: Creator[];
  year?: string;
  date?: string;
  doi?: string;
  publicationTitle?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
  abstractNote?: string;
  zoteroURI?: string;
  attachments?: Attachment[];
  bibtex?: string | null;
  preferredCitationKey?: string | null;
};

export type ImportPayload = {
  protocolVersion: 1;
  requestId: string;
  action: "importItems";
  source: "zotero";
  createdAt?: string;
  targetProjectId: string;
  projectToken: string;
  items: ZoteroPayloadItem[];
};

export type CiteBridgeConfig = {
  version: 1;
  projectId: string;
  projectName: string;
  bibFile: string;
  papersDir: string;
  citeCommand: "citep" | "citet" | "cite" | "parencite" | "textcite";
  keyPattern: "AuthorYearTitle";
  copyPdf: boolean;
  zoteroLocalApi: {
    enabled: boolean;
    baseUrl: string;
  };
  security: {
    projectToken: string;
  };
};

export type CiteBridgeIndexItem = {
  citekey: string;
  title: string;
  authors: string[];
  year: string;
  doi?: string;
  zotero: {
    libraryType: string;
    libraryId: string;
    itemKey: string;
  };
  bibFile: string;
  pdf?: string;
  bibtex?: string;
  bibtexAdded: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CiteBridgeIndex = {
  version: 1;
  processedRequests: string[];
  items: CiteBridgeIndexItem[];
};

export type ProjectRegistryEntry = {
  projectId: string;
  projectName: string;
  rootPath: string;
  bibFile: string;
  papersDir: string;
  inboxDir: string;
  projectToken: string;
  active?: boolean;
  lastActiveAt: string;
  cursorUri: string;
};

export type ProjectRegistry = {
  version: 1;
  activeProjectId?: string;
  lastActiveProjectId?: string;
  projects: ProjectRegistryEntry[];
};
