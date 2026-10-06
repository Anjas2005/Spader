import {
  useState,
} from "react";

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
      <Home
        onFileSelect={setFile}
      />
    );
  }

  return (
    <PDFView
      file={file}
      onBack={() => {
        setFile(null);
      }}
    />
  );
}

export default App;
