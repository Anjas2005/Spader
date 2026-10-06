import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PdfPage from "./PdfPage";
import PdfToolbar from "./PdfToolbar";

import { usePdfDocument } from "./hooks/usePdfDocument";
import { usePdfRenderer } from "./hooks/usePdfRenderer";
import { usePdfScale } from "./hooks/usePdfScale";

import type {
  PDFRendererProps,
  ReadingMode,
} from "./pdfTypes";

const CONTINUOUS_RADIUS = 3;

function PdfRenderer({
  file,
  onBack,
}: PDFRendererProps) {
  const viewerRef =
    useRef<HTMLDivElement | null>(null);

  const canvasRefs =
    useRef<(HTMLCanvasElement | null)[]>([]);

  const pageContainerRefs =
    useRef<(HTMLDivElement | null)[]>([]);

  /*
   * Prevent the continuous-mode scroll listener from
   * changing pageNumber while we are restoring the
   * selected page after a mode switch.
   */
  const restoringPageRef =
    useRef(false);

  const {
    pdf,
    loading,
    error,
  } = usePdfDocument({
    file,
  });

  const {
    scale,
    zoom,
    zoomPercent,
    viewerWidth,
    pageAspectRatio,
    zoomIn,
    zoomOut,
    resetZoom,
  } = usePdfScale({
    viewerRef,
    pdf,
  });

  const estimatedPageHeight =
    Math.max(viewerWidth - 48, 100) *
    0.75 *
    pageAspectRatio *
    zoom;

  const {
    renderAroundPage,
    invalidateRendering,
    cancelRendering,
    getPageHeight,
    getPageOffset,
  } = usePdfRenderer({
    pdf,
    scale,
    canvasRefs,
    estimatedPageHeight,
  });

  const [pageNumber, setPageNumber] =
    useState(1);

  const [pageInput, setPageInput] =
    useState("1");

  const [readingMode, setReadingMode] =
    useState<ReadingMode>("continuous");

  const isPageInputFocused =
    useRef(false);

  /*
   * Reset everything when a new PDF is opened.
   */
  useEffect(() => {
    setPageNumber(1);
    setPageInput("1");

    canvasRefs.current = [];
    pageContainerRefs.current = [];

    restoringPageRef.current = false;

    cancelRendering();
  }, [file, cancelRendering]);

  /*
   * Keep the page input synchronized
   * with the current page.
   */
  useEffect(() => {
    if (!isPageInputFocused.current) {
      setPageInput(
        String(pageNumber),
      );
    }
  }, [pageNumber]);

  /*
   * Invalidate the previous PDF rendering
   * whenever the PDF, reading mode, or scale
   * changes.
   *
   * This prevents old canvas/render state from
   * being reused after React creates a different
   * canvas tree.
   */
  useEffect(() => {
    if (!pdf) {
      return;
    }

    invalidateRendering();
  }, [
    pdf,
    readingMode,
    scale,
    invalidateRendering,
  ]);

  /*
   * Render the appropriate window around the
   * current page.
   *
   * requestAnimationFrame gives React time to
   * mount the correct canvas elements first.
   */
  useEffect(() => {
    if (!pdf) {
      return;
    }

    const radius =
      readingMode === "page"
        ? 0
        : CONTINUOUS_RADIUS;

    const frame =
      requestAnimationFrame(() => {
        renderAroundPage(
          pageNumber,
          radius,
        );
      });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    pdf,
    pageNumber,
    readingMode,
    scale,
    renderAroundPage,
  ]);

  /*
   * Scroll directly to a page.
   *
   * The actual page container position is
   * preferred. The calculated page offset is
   * used as a fallback.
   */
  const scrollToPage = useCallback(
    (
      targetPage: number,
      behavior: ScrollBehavior = "auto",
    ) => {
      if (!pdf) {
        return;
      }

      const clampedPage = Math.min(
        Math.max(targetPage, 1),
        pdf.numPages,
      );

      const viewer =
        viewerRef.current;

      if (!viewer) {
        return;
      }

      const container =
        pageContainerRefs.current[
          clampedPage - 1
        ];

      /*
       * If the page container exists,
       * use its actual position.
       */
      if (container) {
        viewer.scrollTo({
          top:
            container.offsetTop - 24,
          behavior,
        });

        return;
      }

      /*
       * Fallback for a page whose DOM
       * element is not available yet.
       */
      const offset =
        getPageOffset(clampedPage);

      viewer.scrollTo({
        top: Math.max(
          0,
          offset - 24,
        ),
        behavior,
      });
    },
    [getPageOffset, pdf],
  );

  /*
   * When switching from Page mode to Continuous
   * mode, restore the page that was selected in
   * Page mode.
   *
   * Example:
   *
   * Page mode
   * pageNumber = 300
   *
   *       ↓
   *
   * Continuous mode mounts
   *
   *       ↓
   *
   * scroll to page 300
   *
   *       ↓
   *
   * resume normal scroll tracking
   */
  useEffect(() => {
    if (
      !pdf ||
      readingMode !== "continuous"
    ) {
      return;
    }

    restoringPageRef.current = true;

    let restoreFrame = 0;
    let releaseFrame = 0;

    restoreFrame =
      requestAnimationFrame(() => {
        /*
         * The continuous-mode page containers
         * should now exist.
         */
        scrollToPage(
          pageNumber,
          "auto",
        );

        /*
         * Keep the scroll listener disabled
         * for another frame so the scroll event
         * generated by scrollToPage() cannot
         * overwrite pageNumber.
         */
        releaseFrame =
          requestAnimationFrame(() => {
            restoringPageRef.current =
              false;
          });
      });

    return () => {
      cancelAnimationFrame(
        restoreFrame,
      );

      cancelAnimationFrame(
        releaseFrame,
      );

      restoringPageRef.current = false;
    };
  }, [
    pdf,
    readingMode,
    pageNumber,
    scrollToPage,
  ]);

  /*
   * Commit a page number entered into the
   * toolbar.
   */
  const commitPage = useCallback(() => {
    if (!pdf) {
      return;
    }

    const parsed =
      Number(pageInput);

    if (!Number.isFinite(parsed)) {
      setPageInput(
        String(pageNumber),
      );

      return;
    }

    const target = Math.min(
      Math.max(
        Math.floor(parsed),
        1,
      ),
      pdf.numPages,
    );

    setPageNumber(target);

    /*
     * Let React update the page state before
     * attempting to scroll.
     */
    requestAnimationFrame(() => {
      scrollToPage(
        target,
        "auto",
      );
    });
  }, [
    pageInput,
    pageNumber,
    pdf,
    scrollToPage,
  ]);

  /*
   * Go to the previous page.
   */
  const goPrevious = useCallback(() => {
    if (
      !pdf ||
      pageNumber <= 1
    ) {
      return;
    }

    const target =
      pageNumber - 1;

    setPageNumber(target);

    requestAnimationFrame(() => {
      scrollToPage(
        target,
        "smooth",
      );
    });
  }, [
    pageNumber,
    pdf,
    scrollToPage,
  ]);

  /*
   * Go to the next page.
   */
  const goNext = useCallback(() => {
    if (
      !pdf ||
      pageNumber >= pdf.numPages
    ) {
      return;
    }

    const target =
      pageNumber + 1;

    setPageNumber(target);

    requestAnimationFrame(() => {
      scrollToPage(
        target,
        "smooth",
      );
    });
  }, [
    pageNumber,
    pdf,
    scrollToPage,
  ]);

  /*
   * Determine the page closest to the
   * vertical center of the visible PDF area.
   */
  const updateCurrentPage =
    useCallback(() => {
      if (
        !pdf ||
        !viewerRef.current ||
        readingMode !== "continuous"
      ) {
        return;
      }

      /*
       * IMPORTANT:
       *
       * Do not allow the temporary scroll
       * generated during Page -> Continuous
       * restoration to change pageNumber.
       */
      if (
        restoringPageRef.current
      ) {
        return;
      }

      const viewer =
        viewerRef.current;

      const viewerRect =
        viewer.getBoundingClientRect();

      const targetY =
        viewerRect.top +
        viewer.clientHeight / 2;

      let closestPage =
        pageNumber;

      let closestDistance =
        Number.POSITIVE_INFINITY;

      /*
       * These are lightweight page containers.
       * We are not reading canvas pixels or
       * rendering anything here.
       */
      for (
        let index = 0;
        index <
        pageContainerRefs.current.length;
        index++
      ) {
        const container =
          pageContainerRefs.current[
            index
          ];

        if (!container) {
          continue;
        }

        const rect =
          container.getBoundingClientRect();

        const pageCenter =
          rect.top +
          rect.height / 2;

        const distance =
          Math.abs(
            pageCenter - targetY,
          );

        if (
          distance <
          closestDistance
        ) {
          closestDistance =
            distance;

          closestPage =
            index + 1;
        }
      }

      if (
        closestPage !== pageNumber
      ) {
        setPageNumber(
          closestPage,
        );
      }
    }, [
      pageNumber,
      pdf,
      readingMode,
    ]);

  /*
   * Scroll listener for Continuous mode.
   */
  useEffect(() => {
    const viewer =
      viewerRef.current;

    if (
      !viewer ||
      readingMode !== "continuous"
    ) {
      return;
    }

    let frame = 0;

    const handleScroll = () => {
      if (frame) {
        return;
      }

      frame =
        requestAnimationFrame(() => {
          frame = 0;

          updateCurrentPage();
        });
    };

    viewer.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      viewer.removeEventListener(
        "scroll",
        handleScroll,
      );

      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [
    readingMode,
    updateCurrentPage,
  ]);

  /*
   * Keyboard controls.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const target =
        event.target;

      if (
        target instanceof
          HTMLInputElement ||
        target instanceof
          HTMLTextAreaElement ||
        target instanceof
          HTMLSelectElement
      ) {
        return;
      }

      if (
        event.key ===
        "ArrowLeft"
      ) {
        event.preventDefault();

        goPrevious();
      }

      if (
        event.key ===
        "ArrowRight"
      ) {
        event.preventDefault();

        goNext();
      }

      if (
        event.key === "PageUp"
      ) {
        event.preventDefault();

        const targetPage =
          Math.max(
            1,
            pageNumber - 1,
          );

        setPageNumber(
          targetPage,
        );

        scrollToPage(
          targetPage,
          "smooth",
        );
      }

      if (
        event.key ===
        "PageDown"
      ) {
        event.preventDefault();

        const targetPage =
          Math.min(
            pdf?.numPages ??
              pageNumber,
            pageNumber + 1,
          );

        setPageNumber(
          targetPage,
        );

        scrollToPage(
          targetPage,
          "smooth",
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    goNext,
    goPrevious,
    pageNumber,
    pdf,
    scrollToPage,
  ]);

  const pageNumbers =
    useMemo(() => {
      if (!pdf) {
        return [];
      }

      return Array.from(
        {
          length: pdf.numPages,
        },
        (_, index) =>
          index + 1,
      );
    }, [pdf]);

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <div className="spader-reader">
        <div className="spader-loading">
          Loading PDF...
        </div>
      </div>
    );
  }

  /*
   * Error state.
   */
  if (error) {
    return (
      <div className="spader-reader">
        <div className="spader-error">
          <h2>
            Failed to load PDF
          </h2>

          <button
            type="button"
            onClick={onBack}
            className="spader-back-button"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (!pdf) {
    return (
      <div className="spader-reader">
        <div className="spader-loading">
          Preparing PDF...
        </div>
      </div>
    );
  }

  return (
    <div className="spader-reader">
      <PdfToolbar
        file={file}
        pageNumber={pageNumber}
        numPages={pdf.numPages}
        pageInput={pageInput}
        setPageInput={setPageInput}
        onPageInputFocus={() => {
          isPageInputFocused.current =
            true;
        }}
        onPageInputBlur={() => {
          isPageInputFocused.current =
            false;

          setPageInput(
            String(pageNumber),
          );
        }}
        onCommitPage={commitPage}
        onPrevious={goPrevious}
        onNext={goNext}
        zoomPercent={zoomPercent}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        readingMode={readingMode}
        onReadingModeChange={
          setReadingMode
        }
        onBack={onBack}
      />

      <div className="spader-reader-body">
        <main
          ref={viewerRef}
          className="spader-pdf-viewer"
        >
          {readingMode ===
          "page" ? (
            <div className="spader-pdf-document">
              <div
                className="spader-pdf-page-wrapper"
                style={{
                  minHeight: `${getPageHeight(
                    pageNumber,
                  )}px`,
                }}
              >
                <PdfPage
                  pageNumber={
                    pageNumber
                  }
                  canvasRef={(
                    element,
                  ) => {
                    canvasRefs.current[
                      pageNumber - 1
                    ] = element;
                  }}
                  pageContainerRef={(
                    element,
                  ) => {
                    pageContainerRefs.current[
                      pageNumber - 1
                    ] = element;
                  }}
                  minHeight={getPageHeight(
                    pageNumber,
                  )}
                />
              </div>
            </div>
          ) : (
            <div className="spader-pdf-document">
              {pageNumbers.map(
                (
                  pageNumberValue,
                ) => (
                  <div
                    key={
                      pageNumberValue
                    }
                    className="spader-pdf-page-wrapper"
                    style={{
                      minHeight: `${getPageHeight(
                        pageNumberValue,
                      )}px`,
                    }}
                  >
                    <PdfPage
                      pageNumber={
                        pageNumberValue
                      }
                      canvasRef={(
                        element,
                      ) => {
                        canvasRefs.current[
                          pageNumberValue -
                            1
                        ] = element;
                      }}
                      pageContainerRef={(
                        element,
                      ) => {
                        pageContainerRefs.current[
                          pageNumberValue -
                            1
                        ] = element;
                      }}
                      minHeight={getPageHeight(
                        pageNumberValue,
                      )}
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default PdfRenderer;
