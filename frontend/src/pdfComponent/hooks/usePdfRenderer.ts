import {
  useCallback,
  useRef,
} from "react";

import type {
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist";

import {
  getPageHeight as getPageHeightUtil,
  getPageOffset as getPageOffsetUtil,
} from "../pdfUtils";

import type {
  UsePdfRendererOptions,
} from "../pdfTypes";

const MAX_CANVAS_DIMENSION = 8192;

export function usePdfRenderer({
  pdf,
  scale,
  canvasRefs,
  estimatedPageHeight,
}: UsePdfRendererOptions) {
  const renderTasks =
    useRef<
      (RenderTask | null)[]
    >([]);

  const renderVersion =
    useRef(0);

  const renderedPages =
    useRef<Set<number>>(
      new Set(),
    );

  const pageHeights =
    useRef<
      (number | undefined)[]
    >([]);

  /*
   * Render a single PDF page.
   */
  const renderPage =
    useCallback(
      async (
        pdfDocument: PDFDocumentProxy,
        pageNumberToRender: number,
        canvas: HTMLCanvasElement,
        canvasIndex: number,
        version: number,
      ) => {
        if (
          version !==
          renderVersion.current
        ) {
          return false;
        }

        /*
         * Cancel any previous render using
         * this canvas.
         */
        const previousTask =
          renderTasks.current[
            canvasIndex
          ];

        if (previousTask) {
          previousTask.cancel();

          try {
            await previousTask.promise;
          } catch (error) {
            if (
              !(
                error instanceof
                  Error &&
                error.name ===
                  "RenderingCancelledException"
              )
            ) {
              console.error(
                "Previous PDF render failed:",
                error,
              );
            }
          }

          if (
            renderTasks.current[
              canvasIndex
            ] === previousTask
          ) {
            renderTasks.current[
              canvasIndex
            ] = null;
          }
        }

        if (
          version !==
          renderVersion.current
        ) {
          return false;
        }

        const page =
          await pdfDocument.getPage(
            pageNumberToRender,
          );

        if (
          version !==
          renderVersion.current
        ) {
          return false;
        }

        const viewport =
          page.getViewport({
            scale,
          });

        pageHeights.current[
          pageNumberToRender - 1
        ] = viewport.height;

        const context =
          canvas.getContext("2d");

        if (!context) {
          return false;
        }

        const outputScale =
          window.devicePixelRatio ||
          1;

        const pixelWidth =
          Math.ceil(
            viewport.width *
              outputScale,
          );

        const pixelHeight =
          Math.ceil(
            viewport.height *
              outputScale,
          );

        /*
         * Prevent creating a canvas that
         * exceeds browser/GPU limits.
         */
        if (
          pixelWidth >
            MAX_CANVAS_DIMENSION ||
          pixelHeight >
            MAX_CANVAS_DIMENSION
        ) {
          console.warn(
            `PDF page ${pageNumberToRender} is too large to render at ${Math.round(
              scale * 100,
            )}%.`,
          );

          return false;
        }

        /*
         * Configure canvas for the new viewport.
         */
        canvas.width =
          pixelWidth;

        canvas.height =
          pixelHeight;

        canvas.style.width =
          `${Math.round(
            viewport.width,
          )}px`;

        canvas.style.height =
          `${Math.round(
            viewport.height,
          )}px`;

        context.clearRect(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        const transform =
          outputScale !== 1
            ? [
                outputScale,
                0,
                0,
                outputScale,
                0,
                0,
              ]
            : undefined;

        /*
         * Start PDF.js rendering.
         */
        const renderTask =
          page.render({
            canvas,
            canvasContext: context,
            viewport,
            transform,
          });

        renderTasks.current[
          canvasIndex
        ] = renderTask;

        try {
          await renderTask.promise;

          if (
            version !==
            renderVersion.current
          ) {
            return false;
          }

          /*
           * Only mark the page rendered after
           * the render actually completed.
           */
          renderedPages.current.add(
            pageNumberToRender,
          );

          return true;
        } catch (error) {
          if (
            error instanceof
              Error &&
            error.name ===
              "RenderingCancelledException"
          ) {
            return false;
          }

          if (
            version ===
            renderVersion.current
          ) {
            console.error(
              `PDF page ${pageNumberToRender} render failed:`,
              error,
            );
          }

          return false;
        } finally {
          if (
            renderTasks.current[
              canvasIndex
            ] === renderTask
          ) {
            renderTasks.current[
              canvasIndex
            ] = null;
          }
        }
      },
      [scale],
    );

  /*
   * Clear one page.
   */
  const clearPage =
    useCallback(
      (pageNumber: number) => {
        const index =
          pageNumber - 1;

        const task =
          renderTasks.current[
            index
          ];

        if (task) {
          task.cancel();

          renderTasks.current[
            index
          ] = null;
        }

        const canvas =
          canvasRefs.current[
            index
          ];

        if (canvas) {
          const context =
            canvas.getContext(
              "2d",
            );

          if (context) {
            context.clearRect(
              0,
              0,
              canvas.width,
              canvas.height,
            );
          }

          /*
           * Release the backing pixel buffer.
           */
          canvas.width = 0;
          canvas.height = 0;

          canvas.style.width = "";
          canvas.style.height = "";
        }

        renderedPages.current.delete(
          pageNumber,
        );
      },
      [canvasRefs],
    );

  /*
   * Clear rendered pages outside the
   * requested window.
   */
  const clearPagesOutsideWindow =
    useCallback(
      (
        currentPage: number,
        radius: number,
      ) => {
        if (!pdf) {
          return;
        }

        const start =
          Math.max(
            1,
            currentPage - radius,
          );

        const end =
          Math.min(
            pdf.numPages,
            currentPage + radius,
          );

        for (
          const page of
            renderedPages.current
        ) {
          if (
            page < start ||
            page > end
          ) {
            clearPage(page);
          }
        }
      },
      [
        clearPage,
        pdf,
      ],
    );

  /*
   * INVALIDATE CURRENT RENDER STATE.
   *
   * This is intentionally different from
   * moving to another page.
   *
   * It is used when the existing canvases
   * are no longer valid:
   *
   *   - reading mode changes
   *   - zoom/scale changes
   *   - PDF changes
   *
   * We invalidate the cache without trying
   * to manipulate the DOM. React owns the
   * canvas lifecycle.
   */
  const invalidateRendering =
    useCallback(() => {
      /*
       * Make every currently running render
       * obsolete.
       */
      renderVersion.current += 1;

      /*
       * Cancel active PDF.js render tasks.
       */
      for (
        const task of
          renderTasks.current
      ) {
        task?.cancel();
      }

      renderTasks.current = [];

      /*
       * Most important part:
       *
       * Do NOT let the renderer believe that
       * pages are still rendered.
       */
      renderedPages.current.clear();
    }, []);

  /*
   * Render a small window around a page.
   *
   * Target page is always rendered first.
   */
  const renderAroundPage =
    useCallback(
      (
        targetPage: number,
        radius: number,
      ) => {
        if (!pdf) {
          return;
        }

        const currentPage =
          Math.min(
            Math.max(
              targetPage,
              1,
            ),
            pdf.numPages,
          );

        /*
         * Start a new render generation.
         */
        renderVersion.current += 1;

        const version =
          renderVersion.current;

        /*
         * Cancel currently running renders.
         */
        for (
          const task of
            renderTasks.current
        ) {
          task?.cancel();
        }

        renderTasks.current = [];

        /*
         * Remove rendered pages that are
         * outside the new window.
         */
        clearPagesOutsideWindow(
          currentPage,
          radius,
        );

        /*
         * Build render order:
         *
         * current
         * previous
         * next
         * previous
         * next
         * ...
         */
        const pages: number[] = [
          currentPage,
        ];

        for (
          let distance = 1;
          distance <= radius;
          distance++
        ) {
          const previous =
            currentPage -
            distance;

          const next =
            currentPage +
            distance;

          if (
            previous >= 1
          ) {
            pages.push(previous);
          }

          if (
            next <=
            pdf.numPages
          ) {
            pages.push(next);
          }
        }

        /*
         * Render one page at a time.
         */
        const renderWindow =
          async () => {
            for (
              const pageNumber of pages
            ) {
              if (
                version !==
                renderVersion.current
              ) {
                return;
              }

              /*
               * If this page is already
               * valid, reuse it.
               */
              if (
                renderedPages.current.has(
                  pageNumber,
                )
              ) {
                continue;
              }

              let canvas =
                canvasRefs.current[
                  pageNumber - 1
                ];

              /*
               * React may not have mounted
               * the canvas yet.
               */
              if (!canvas) {
                await new Promise<void>(
                  (resolve) => {
                    requestAnimationFrame(
                      () =>
                        resolve(),
                    );
                  },
                );

                if (
                  version !==
                  renderVersion.current
                ) {
                  return;
                }

                canvas =
                  canvasRefs.current[
                    pageNumber - 1
                  ];
              }

              if (!canvas) {
                continue;
              }

              await renderPage(
                pdf,
                pageNumber,
                canvas,
                pageNumber - 1,
                version,
              );
            }
          };

        void renderWindow();
      },
      [
        canvasRefs,
        clearPagesOutsideWindow,
        pdf,
        renderPage,
      ],
    );

  /*
   * Cancel all rendering.
   */
  const cancelRendering =
    useCallback(() => {
      renderVersion.current += 1;

      for (
        const task of
          renderTasks.current
      ) {
        task?.cancel();
      }

      renderTasks.current = [];

      renderedPages.current.clear();
    }, []);

  const getPageHeight =
    useCallback(
      (page: number) =>
        getPageHeightUtil(
          page,
          pageHeights.current,
          estimatedPageHeight,
        ),
      [estimatedPageHeight],
    );

  const getPageOffset =
    useCallback(
      (page: number) =>
        getPageOffsetUtil(
          page,
          pageHeights.current,
          estimatedPageHeight,
        ),
      [estimatedPageHeight],
    );

  return {
    renderTasks,
    renderVersion,
    renderedPages,
    pageHeights,

    renderPage,
    renderAroundPage,

    /*
     * New lifecycle function.
     */
    invalidateRendering,

    cancelRendering,

    clearPage,
    clearPagesOutsideWindow,

    getPageHeight,
    getPageOffset,
  };
}
