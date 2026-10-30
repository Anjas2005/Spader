import { useEffect, useState } from "react";
import type { IndexStatus, UsePdfIndexOption } from "../pdfTypes";
import { calculatePdfChecksum } from "./calculatePdfChecksum";
import { pdfDatabase } from "../../database/pdfDatabase";

function usePdfIndex({ pdf, file }: UsePdfIndexOption): {
  indexStatus: IndexStatus;
  pdfChecksum: string | null;
} {
  // takes the pdf loaded document and indexes it.
  const [pdfChecksum, setPdfChecksum] = useState<string | null>(null);
  // All initial states are false.
  const [indexStatus, setIndexStatus] = useState<IndexStatus>({
    indexed: false,
    ongoing: false,
    failed: false,
  });

  // Calculate the checksum
  useEffect(() => {
    console.log("Starting Indexing")
    if (!pdf || !file) {
      setIndexStatus({
        indexed: false,
        ongoing: false,
        failed: true,
      });
      console.error("File Is not present OR Null")
      return;
    }
    // When the pdf opens ongoing starts.
    setIndexStatus({
      indexed: false,
      ongoing: true,
      failed: false,
    });

    void (async () => {
      try {
        const checksum = await calculatePdfChecksum(pdf);
        setPdfChecksum(checksum);
        setIndexStatus({
          indexed: false,
          ongoing: true,
          failed: false,
        });
        // If we have checksum we need to check if the index exists in db.
        const existingIndex = await pdfDatabase.documents.get(checksum);

        // Check whether it is indexed and, if so, how many pages.
        const CURRENT_INDEX_VERSION = 1;

        const canReuseIndex =
          existingIndex?.status === "ready" &&
          existingIndex.indexVersion === CURRENT_INDEX_VERSION &&
          existingIndex.indexedPages === existingIndex.pageCount;

        if (canReuseIndex) {
          setIndexStatus({
            indexed: true,
            ongoing: false,
            failed: false,
          });
          // set the index and use current index
          console.log("This can be used again")
        }
        // If it failed, start from the page where it failed.
        else if (existingIndex?.status === "failed") {
          console.log("This pdf was opened before but failed")
        }
        // Otherwise, start from the beginning.
        else {
          await pdfDatabase.transaction(
            "rw",
            pdfDatabase.documents,
            pdfDatabase.pageTexts,
            pdfDatabase.pdfFiles,
            async () => {
              // Removing any Old entries
              await pdfDatabase.pageTexts
                .where("checksum")
                .equals(checksum)
                .delete();

              // Initialize a fresh indexing job.
              // NOTE: already doing this inside the fxn
              // await pdfDatabase.documents.put({
              //   checksum,
              //   fileName: file.name,
              //   size: file.size,
              //   pageCount,
              //   status: "indexing",
              //   indexVersion: CURRENT_INDEX_VERSION,
              //   indexedPages: 0,
              //   updatedAt: Date.now(),
              // });

              // Make a record of the document.
              await pdfDatabase.pdfFiles.put({
                checksum,
                file,
                fileName: file.name,
                size: file.size,
              })
            },
          );

          await indexPdfPages(1, { pdf, file }, checksum, CURRENT_INDEX_VERSION)

          // Check with the documents table is the operation complete with indexedPages if they are equal then return indexed
          await pdfDatabase.documents.get(checksum)
            .then((record) => {
              // If all pages are indexed then indexed is true
              if (record?.pageCount === record?.indexedPages) {
                setIndexStatus({
                  indexed: true,
                  ongoing: false,
                  failed: false,
                })
                console.log("All Pages have been indexed successfully")
                return ;
              }
              // Indexed is false
              else {
                setIndexStatus({
                  indexed: false,
                  ongoing: false,
                  failed: true,
                });
              }
            })
          return
        }
      } catch (error) {
        console.error(error)
        setIndexStatus({
          indexed: false,
          ongoing: false,
          failed: true,
        });
      }
    })();
  }, [pdf]);

  return { indexStatus, pdfChecksum };
}

export default usePdfIndex;

async function indexPdfPages(startPage: number, { pdf, file }: UsePdfIndexOption, checksum: string, CURRENT_INDEX_VERSION: number) {
  if (!pdf || !file) return; // pdf cannot be null
  const pageCount = pdf.numPages;

  try {
    for (let pageNumber = startPage; pageNumber <= pageCount; pageNumber++) {
      // Extract Page Text 
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" ");

      await pdfDatabase.transaction(
        "rw",
        pdfDatabase.documents,
        pdfDatabase.pageTexts,
        async () => {
          // adding the record in the db
          await pdfDatabase.pageTexts.put({
            checksum,
            pageNumber,
            text,
          })

          // Indexing job.
          await pdfDatabase.documents.put({
            checksum,
            fileName: file.name,
            size: file.size,
            pageCount,
            status: "indexing",
            indexVersion: CURRENT_INDEX_VERSION,
            indexedPages: pageNumber,
            updatedAt: Date.now(),
          });
        },
      );
    }
  } catch (error) {
    console.error(error);
  }
}
