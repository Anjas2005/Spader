import PdfRenderer from "../pdfComponent/PdfRenderer";

interface PDFViewProps {
  file: File;
  onBack: () => void;
}

function PDFView({ file, onBack }: PDFViewProps) {
  return (
    <main className="h-screen w-full overflow-hidden bg-zinc-950">
      <div className="relative h-full w-full">
        <button
          onClick={onBack}
          className="
            absolute left-4 top-4 z-50
            rounded-lg border border-zinc-700
            bg-zinc-900/90
            px-3 py-2
            text-sm text-zinc-300
            shadow-lg
            backdrop-blur
            transition
            hover:border-zinc-500
            hover:bg-zinc-800
            hover:text-white
          "
        >
          ← Back
        </button>

        <PdfRenderer file={file} />
      </div>
    </main>
  );
}

export default PDFView;
