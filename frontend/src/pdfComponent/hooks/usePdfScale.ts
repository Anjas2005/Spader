import {
  useEffect,
  useState,
} from "react";

import type {
  PDFDocumentProxy,
} from "pdfjs-dist";

export const MIN_SCALE = 0.5;
export const MAX_SCALE = 5;
export const ZOOM_STEP = 0.25;

interface UsePdfScaleOptions {
  pdf: PDFDocumentProxy | null;

  viewerRef: React.RefObject<
    HTMLDivElement | null
  >;

  initialScale?: number;
}

export function usePdfScale({
  pdf,
  viewerRef,
  initialScale,
}: UsePdfScaleOptions) {
  const [scale, setScale] =
    useState(initialScale ?? 1);

  const [userZoomed, setUserZoomed] =
    useState(false);

  const calculateFitScale =
    async () => {
      if (
        !pdf ||
        !viewerRef.current
      ) {
        return undefined;
      }

      const page =
        await pdf.getPage(1);

      const viewport =
        page.getViewport({
          scale: 1,
        });

      const availableWidth =
        Math.max(
          viewerRef.current.clientWidth -
            48,
          100,
        );

      const targetWidth =
        availableWidth * 0.75;

      const calculatedScale =
        targetWidth /
        viewport.width;

      return Math.min(
        Math.max(
          calculatedScale,
          MIN_SCALE,
        ),
        MAX_SCALE,
      );
    };

  /*
   * Initial automatic fit.
   */
  useEffect(() => {
    if (
      !pdf ||
      initialScale !== undefined ||
      userZoomed
    ) {
      return;
    }

    let cancelled = false;

    const updateScale = async () => {
      try {
        const calculatedScale =
          await calculateFitScale();

        if (
          cancelled ||
          calculatedScale === undefined
        ) {
          return;
        }

        setScale(calculatedScale);
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Could not calculate PDF scale:",
            err,
          );
        }
      }
    };

    updateScale();

    return () => {
      cancelled = true;
    };
  }, [
    pdf,
    initialScale,
  ]);

  /*
   * Recalculate fit when the window changes size.
   */
  useEffect(() => {
    if (
      !pdf ||
      initialScale !== undefined
    ) {
      return;
    }

    const handleResize =
      async () => {
        if (userZoomed) {
          return;
        }

        try {
          const calculatedScale =
            await calculateFitScale();

          if (
            calculatedScale ===
            undefined
          ) {
            return;
          }

          setScale(
            calculatedScale,
          );
        } catch (err) {
          console.error(
            "Could not recalculate PDF scale:",
            err,
          );
        }
      };

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, [
    pdf,
    initialScale,
    userZoomed,
  ]);

  const zoomIn = () => {
    setUserZoomed(true);

    setScale((current) =>
      Math.min(
        current + ZOOM_STEP,
        MAX_SCALE,
      ),
    );
  };

  const zoomOut = () => {
    setUserZoomed(true);

    setScale((current) =>
      Math.max(
        current - ZOOM_STEP,
        MIN_SCALE,
      ),
    );
  };

  return {
    scale,
    zoomIn,
    zoomOut,
  };
}
