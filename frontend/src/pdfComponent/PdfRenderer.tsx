import {
  useEffect,
  useRef,
  useState,
} from "react";

import "pdfjs-dist/web/pdf_viewer.css";

import PdfPage from "./PdfPage";
import PdfToolbar from "./PdfToolbar";

import {
  usePdfDocument,
} from "./hooks/usePdfDocument";

import {
  usePdfScale,
} from "./hooks/usePdfScale";

import {
  usePdfRenderer,
} from "./hooks/usePdfRenderer";

import type {
  PDFRendererProps,
  ReadingMode,
} from "./pdfTypes";

function PdfRenderer({
  file,
  scale: initialScale,
}: PDFRendererProps) {
  /*
   * ----------------------------------------------------
   * Page state
   * ----------------------------------------------------
   */

  const [pageNumber, setPageNumber] =
    useState(1);

  const [pageInput, setPageInput] =
    useState("1");

  const [
    readingMode,
    setReadingMode,
  ] = useState<ReadingMode>(
    "continuous",
  );

  /*
   * ----------------------------------------------------
   * Refs
   * ----------------------------------------------------
   */

  const viewerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const canvasRefs =
    useRef<
      (HTMLCanvasElement | null)[]
    >([]);

  const pageContainerRefs =
    useRef<
      (HTMLDivElement | null)[]
    >([]);

  const scrollFrame =
    useRef<number | null>(null);

  const pendingContinuousPage =
    useRef<number | null>(null);

  const restoringPage =
    useRef(false);

  const pageInputFocused =
    useRef(false);

  /*
   * ----------------------------------------------------
   * PDF document
   * ----------------------------------------------------
   */

  const {
    pdf,
    loading,
    error,
    estimatedPageHeight,
  } = usePdfDocument({
    file,
    scale: initialScale ?? 1,
  });

  /*
   * ----------------------------------------------------
   * Scale / zoom
   * ----------------------------------------------------
   */

  const {
    scale,
    zoomIn,
    zoomOut,
  } = usePdfScale({
    pdf,
    viewerRef,
    initialScale,
  });

  /*
   * ----------------------------------------------------
   * PDF rendering engine
   * ----------------------------------------------------
   */

  const {
    renderVersion,
    renderPage,
    renderAroundPage,
    runContinuousScheduler,
    queuePage,
    cancelRendering,
    getPageHeight,
    getPageOffset,
  } = usePdfRenderer({
    pdf,
    scale,
    viewerRef,
    canvasRefs,
    pageContainerRefs,
    estimatedPageHeight,
  });

  /*
   * ----------------------------------------------------
   * Reset page state when a new PDF is selected
   * ----------------------------------------------------
   */

  useEffect(() => {
    setPageNumber(1);
    setPageInput("1");

    pendingContinuousPage.current =
      null;

    restoringPage.current =
      false;

    canvasRefs.current = [];
    pageContainerRefs.current = [];
  }, [file]);

  /*
   * ----------------------------------------------------
   * Keep page input synchronized
   * ----------------------------------------------------
   */

  useEffect(() => {
    if (
      !pageInputFocused.current
    ) {
      setPageInput(
        String(pageNumber),
      );
    }
  }, [pageNumber]);

  /*
   * ----------------------------------------------------
   * Scroll to page
   * ----------------------------------------------------
   */

  const scrollToPage = (
    page: number,
    behavior:
      | ScrollBehavior
      = "smooth",
  ) => {
    const viewer =
      viewerRef.current;

    if (!viewer) {
      return;
    }

    if (
      readingMode ===
      "continuous"
    ) {
      viewer.scrollTo({
        top: getPageOffset(page),
        behavior,
      });

      return;
    }

    const container =
      pageContainerRefs.current[
        page - 1
      ];

    if (!container) {
      return;
    }

    const viewerRect =
      viewer.getBoundingClientRect();

    const containerRect =
      container.getBoundingClientRect();

    const offset =
      containerRect.top -
      viewerRect.top;

    viewer.scrollTo({
      top:
        viewer.scrollTop +
        offset,
      behavior,
    });
  };

  /*
   * ----------------------------------------------------
   * Navigate to page
   * ----------------------------------------------------
   */

  const navigateToPage = (
    page: number,
    behavior:
      | ScrollBehavior
      = "smooth",
  ) => {
    if (!pdf) {
      return;
    }

    if (!Number.isFinite(page)) {
      return;
    }

    const nextPageNumber =
      Math.min(
        Math.max(
          Math.trunc(page),
          1,
        ),
        pdf.numPages,
      );

    setPageNumber(
      nextPageNumber,
    );

    setPageInput(
      String(nextPageNumber),
    );

    if (
      readingMode ===
      "continuous"
    ) {
      cancelRendering();

      queuePage(
        nextPageNumber,
      );

      scrollToPage(
        nextPageNumber,
        behavior,
      );

      const version =
        renderVersion.current;

      restoringPage.current =
        true;

      renderAroundPage(
        nextPageNumber,
        version,
      );

      requestAnimationFrame(
        () => {
          if (
            version !==
            renderVersion.current
          ) {
            return;
          }

          restoringPage.current =
            false;

          scrollToPage(
            nextPageNumber,
            "auto",
          );
        },
      );
    }
  };

  /*
   * ----------------------------------------------------
   * Page input
   * ----------------------------------------------------
   */

  const commitPageInput = () => {
    const trimmed =
      pageInput.trim();

    if (trimmed === "") {
      setPageInput(
        String(pageNumber),
      );

      return;
    }

    const parsed =
      Number(trimmed);

    if (!Number.isFinite(parsed)) {
      setPageInput(
        String(pageNumber),
      );

      return;
    }

    navigateToPage(parsed);
  };

  /*
   * ----------------------------------------------------
   * Previous / next
   * ----------------------------------------------------
   */

  const previousPage = () => {
    if (!pdf) {
      return;
    }

    navigateToPage(
      Math.max(
        pageNumber - 1,
        1,
      ),
    );
  };

  const nextPage = () => {
    if (!pdf) {
      return;
    }

    navigateToPage(
      Math.min(
        pageNumber + 1,
        pdf.numPages,
      ),
    );
  };

  /*
   * ----------------------------------------------------
   * Reading mode
   * ----------------------------------------------------
   */

  const changeReadingMode = (
    nextMode: ReadingMode,
  ) => {
    if (
      nextMode === readingMode
    ) {
      return;
    }

    if (
      nextMode ===
      "continuous"
    ) {
      pendingContinuousPage.current =
        pageNumber;

      restoringPage.current =
        true;
    }

    setReadingMode(nextMode);
  };

  /*
   * ----------------------------------------------------
   * Page mode rendering
   * ----------------------------------------------------
   */

  useEffect(() => {
    if (
      !pdf ||
      readingMode !== "page"
    ) {
      return;
    }

    cancelRendering();

    const version =
      renderVersion.current;

    const canvas =
      canvasRefs.current[0];

    if (!canvas) {
      return;
    }

    void renderPage(
      pdf,
      pageNumber,
      canvas,
      0,
      version,
    );

    return () => {
      cancelRendering();
    };
  }, [
    pdf,
    pageNumber,
    scale,
    readingMode,
  ]);

  /*
   * ----------------------------------------------------
   * Continuous mode
   * ----------------------------------------------------
   */

  useEffect(() => {
    if (
      !pdf ||
      readingMode !==
        "continuous"
    ) {
      return;
    }

    cancelRendering();

    /*
     * Don't keep stale canvas geometry from the
     * previous rendering pass.
     */
    pageContainerRefs.current =
      pageContainerRefs.current.slice(
        0,
        pdf.numPages,
      );

    canvasRefs.current =
      canvasRefs.current.slice(
        0,
        pdf.numPages,
      );

    const targetPage =
      pendingContinuousPage.current ??
      pageNumber;

    pendingContinuousPage.current =
      null;

    restoringPage.current =
      true;

    const version =
      renderVersion.current;

    requestAnimationFrame(() => {
      if (
        version !==
        renderVersion.current
      ) {
        return;
      }

      const viewer =
        viewerRef.current;

      if (viewer) {
        viewer.scrollTop =
          getPageOffset(
            targetPage,
          );
      }

      renderAroundPage(
        targetPage,
        version,
      );

      requestAnimationFrame(
        () => {
          if (
            version !==
            renderVersion.current
          ) {
            return;
          }

          restoringPage.current =
            false;

          if (viewer) {
            viewer.scrollTop =
              getPageOffset(
                targetPage,
              );
          }
        },
      );
    });

    return () => {
      cancelRendering();
    };
  }, [
    pdf,
    scale,
    readingMode,
  ]);

  /*
   * ----------------------------------------------------
   * Current page detection
   * ----------------------------------------------------
   */

  useEffect(() => {
    if (
      readingMode !==
      "continuous"
    ) {
      return;
    }

    const viewer =
      viewerRef.current;

    if (!viewer) {
      return;
    }

    const updateCurrentPage =
      () => {
        scrollFrame.current =
          null;

        if (
          restoringPage.current
        ) {
          return;
        }

        const viewerRect =
          viewer.getBoundingClientRect();

        const viewerCenter =
          viewerRect.top +
          viewerRect.height / 2;

        let closestPage =
          pageNumber;

        let closestDistance =
          Infinity;

        for (
          let i = 0;
          i <
          pageContainerRefs.current
            .length;
          i++
        ) {
          const container =
            pageContainerRefs.current[
              i
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
              pageCenter -
                viewerCenter,
            );

          if (
            distance <
            closestDistance
          ) {
            closestDistance =
              distance;

            closestPage =
              i + 1;
          }
        }

        if (
          closestPage !==
          pageNumber
        ) {
          setPageNumber(
            closestPage,
          );

          if (
            !pageInputFocused.current
          ) {
            setPageInput(
              String(
                closestPage,
              ),
            );
          }

          const version =
            renderVersion.current;

          queuePage(
            closestPage,
          );

          for (
            let distance = 1;
            distance <=
            3;
            distance++
          ) {
            queuePage(
              closestPage -
                distance,
            );

            queuePage(
              closestPage +
                distance,
            );
          }

          void runContinuousScheduler(
            version,
          );
        }
      };

    const handleScroll = () => {
      if (
        scrollFrame.current !==
        null
      ) {
        return;
      }

      scrollFrame.current =
        requestAnimationFrame(
          updateCurrentPage,
        );
    };

    viewer.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    if (
      !restoringPage.current
    ) {
      updateCurrentPage();
    }

    return () => {
      viewer.removeEventListener(
        "scroll",
        handleScroll,
      );

      if (
        scrollFrame.current !==
        null
      ) {
        cancelAnimationFrame(
          scrollFrame.current,
        );

        scrollFrame.current = null;
      }
    };
  }, [
    readingMode,
    pdf,
  ]);

  /*
   * ----------------------------------------------------
   * Loading / error states
   * ----------------------------------------------------
   */

  if (loading) {
    return (
      <div
        className="
          flex
          h-[100dvh]
          w-full
          items-center
          justify-center
          bg-zinc-950
          text-zinc-400
        "
      >
        Loading PDF...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="
          flex
          h-[100dvh]
          w-full
          items-center
          justify-center
          bg-zinc-950
          text-red-400
        "
      >
        {error}
      </div>
    );
  }

  if (!pdf) {
    return null;
  }

  /*
   * ----------------------------------------------------
   * UI
   * ----------------------------------------------------
   */

  return (
    <div
      className="
        flex
        h-[100dvh]
        min-h-0
        w-full
        flex-col
        overflow-hidden
        bg-zinc-800
      "
    >
      <PdfToolbar
        pageNumber={pageNumber}
        pageInput={pageInput}
        totalPages={pdf.numPages}
        scale={scale}
        readingMode={readingMode}
        onPrevious={previousPage}
        onNext={nextPage}
        onPageInputChange={
          setPageInput
        }
        onPageInputFocus={() => {
          pageInputFocused.current =
            true;
        }}
        onPageInputBlur={() => {
          pageInputFocused.current =
            false;

          commitPageInput();
        }}
        onPageInputKeyDown={(
          event,
        ) => {
          if (
            event.key === "Enter"
          ) {
            event.currentTarget.blur();
          }

          if (
            event.key === "Escape"
          ) {
            setPageInput(
              String(pageNumber),
            );

            event.currentTarget.blur();
          }
        }}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReadingModeChange={
          changeReadingMode
        }
      />

      <div
        ref={viewerRef}
        className="
          min-h-0
          flex-1
          overflow-auto
          bg-zinc-800
          p-6
        "
      >
        {readingMode ===
          "page" && (
          <div
            ref={(container) => {
              pageContainerRefs.current[0] =
                container;
            }}
            className="
              flex
              min-w-max
              justify-center
            "
          >
            <PdfPage
              pageNumber={pageNumber}
              canvasRef={(canvas) => {
                canvasRefs.current[0] =
                  canvas;
              }}
              containerRef={() => {}}
              onClick={() => {}}
            />
          </div>
        )}

        {readingMode ===
          "continuous" && (
          <div
            className="
              flex
              min-w-max
              flex-col
              items-center
              gap-6
            "
          >
            {Array.from(
              {
                length:
                  pdf.numPages,
              },
              (_, index) => {
                const page =
                  index + 1;

                return (
                  <PdfPage
                    key={page}
                    pageNumber={page}
                    canvasRef={(canvas) => {
                      canvasRefs.current[
                        index
                      ] = canvas;
                    }}
                    containerRef={(
                      container,
                    ) => {
                      pageContainerRefs.current[
                        index
                      ] = container;
                    }}
                    minHeight={getPageHeight(
                      page,
                    )}
                    onClick={() => {
                      setPageNumber(
                        page,
                      );
                    }}
                  />
                );
              },
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfRenderer;
