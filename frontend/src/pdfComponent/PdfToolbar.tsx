import type {
  KeyboardEvent,
} from "react";

import type {
  ReadingMode,
} from "./pdfTypes";

interface PdfToolbarProps {
  pageNumber: number;
  pageInput: string;
  totalPages: number;
  scale: number;
  readingMode: ReadingMode;

  onPrevious: () => void;
  onNext: () => void;

  onPageInputChange: (
    value: string,
  ) => void;

  onPageInputFocus: () => void;
  onPageInputBlur: () => void;

  onPageInputKeyDown: (
    event: KeyboardEvent<HTMLInputElement>,
  ) => void;

  onZoomIn: () => void;
  onZoomOut: () => void;

  onReadingModeChange: (
    mode: ReadingMode,
  ) => void;
}

function PdfToolbar({
  pageNumber,
  pageInput,
  totalPages,
  scale,
  readingMode,
  onPrevious,
  onNext,
  onPageInputChange,
  onPageInputFocus,
  onPageInputBlur,
  onPageInputKeyDown,
  onZoomIn,
  onZoomOut,
  onReadingModeChange,
}: PdfToolbarProps) {
  return (
    <div
      className="
        z-50
        flex
        h-14
        min-h-14
        shrink-0
        items-center
        gap-2
        border-b
        border-zinc-800
        bg-zinc-950
        px-3
        text-zinc-200
      "
    >
      <button
        onClick={onPrevious}
        disabled={
          pageNumber === 1
        }
        className="
          rounded-md
          px-3 py-1.5
          text-sm
          transition
          hover:bg-zinc-800
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        Previous
      </button>

      <span
        className="
          whitespace-nowrap
          text-sm
          text-zinc-400
        "
      >
        Page {pageNumber} /{" "}
        {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={
          pageNumber === totalPages
        }
        className="
          rounded-md
          px-3 py-1.5
          text-sm
          transition
          hover:bg-zinc-800
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        Next
      </button>

      <input
        type="number"
        min={1}
        max={totalPages}
        value={pageInput}
        onFocus={
          onPageInputFocus
        }
        onChange={(event) =>
          onPageInputChange(
            event.target.value,
          )
        }
        onBlur={onPageInputBlur}
        onKeyDown={
          onPageInputKeyDown
        }
        className="
          w-16
          rounded-md
          border
          border-zinc-700
          bg-zinc-900
          px-2 py-1.5
          text-center
          text-sm
          text-zinc-200
          outline-none
          focus:border-zinc-500
        "
      />

      <div
        className="
          mx-1
          h-6
          w-px
          bg-zinc-800
        "
      />

      <button
        onClick={onZoomOut}
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-md
          text-lg
          transition
          hover:bg-zinc-800
        "
      >
        −
      </button>

      <span
        className="
          w-14
          text-center
          text-sm
          text-zinc-400
        "
      >
        {Math.round(
          scale * 100,
        )}
        %
      </span>

      <button
        onClick={onZoomIn}
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-md
          text-lg
          transition
          hover:bg-zinc-800
        "
      >
        +
      </button>

      <div className="flex-1" />

      <div
        className="
          flex
          rounded-lg
          bg-zinc-900
          p-1
        "
      >
        <button
          onClick={() =>
            onReadingModeChange(
              "page",
            )
          }
          className={`
            rounded-md
            px-3 py-1.5
            text-sm
            transition
            ${
              readingMode ===
              "page"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }
          `}
        >
          Page
        </button>

        <button
          onClick={() =>
            onReadingModeChange(
              "continuous",
            )
          }
          className={`
            rounded-md
            px-3 py-1.5
            text-sm
            transition
            ${
              readingMode ===
              "continuous"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }
          `}
        >
          Continuous
        </button>
      </div>
    </div>
  );
}

export default PdfToolbar;
