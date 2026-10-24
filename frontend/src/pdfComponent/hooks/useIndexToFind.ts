import { useEffect, useState } from "react";
import type { IndexStatus,UsePdfIndexOption} from "../pdfTypes";

// takes the pdf loaded document and indexes it.

function indexThePdf({ pdf }: UsePdfIndexOption ): IndexStatus{
  const [indexed,setIndex] = useState<boolean>(false);
  const [ongoing,setOngoing] = useState<boolean>(false);
  const [failed,setFailed]  = useState<boolean>(false);

  // Calculate the checksum 
  useEffect(() => {
  if(!pdf) return;


  })

  return{
    indexed,
    ongoing,
    failed
  };
};

export default indexThePdf;
