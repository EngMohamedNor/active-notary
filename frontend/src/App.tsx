import { BrowserRouter as Router, Routes, Route } from "react-router";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Templates from "./pages/Templates";
import UploadTemplate from "./pages/UploadTemplate";
import GenerateDocument from "./pages/GenerateDocument";
import DocumentsList from "./pages/DocumentsList";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Main Application Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/upload-template" element={<UploadTemplate />} />
            <Route path="/generate-document" element={<GenerateDocument />} />
            <Route path="/documents" element={<DocumentsList />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}
