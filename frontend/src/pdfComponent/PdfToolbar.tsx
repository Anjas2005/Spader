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
  return (
    <header className="spader-topbar">
      <div className="spader-brand">
        <button
          type="button"
          onClick={onBack}
          className="spader-back-button"
          title="Back"
        >
          <span aria-hidden="true">
            ←
          </span>

          <span>
            Back
          </span>
        </button>

        <span className="spader-brand-divider" />

        <span className="spader-brand-name">
          Spader
        </span>

        <span className="spader-brand-divider" />

        <span
          className="spader-document-name"
          title={file.name}
        >
          {file.name}
        </span>
      </div>

      <div className="spader-toolbar">
        <button
          type="button"
          className="spader-find-button"
          title="Find"
        >
          <span>
            Find
          </span>

          <kbd className="spader-find-shortcut">
            Ctrl F
          </kbd>
        </button>

        <span className="spader-toolbar-divider" />

        <div className="spader-toolbar-group">
          <button
            type="button"
            onClick={onPrevious}
            disabled={
              pageNumber <= 1
            }
            className="spader-icon-button"
            title="Previous page"
            aria-label="Previous page"
          >
            ‹
          </button>

          <div className="spader-page-control">
            <input
              value={pageInput}
              onChange={(event) =>
                setPageInput(
                  event.target.value,
                )
              }
              onFocus={
                onPageInputFocus
              }
              onBlur={
                onPageInputBlur
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  onCommitPage();

                  event.currentTarget.blur();
                }

                if (
                  event.key ===
                  "Escape"
                ) {
                  setPageInput(
                    String(
                      pageNumber,
                    ),
                  );

                  event.currentTarget.blur();
                }
              }}
              inputMode="numeric"
              aria-label="Page number"
              className="spader-page-input"
            />

            <span className="spader-page-total">
              / {numPages}
            </span>
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={
              pageNumber >=
              numPages
            }
            className="spader-icon-button"
            title="Next page"
            aria-label="Next page"
          >
            ›
          </button>
        </div>

        <span className="spader-toolbar-divider" />

        <div className="spader-toolbar-group spader-zoom">
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

        <span className="spader-toolbar-spacer" />

        <div
          className="spader-mode"
          role="group"
          aria-label="Reading mode"
        >
          <button
            type="button"
            onClick={() =>
              onReadingModeChange(
                "page",
              )
            }
            className={`spader-mode-button ${
              readingMode ===
              "page"
                ? "is-active"
                : ""
            }`}
          >
            Page
          </button>

          <button
            type="button"
            onClick={() =>
              onReadingModeChange(
                "continuous",
              )
            }
            className={`spader-mode-button ${
              readingMode ===
              "continuous"
                ? "is-active"
                : ""
            }`}
          >
            Continuous
          </button>
        </div>

        <button
          type="button"
          className="spader-icon-button"
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
