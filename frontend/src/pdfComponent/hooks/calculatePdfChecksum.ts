import type { PDFDocumentProxy } from "pdfjs-dist";

export async function calculatePdfChecksum(
  pdf: PDFDocumentProxy,
): Promise<string> {
  const pdfBytes = await pdf.getData();

  const bytesForHash = new Uint8Array(pdfBytes.byteLength);
  bytesForHash.set(pdfBytes);

  const digest = await crypto.subtle.digest("SHA-256", bytesForHash.buffer);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
