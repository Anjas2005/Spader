import { useEffect, useMemo, useState } from "react";

import type { UsePdfScaleOptions } from "../pdfTypes";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

const INITIAL_PAGE_WIDTH_RATIO = 0.8;

export function usePdfScale({ viewerRef, pdf }: UsePdfScaleOptions) {
  const [viewerWidth, setViewerWidth] = useState(0);

  const [fitScale, setFitScale] = useState(1);

  const [zoom, setZoom] = useState(1);

  const [pageAspectRatio, setPageAspectRatio] = useState(1.414);

  const [pageSize, setPageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  /*
   * Measure the actual PDF viewer.
   */
  useEffect(() => {
    const viewer = viewerRef.current;

    if (!viewer) {
      return;
    }

    const updateWidth = () => {
      setViewerWidth(viewer.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);

    observer.observe(viewer);

    return () => {
      observer.disconnect();
    };
  }, [pdf,viewerRef]);

  /*
   * Calculate the scale required for the PDF to occupy
   * approximately 75% of the usable viewer width.
   */
  useEffect(() => {
    if (!pdf || viewerWidth <= 0) {
      return;
    }

    let cancelled = false;

    pdf
      .getPage(1)
      .then((page) => {
        if (cancelled) {
          return;
        }

        const viewport = page.getViewport({
          scale: 1,
        });

        if (viewport.width <= 0 || viewport.height <= 0) {
          return;
        }

        setPageSize({
          width: viewport.width,
          height: viewport.height,
        });

        setPageAspectRatio(viewport.height / viewport.width);

        /*
         * PdfRenderer has 24px padding on each side.
         */
        const availableWidth = Math.max(viewerWidth - 48, 100);

        const targetWidth = availableWidth * INITIAL_PAGE_WIDTH_RATIO;

        const calculatedFitScale = targetWidth / viewport.width;

        setFitScale(calculatedFitScale);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pdf, viewerWidth]);

  /*
   * Defensive maximum based on actual canvas dimensions.
   *
   * This is intentionally simple. The user-facing zoom ceiling
   * remains 300%, but the renderer independently refuses an
   * unsafe canvas.
   */
  const safeMaxZoom = useMemo(() => {
    if (!pageSize) {
      return MAX_ZOOM;
    }

    const devicePixelRatio =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const maxCanvasDimension = 8192;

    const widthLimit =
      maxCanvasDimension /
      (pageSize.width * devicePixelRatio * Math.max(fitScale, 0.0001));

    const heightLimit =
      maxCanvasDimension /
      (pageSize.height * devicePixelRatio * Math.max(fitScale, 0.0001));

    return Math.min(MAX_ZOOM, widthLimit, heightLimit);
  }, [fitScale, pageSize]);

  useEffect(() => {
    setZoom((value) =>
      Math.min(Math.max(value, MIN_ZOOM), Math.max(MIN_ZOOM, safeMaxZoom)),
    );
  }, [safeMaxZoom]);

  const zoomIn = () => {
    setZoom((value) =>
      Math.min(
        Math.max(MIN_ZOOM, safeMaxZoom),
        Number((value + ZOOM_STEP).toFixed(2)),
      ),
    );
  };

  const zoomOut = () => {
    setZoom((value) =>
      Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(2))),
    );
  };

  const resetZoom = () => {
    setZoom(1);
  };

  /*
   * This is the actual scale sent to PDF.js.
   *
   * Initial state:
   *
   *   fitScale × 1
   *
   * Therefore the PDF initially occupies approximately 75%
   * of the available viewer width.
   */
  const scale = fitScale * zoom;

  return {
    scale,

    zoomPercent: Math.round(zoom * 100),

    zoom,

    fitScale,

    viewerWidth,

    pageAspectRatio,

    maxZoom: safeMaxZoom,

    zoomIn,
    zoomOut,
    resetZoom,
  };
}
