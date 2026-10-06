import PdfRenderer from "../pdfComponent/PdfRenderer";

interface PDFViewProps {
  file: File;
  onBack: () => void;
}

function PDFView({
  file,
  onBack,
}: PDFViewProps) {
  return (
    <PdfRenderer
      file={file}
      onBack={onBack}
    />
  );
}

export default PDFView;
