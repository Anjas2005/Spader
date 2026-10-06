import type {
  RefObject,
} from "react";

import type {
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist";

export type ReadingMode =
  | "continuous"
  | "page";

export interface PDFRendererProps {
  file: File;
  onBack: () => void;
}

export interface PdfPageProps {
  pageNumber: number;

  canvasRef: (
    element: HTMLCanvasElement | null,
  ) => void;

  pageContainerRef: (
    element: HTMLDivElement | null,
  ) => void;

  minHeight?: number;
}

export interface UsePdfDocumentOptions {
  file: File;
}

export interface UsePdfScaleOptions {
  viewerRef: RefObject<
    HTMLDivElement | null
  >;

  pdf: PDFDocumentProxy | null;
}

export interface UsePdfRendererOptions {
  pdf: PDFDocumentProxy | null;

  scale: number;

  canvasRefs: RefObject<
    (HTMLCanvasElement | null)[]
  >;

  estimatedPageHeight: number;
}

export interface PdfToolbarProps {
  file: File;

  pageNumber: number;
  numPages: number;

  pageInput: string;

  setPageInput: (
    value: string,
  ) => void;

  onPageInputFocus: () => void;

  onPageInputBlur: () => void;

  onCommitPage: () => void;

  onPrevious: () => void;

  onNext: () => void;

  zoomPercent: number;

  onZoomIn: () => void;

  onZoomOut: () => void;

  onResetZoom: () => void;

  readingMode: ReadingMode;

  onReadingModeChange: (
    mode: ReadingMode,
  ) => void;

  onBack: () => void;
}

export interface PdfRendererState {
  renderTasks: RefObject<
    (RenderTask | null)[]
  >;

  renderVersion: RefObject<number>;

  renderedPages: RefObject<
    Set<number>
  >;

  pageHeights: RefObject<
    (number | undefined)[]
  >;
}
