import type {
  PdfPageProps,
} from "./pdfTypes";

function PdfPage({
  pageNumber,
  canvasRef,
  pageContainerRef,
  minHeight,
}: PdfPageProps) {
  return (
    <div
      ref={pageContainerRef}
      data-page-number={pageNumber}
      className="spader-pdf-page"
      style={{
        minHeight:
          minHeight
            ? `${minHeight}px`
            : undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        className="spader-pdf-canvas"
      />
    </div>
  );
}

export default PdfPage;
