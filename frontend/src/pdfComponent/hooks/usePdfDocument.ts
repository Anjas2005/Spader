import { useEffect, useState } from "react";

import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from "pdfjs-dist";

import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

import type { UsePdfDocumentOptions } from "../pdfTypes";

GlobalWorkerOptions.workerSrc = workerSrc;

export function usePdfDocument({ file }: UsePdfDocumentOptions) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    setPdf(null);
    setLoading(true);
    setError(null);

    const objectUrl = URL.createObjectURL(file);

    const loadingTask = getDocument({
      url: objectUrl,
    });

    loadingTask.promise
      .then((document) => {
        if (cancelled) {
          return;
        }

        setPdf(document);
        setLoading(false);
      })
      .catch((reason) => {
        if (cancelled) {
          return;
        }

        setError(reason);
        setLoading(false);
      });

    return () => {
      cancelled = true;

      URL.revokeObjectURL(objectUrl);

      void loadingTask.destroy();
    };
  }, [file]);

  return {
    pdf,
    loading,
    error,
  };
}
