import {
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

const NEARBY_PAGE_COUNT = 3;

export function usePdfRenderer({
  pdf,
  scale,
  canvasRefs,
  // pageContainerRefs,
  estimatedPageHeight,
}: UsePdfRendererOptions) {
  const renderTasks =
    useRef<(RenderTask | null)[]>(
      [],
    );

  const renderVersion =
    useRef(0);

  const renderedPages =
    useRef<Set<number>>(
      new Set(),
    );

  const renderingPages =
    useRef<Set<number>>(
      new Set(),
    );

  const pageQueue =
    useRef<number[]>([]);

  const schedulerRunning =
    useRef(false);

  const pageHeights =
    useRef<(number | undefined)[]>(
      [],
    );

  /*
   * ----------------------------------------------------
   * Reset / cancellation
   * ----------------------------------------------------
   */

  const cancelRendering = () => {
    renderVersion.current += 1;

    for (
      const task of renderTasks.current
    ) {
      task?.cancel();
    }

    renderTasks.current = [];

    pageQueue.current = [];

    renderingPages.current.clear();

    schedulerRunning.current =
      false;
  };

  /*
   * ----------------------------------------------------
   * Page geometry
   * ----------------------------------------------------
   */

  const getPageHeight = (
    page: number,
  ) => {
    return getPageHeightUtil(
      page,
      pageHeights.current,
      estimatedPageHeight,
    );
  };

  const getPageOffset = (
    page: number,
  ) => {
    return getPageOffsetUtil(
      page,
      pageHeights.current,
      estimatedPageHeight,
    );
  };

  /*
   * ----------------------------------------------------
   * Render one page
   * ----------------------------------------------------
   */

  const renderPage = async (
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
     * Never reuse a canvas while its previous
     * render is still running.
     */
    const previousTask =
      renderTasks.current[
        canvasIndex
      ];

    if (previousTask) {
      previousTask.cancel();

      try {
        await previousTask.promise;
      } catch (err) {
        if (
          !(
            err instanceof Error &&
            err.name ===
              "RenderingCancelledException"
          )
        ) {
          console.error(
            "Previous PDF render failed:",
            err,
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

    /*
     * Save the real page height.
     */
    pageHeights.current[
      pageNumberToRender - 1
    ] = viewport.height;

    const context =
      canvas.getContext("2d");

    if (!context) {
      return false;
    }

    canvas.width =
      Math.floor(viewport.width);

    canvas.height =
      Math.floor(viewport.height);

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const renderTask =
      page.render({
        canvas,
        canvasContext: context,
        viewport,
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

      renderedPages.current.add(
        pageNumberToRender,
      );

      return true;
    } catch (err) {
      if (
        err instanceof Error &&
        err.name ===
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
          err,
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
  };

  /*
   * ----------------------------------------------------
   * Queue
   * ----------------------------------------------------
   */

  const queuePage = (
    page: number,
  ) => {
    if (!pdf) {
      return;
    }

    if (
      page < 1 ||
      page > pdf.numPages
    ) {
      return;
    }

    if (
      renderedPages.current.has(
        page,
      )
    ) {
      return;
    }

    if (
      renderingPages.current.has(
        page,
      )
    ) {
      return;
    }

    if (
      pageQueue.current.includes(
        page,
      )
    ) {
      return;
    }

    pageQueue.current.push(page);
  };

  /*
   * ----------------------------------------------------
   * Scheduler
   * ----------------------------------------------------
   */

  const runContinuousScheduler =
    async (
      version: number,
    ) => {
      if (
        schedulerRunning.current
      ) {
        return;
      }

      schedulerRunning.current =
        true;

      try {
        while (
          pageQueue.current.length >
            0 &&
          version ===
            renderVersion.current
        ) {
          const page =
            pageQueue.current.shift();

          if (
            page === undefined
          ) {
            break;
          }

          if (
            renderedPages.current.has(
              page,
            )
          ) {
            continue;
          }

          const canvas =
            canvasRefs.current[
              page - 1
            ];

          /*
           * The DOM may not have created the
           * canvas yet.
           */
          if (!canvas) {
            pageQueue.current.unshift(
              page,
            );

            await new Promise<void>(
              (resolve) => {
                requestAnimationFrame(
                  () => resolve(),
                );
              },
            );

            continue;
          }

          renderingPages.current.add(
            page,
          );

          await renderPage(
            pdf!,
            page,
            canvas,
            page - 1,
            version,
          );

          renderingPages.current.delete(
            page,
          );
        }
      } finally {
        schedulerRunning.current =
          false;
      }
    };

  /*
   * ----------------------------------------------------
   * Render pages around current page
   * ----------------------------------------------------
   */

  const renderAroundPage = (
    targetPage: number,
    version: number,
  ) => {
    if (!pdf) {
      return;
    }

    const nearbyPages: number[] =
      [];

    /*
     * Target page gets priority.
     */
    queuePage(targetPage);

    for (
      let distance = 1;
      distance <=
      NEARBY_PAGE_COUNT;
      distance++
    ) {
      const previous =
        targetPage - distance;

      const next =
        targetPage + distance;

      if (
        previous >= 1
      ) {
        nearbyPages.push(
          previous,
        );
      }

      if (
        next <= pdf.numPages
      ) {
        nearbyPages.push(next);
      }
    }

    for (
      const page of nearbyPages
    ) {
      queuePage(page);
    }

    void runContinuousScheduler(
      version,
    ).then(() => {
      if (
        version !==
        renderVersion.current
      ) {
        return;
      }

      /*
       * Queue the remaining document after
       * nearby pages have been processed.
       */
      for (
        let distance =
          NEARBY_PAGE_COUNT + 1;
        distance <=
        Math.max(
          targetPage - 1,
          pdf.numPages -
            targetPage,
        );
        distance++
      ) {
        const previous =
          targetPage - distance;

        const next =
          targetPage + distance;

        if (
          previous >= 1
        ) {
          queuePage(previous);
        }

        if (
          next <= pdf.numPages
        ) {
          queuePage(next);
        }

        if (
          distance % 10 ===
          0
        ) {
          void runContinuousScheduler(
            version,
          );
        }
      }

      void runContinuousScheduler(
        version,
      );
    });
  };

  return {
    renderTasks,
    renderVersion,
    renderedPages,
    pageHeights,

    renderPage,
    renderAroundPage,
    runContinuousScheduler,
    queuePage,
    cancelRendering,

    getPageHeight,
    getPageOffset,
  };
}
