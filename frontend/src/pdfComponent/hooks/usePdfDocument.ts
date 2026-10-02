import {
  useEffect,
  useState,
} from "react";

import * as pdfjsLib from "pdfjs-dist";

import type {
  PDFDocumentProxy,
} from "pdfjs-dist";

interface UsePdfDocumentOptions {
  file: File;
  scale: number;
}

pdfjsLib.GlobalWorkerOptions.workerSrc =
  new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

export function usePdfDocument({
  file,
  scale,
}: UsePdfDocumentOptions) {
  const [pdf, setPdf] =
    useState<PDFDocumentProxy | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    estimatedPageHeight,
    setEstimatedPageHeight,
  ] = useState(800);

  useEffect(() => {
    let cancelled = false;

    let loadingTask:
      | ReturnType<
          typeof pdfjsLib.getDocument
        >
      | null = null;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        setPdf(null);

        const arrayBuffer =
          await file.arrayBuffer();

        if (cancelled) {
          return;
        }

        loadingTask =
          pdfjsLib.getDocument({
            data: arrayBuffer,
          });

        const loadedPdf =
          await loadingTask.promise;

        if (cancelled) {
          return;
        }

        /*
         * Get page 1 so we have a reasonable
         * height estimate for unrendered pages.
         */
        const firstPage =
          await loadedPdf.getPage(1);

        const viewport =
          firstPage.getViewport({
            scale: 1,
          });

        if (cancelled) {
          return;
        }

        setEstimatedPageHeight(
          viewport.height * scale,
        );

        setPdf(loadedPdf);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(err);

        setError(
          "Could not load PDF.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      cancelled = true;

      loadingTask?.destroy();
    };
  }, [file]);

  return {
    pdf,
    loading,
    error,
    estimatedPageHeight,
  };
}
