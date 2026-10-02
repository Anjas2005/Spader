import type { RefObject } from "react";

import type {
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist";

export type ReadingMode =
  | "continuous"
  | "page";

export interface PDFRendererProps {
  file: File;
  scale?: number;
}

export interface PdfRendererRefs {
  viewerRef: RefObject<HTMLDivElement | null>;

  canvasRefs: RefObject<
    (HTMLCanvasElement | null)[]
  >;

  pageContainerRefs: RefObject<
    (HTMLDivElement | null)[]
  >;

  renderTasks: RefObject<
    (RenderTask | null)[]
  >;
}

export interface UsePdfRendererOptions {
  pdf: PDFDocumentProxy | null;
  scale: number;

  viewerRef: RefObject<HTMLDivElement | null>;

  canvasRefs: RefObject<
    (HTMLCanvasElement | null)[]
  >;

  pageContainerRefs: RefObject<
    (HTMLDivElement | null)[]
  >;

  estimatedPageHeight: number;
}
