import { BrowserRouter as Router, Routes, Route } from "react-router";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Dashboard/Home";
import Templates from "./pages/Templates";
import UploadTemplate from "./pages/UploadTemplate";
import GenerateDocument from "./pages/GenerateDocument";
import DocumentsList from "./pages/DocumentsList";

// Accounting
import AccountingDashboard from "./pages/Accounting/AccountingDashboard";
import TrialBalance from "./pages/Accounting/TrialBalance";
import JournalEntries from "./pages/Accounting/JournalEntries";
import ChartOfAccounts from "./pages/Accounting/ChartOfAccounts";
import LedgerEntry from "./pages/Accounting/LedgerEntry";

// Parties
import PartiesList from "./pages/Parties/PartiesList";
import PartyStatement from "./pages/Parties/PartyStatement";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register-new-user" element={<Register />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index path="/" element={<Home />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/upload-template" element={<UploadTemplate />} />
            <Route path="/generate-document" element={<GenerateDocument />} />
            <Route path="/documents" element={<DocumentsList />} />

            {/* Accounting */}
            <Route path="/accounting" element={<AccountingDashboard />} />
            <Route
              path="/accounting/dashboard"
              element={<AccountingDashboard />}
            />
            <Route
              path="/accounting/trial-balance"
              element={<TrialBalance />}
            />
            <Route
              path="/accounting/journal-entries"
              element={<JournalEntries />}
            />
            <Route path="/accounting/ledger-entry" element={<LedgerEntry />} />
            <Route
              path="/accounting/chart-of-accounts"
              element={<ChartOfAccounts />}
            />

            {/* Parties */}
            <Route path="/parties" element={<PartiesList />} />
            <Route path="/parties/customers" element={<PartiesList />} />
            <Route path="/parties/vendors" element={<PartiesList />} />
            <Route path="/parties/employees" element={<PartiesList />} />
            <Route
              path="/parties/:id/statement"
              element={<PartyStatement />}
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
