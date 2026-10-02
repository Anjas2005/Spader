interface PdfPageProps {
  pageNumber: number;

  canvasRef: (
    canvas: HTMLCanvasElement | null,
  ) => void;

  containerRef: (
    container: HTMLDivElement | null,
  ) => void;

  minHeight?: number;

  onClick?: () => void;
}

function PdfPage({
  pageNumber,
  canvasRef,
  containerRef,
  minHeight,
  onClick,
}: PdfPageProps) {
  return (
    <div
      ref={containerRef}
      onClick={onClick}
      data-page={pageNumber}
      className="
        flex
        w-fit
        cursor-pointer
        items-start
        justify-center
      "
      style={{
        minHeight,
      }}
    >
      <canvas
        ref={canvasRef}
        className="
          block
          shadow-2xl
        "
      />
    </div>
  );
}

export default PdfPage;
