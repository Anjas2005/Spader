import { Dexie, type Table } from "dexie";

export type PdfIndexState = "indexing" | "ready" | "failed";


export interface PdfDocumentRecord {
  checksum: string;
  fileName: string;
  size: number;
  pageCount: number;
  status: PdfIndexState;
  indexVersion: number;
  indexedPages: number;
  updatedAt: number;
}

export interface PdfPageTextRecord {
  checksum: string;
  pageNumber: number;
  text: string;
}

export interface StoredPdfRecord {
  checksum: string;
  file: Blob;
  fileName: string;
  size: number;
}

class SpaderDatabase extends Dexie {
  // Tell typescript the expected record and primary keys
  documents !: Table<PdfDocumentRecord,string>;

  pageTexts !: Table<PdfPageTextRecord, [string,number]>;

  pdfFiles !: Table<StoredPdfRecord, string>;

  constructor(){
  super("SpaderDatabase");

    // Tells dexie the schema
  this.version(1).stores({
      documents: "checksum, status, indexVersion",
      pageTexts: "[checksum+pageNumber],checksum",
      pdfFiles: "checksum",
    });
  }
}

export const pdfDatabase = new SpaderDatabase();
