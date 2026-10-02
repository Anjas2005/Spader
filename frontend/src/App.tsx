import { useState } from "react";
import Home from "./pages/Home";
import PDFView from "./pages/PDFView";

function App() {
  const [file, setFile] = useState<File | null>(null);

  if (file) {
    return (
      <PDFView
        file={file}
        onBack={() => setFile(null)}
      />
    );
  }

  return <Home onFileSelected={setFile} />;
}

export default App;
