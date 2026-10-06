import type { ChangeEvent } from "react";

interface HomeProps {
  onFileSelect: (
    file: File,
  ) => void;
}

function Home({
  onFileSelect,
}: HomeProps) {
  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.type !==
        "application/pdf" &&
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      return;
    }

    onFileSelect(file);
  };

  return (
    <main className="flex h-full w-full items-center justify-center bg-[#fbf9f5]">
      <div className="flex w-full max-w-lg flex-col items-center gap-6 px-6 text-center">
        <div>
          <h1 className="font-['Literata'] text-4xl font-semibold text-[#00475a]">
            Spader
          </h1>

          <p className="mt-3 text-sm text-[#70787c]">
            A focused PDF reader for serious reading.
          </p>
        </div>

        <label className="cursor-pointer rounded-lg border border-[#c0c8cc] bg-white px-6 py-3 text-sm font-medium text-[#40484c] shadow-sm transition hover:border-[#00475a] hover:text-[#00475a]">
          Open PDF

          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={
              handleFileChange
            }
            className="hidden"
          />
        </label>
      </div>
    </main>
  );
}

export default Home;
