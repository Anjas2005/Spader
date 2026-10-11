import {
  useState,
} from "react";

import { Analytics } from '@vercel/analytics/react';

import Home from "./pages/Home";
import PDFView from "./pages/PDFView";

import "./App.css";

function App() {
  const [file, setFile] =
    useState<File | null>(
      null,
    );

  if (!file) {
    return (
      <>
        <Home
          onFileSelect={setFile}
        />
        <Analytics />
      </>
    );
  }

  return (
    <>
      <PDFView
        file={file}
        onBack={() => {
          setFile(null);
        }}
      />
      <Analytics />
    </>
  );
}

export default App;
