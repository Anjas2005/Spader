import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  PdfToolbarProps,
} from "./pdfTypes";

function PdfToolbar({
  file,
  pageNumber,
  numPages,
  pageInput,
  setPageInput,
  onPageInputFocus,
  onPageInputBlur,
  onCommitPage,
  onPrevious,
  onNext,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  readingMode,
  onReadingModeChange,
  onBack,
}: PdfToolbarProps) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const mobileMenuRef =
    useRef<HTMLDivElement | null>(null);

  const tabletMenuRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(
      event: MouseEvent,
    ) {
      const target =
        event.target as Node;

      const insideMobileMenu =
        mobileMenuRef.current?.contains(
          target,
        );

      const insideTabletMenu =
        tabletMenuRef.current?.contains(
          target,
        );

      if (
        !insideMobileMenu &&
        !insideTabletMenu
      ) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [menuOpen]);

  function handleReadingModeChange(
    mode: "page" | "continuous",
  ) {
    onReadingModeChange(mode);
    setMenuOpen(false);
  }

  function handleBack() {
    setMenuOpen(false);
    onBack();
  }

  return (
    <header
      className="
        spader-topbar
        relative
        z-20
        flex
        min-w-0
        items-center
        gap-2
        overflow-visible
        px-2
        sm:px-3
      "
    >
      {/* =========================================================
          MOBILE MENU
          Visible below md.
         ========================================================= */}

      <div
        ref={mobileMenuRef}
        className="
          relative
          shrink-0
          md:hidden
        "
      >
        <button
          type="button"
          onClick={() =>
            setMenuOpen((open) => !open)
          }
          className="spader-icon-button"
          title="Menu"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          ☰
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-label="Toolbar menu"
            className="
              absolute
              left-0
              top-[calc(100%+0.5rem)]
              z-50
              min-w-56
              overflow-hidden
              rounded-lg
              border
              border-[#c0c8cc]
              bg-white
              p-1
              text-[#1b1c1a]
              shadow-xl
            "
          >
            {/* Back */}
            <button
              type="button"
              role="menuitem"
              onClick={handleBack}
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-md
                px-3
                py-2.5
                text-left
                text-sm
                hover:bg-[#f5f3ef]
              "
            >
              <span
                className="w-5 text-center"
                aria-hidden="true"
              >
                ←
              </span>

              <span>Back</span>
            </button>

            {/* Find */}
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                setMenuOpen(false)
              }
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-md
                px-3
                py-2.5
                text-left
                text-sm
                hover:bg-[#f5f3ef]
              "
              title="Find (Ctrl+F)"
              aria-label="Find, Ctrl+F"
            >
              <span
                className="w-5 text-center"
                aria-hidden="true"
              >
                ⌕
              </span>

              <span>Find</span>

              <kbd
                className="
                  ml-auto
                  rounded
                  border
                  border-[#c0c8cc]
                  px-1.5
                  py-0.5
                  text-[11px]
                  text-[#70787c]
                "
              >
                Ctrl F
              </kbd>
            </button>

            <div
              className="
                my-1
                h-px
                bg-[#c0c8cc]
              "
            />

            {/* Zoom */}
            <div
              className="
                flex
                items-center
                gap-2
                px-2
                py-1
              "
            >
              <span className="mr-auto text-sm">
                Zoom
              </span>

              <button
                type="button"
                onClick={onZoomOut}
                className="spader-icon-button"
                title="Zoom out"
                aria-label="Zoom out"
              >
                −
              </button>

              <button
                type="button"
                onClick={onResetZoom}
                className="spader-zoom-value"
                title="Reset zoom"
              >
                {zoomPercent}%
              </button>

              <button
                type="button"
                onClick={onZoomIn}
                className="spader-icon-button"
                title="Zoom in"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>

            <div
              className="
                my-1
                h-px
                bg-[#c0c8cc]
              "
            />

            {/* Reading mode */}
            <div className="px-2 py-1">
              <span
                className="
                  mb-2
                  block
                  text-sm
                  text-[#70787c]
                "
              >
                Reading mode
              </span>

              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() =>
                    handleReadingModeChange("page")
                  }
                  className={`
                    spader-mode-button
                    ${
                      readingMode === "page"
                        ? "is-active"
                        : ""
                    }
                  `}
                >
                  Page
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleReadingModeChange(
                      "continuous",
                    )
                  }
                  className={`
                    spader-mode-button
                    ${
                      readingMode === "continuous"
                        ? "is-active"
                        : ""
                    }
                  `}
                >
                  Continuous
                </button>
              </div>
            </div>

            <div
              className="
                my-1
                h-px
                bg-[#c0c8cc]
              "
            />

            {/* Settings */}
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                setMenuOpen(false)
              }
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-md
                px-3
                py-2.5
                text-left
                text-sm
                hover:bg-[#f5f3ef]
              "
            >
              <span
                className="w-5 text-center"
                aria-hidden="true"
              >
                ⚙
              </span>

              <span>Settings</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================
          BRAND
         ========================================================= */}

      <div
        className="
          spader-brand
          min-w-0
          shrink
        "
      >
        <button
          type="button"
          onClick={onBack}
          className="
            spader-back-button
            shrink-0
          "
          title="Back"
        >
          <span aria-hidden="true">
            ←
          </span>

          <span className="hidden lg:inline">
            Back
          </span>
        </button>

        <span
          className="
            spader-brand-divider
            hidden
            sm:inline-block
          "
        />

        <span
          className="
            spader-brand-name
            shrink-0
          "
        >
          Spader
        </span>

        <span
          className="
            spader-brand-divider
            hidden
            sm:inline-block
          "
        />

        <span
          className="
            spader-document-name
            hidden
            min-w-0
            max-w-[40vw]
            flex-1
            overflow-hidden
            text-ellipsis
            whitespace-nowrap
            md:inline
            lg:max-w-[36vw]
          "
          title={file.name}
        >
          {file.name}
        </span>
      </div>

      {/* =========================================================
          MAIN TOOLBAR
         ========================================================= */}

      <div
        className="
          spader-toolbar
          ml-auto
          flex
          min-w-0
          shrink-0
          items-center
          gap-1
          sm:gap-2
        "
      >
        {/* Find */}

        <button
          type="button"
          className="
            spader-find-button
            inline-flex
            min-w-[7rem]
            items-center
            justify-between
            gap-4
            lg:min-w-[8rem]
            xl:min-w-[9rem]
          "
          title="Find (Ctrl+F)"
          aria-label="Find, Ctrl+F"
        >
          <span>Find</span>

          <kbd
            className="
              spader-find-shortcut
              shrink-0
            "
          >
            Ctrl F
          </kbd>
        </button>

        <span
          className="
            spader-toolbar-divider
            hidden
            lg:inline-block
          "
        />

        {/* Page navigation */}

        <div
          className="
            spader-toolbar-group
            shrink-0
          "
        >
          <button
            type="button"
            onClick={onPrevious}
            disabled={pageNumber <= 1}
            className="spader-icon-button"
            title="Previous page"
            aria-label="Previous page"
          >
            ‹
          </button>

          <div
            className="
              spader-page-control
              shrink-0
            "
          >
            <input
              id="spader-page-number"
              name="pageNumber"
              value={pageInput}
              onChange={(event) =>
                setPageInput(event.target.value)
              }
              onFocus={onPageInputFocus}
              onBlur={onPageInputBlur}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onCommitPage();
                  event.currentTarget.blur();
                }

                if (event.key === "Escape") {
                  setPageInput(String(pageNumber));
                  event.currentTarget.blur();
                }
              }}
              inputMode="numeric"
              aria-label="Page number"
              className="
                spader-page-input
                w-10
                sm:w-11
              "
            />

            <span
              className="
                spader-page-total
                whitespace-nowrap
              "
            >
              / {numPages}
            </span>
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={pageNumber >= numPages}
            className="spader-icon-button"
            title="Next page"
            aria-label="Next page"
          >
            ›
          </button>
        </div>

        {/* Zoom */}

        <span
          className="
            spader-toolbar-divider
            hidden
            md:inline-block
          "
        />

        <div
          className="
            spader-toolbar-group
            spader-zoom
            hidden
            md:flex
            shrink-0
          "
        >
          <button
            type="button"
            onClick={onZoomOut}
            className="spader-icon-button"
            title="Zoom out"
            aria-label="Zoom out"
          >
            −
          </button>

          <button
            type="button"
            onClick={onResetZoom}
            className="spader-zoom-value"
            title="Reset zoom"
          >
            {zoomPercent}%
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            className="spader-icon-button"
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        {/* Spacer */}

        <span
          className="
            spader-toolbar-spacer
            hidden
            lg:inline-block
          "
        />

        {/* Reading mode */}

        <div
          className="
            spader-mode
            hidden
            lg:flex
            shrink-0
          "
          role="group"
          aria-label="Reading mode"
        >
          <button
            type="button"
            onClick={() =>
              onReadingModeChange("page")
            }
            className={`
              spader-mode-button
              ${
                readingMode === "page"
                  ? "is-active"
                  : ""
              }
            `}
          >
            Page
          </button>

          <button
            type="button"
            onClick={() =>
              onReadingModeChange("continuous")
            }
            className={`
              spader-mode-button
              ${
                readingMode === "continuous"
                  ? "is-active"
                  : ""
              }
            `}
          >
            Continuous
          </button>
        </div>

        {/* =========================================================
            TABLET OVERFLOW
            Visible md -> below lg.
           ========================================================= */}

        <div
          ref={tabletMenuRef}
          className="
            relative
            hidden
            shrink-0
            md:block
            lg:hidden
          "
        >
          <button
            type="button"
            onClick={() =>
              setMenuOpen((open) => !open)
            }
            className="spader-icon-button"
            title="More"
            aria-label="More toolbar actions"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            ⋮
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="More toolbar actions"
              className="
                absolute
                right-0
                top-[calc(100%+0.5rem)]
                z-50
                min-w-56
                overflow-hidden
                rounded-lg
                border
                border-[#c0c8cc]
                bg-white
                p-1
                text-[#1b1c1a]
                shadow-xl
              "
            >
              {/* Reading mode */}

              <div className="px-2 py-1">
                <span
                  className="
                    mb-2
                    block
                    text-sm
                    text-[#70787c]
                  "
                >
                  Reading mode
                </span>

                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleReadingModeChange("page")
                    }
                    className={`
                      spader-mode-button
                      ${
                        readingMode === "page"
                          ? "is-active"
                          : ""
                      }
                    `}
                  >
                    Page
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleReadingModeChange(
                        "continuous",
                      )
                    }
                    className={`
                      spader-mode-button
                      ${
                        readingMode === "continuous"
                          ? "is-active"
                          : ""
                      }
                    `}
                  >
                    Continuous
                  </button>
                </div>
              </div>

              <div
                className="
                  my-1
                  h-px
                  bg-[#c0c8cc]
                "
              />

              {/* Settings */}

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-md
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  hover:bg-[#f5f3ef]
                "
              >
                <span
                  className="w-5 text-center"
                  aria-hidden="true"
                >
                  ⚙
                </span>

                <span>Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* Settings */}

        <button
          type="button"
          className="
            spader-icon-button
            hidden
            lg:inline-flex
          "
          title="Settings"
          aria-label="Settings"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}

export default PdfToolbar;
