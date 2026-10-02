import type { ChangeEvent } from "react";

interface HomeProps {
  onFileSelected: (file: File) => void;
}

function Home({ onFileSelected }: HomeProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      return;
    }

    onFileSelected(file);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight">
            SPADER
          </h1>

          <p className="mt-3 text-zinc-400 text-lg">
            A simple PDF reader for focused learning.
          </p>
        </div>

        <label
          htmlFor="pdf-file"
          className="
            mt-12 flex min-h-64 cursor-pointer
            flex-col items-center justify-center
            rounded-2xl border border-dashed border-zinc-700
            bg-zinc-900/60
            px-6
            transition
            hover:border-zinc-500
            hover:bg-zinc-900
          "
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800">
            <svg
              className="h-7 w-7 text-zinc-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0L8 8m4-4 4 4M5 20h14"
              />
            </svg>
          </div>

          <p className="mt-5 text-base font-medium">
            Open a PDF
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Click to choose a PDF file
          </p>

          <input
            id="pdf-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <p className="mt-5 text-center text-xs text-zinc-600">
          PDF files only
        </p>
      </div>
    </main>
  );
}

export default Home;
