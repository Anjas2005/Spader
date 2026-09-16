import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const PdfRenderer = () => {
  const [numPages ,setNumPages ] = useState<number | null>(null);
  const [pageNumber, setPageNumber ] = useState<number>(1);
  const onDocumentLoadSuccess = ({ numPages } : {numPages: number}) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev-1,1));
  const goToNextPage = () => setPageNumber((prev) => (numPages ? Math.min(prev+1,numPages): prev));

  return (
    <div>
      <nav>
        <button onClick={goToPrevPage}>Prev</button>
        <button onClick={goToNextPage}>Next</button>
        <p>
          Page {pageNumber} of {numPages}
        </p>
      </nav>
      <Document file="./Cormen Introduction to Algorithms.pdf" onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} />
      </Document>
    </div>
  );


};

export default PdfRenderer;
