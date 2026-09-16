import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PdfRenderer from './pdfComponent/pdfRenderer';
import Home from './pages/Home';

function App() {


  return (
    <>
      <BrowserRouter>        
        <Routes>
          <Route path="/" element={<Home />}/> 
          <Route path="/pdfRenderer" element={<PdfRenderer />}/> 
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
