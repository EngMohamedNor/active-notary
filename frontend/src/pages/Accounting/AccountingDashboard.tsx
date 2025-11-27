import React, { useState, useMemo } from "react";
import {
  Calculator,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Eye,
  BarChart3,
  BookOpen,
  Activity,
  ArrowRight,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useApi } from "../../hooks";
import { accountingApi } from "../../services/api";

const AccountingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [asOfDate] = useState(new Date().toISOString().split("T")[0]);

  // Fetch trial balance
  const {
    data: trialBalanceData,
    loading,
    refetch,
  } = useApi(() => {
    return accountingApi.getTrialBalance({
      asOfDate: asOfDate || undefined,
    });
  }, [asOfDate]);

  // Fetch recent journal entries
  const { data: journalData } = useApi(() => {
    return accountingApi.getJournalEntries({
      limit: 5,
      page: 1,
    });
  }, []);

  // Calculate KPIs from trial balance
  const kpis = useMemo(() => {
    if (!trialBalanceData?.trialBalance) {
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        totalDebits: 0,
        totalCredits: 0,
        isBalanced: true,
        accountCount: 0,
      };
    }

    const accounts = trialBalanceData.trialBalance;
    const assets = accounts.filter((acc: any) => acc.category === "asset");
    const liabilities = accounts.filter(
      (acc: any) => acc.category === "liability"
    );
    const equity = accounts.filter((acc: any) => acc.category === "equity");
    const revenue = accounts.filter((acc: any) => acc.category === "revenue");
    const expenses = accounts.filter((acc: any) => acc.category === "expense");

    const totalAssets = assets.reduce(
      (sum: number, acc: any) => sum + Math.abs(acc.balance || 0),
      0
    );
    const totalLiabilities = liabilities.reduce(
      (sum: number, acc: any) => sum + Math.abs(acc.balance || 0),
      0
    );
    const totalEquityBase = equity.reduce(
      (sum: number, acc: any) => sum + Math.abs(acc.balance || 0),
      0
    );

    const totalRevenue = revenue.reduce(
      (sum: number, acc: any) => sum + (acc.balance || 0),
      0
    );
    const totalExpenses = expenses.reduce(
      (sum: number, acc: any) => sum + Math.abs(acc.balance || 0),
      0
    );
    const netIncome = totalRevenue - totalExpenses;
    const totalEquity = totalEquityBase + netIncome;

    const totalDebits = accounts.reduce(
      (sum: number, acc: any) => sum + acc.debit,
      0
    );
    const totalCredits = accounts.reduce(
      (sum: number, acc: any) => sum + acc.credit,
      0
    );
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netIncome,
      totalDebits,
      totalCredits,
      isBalanced,
      accountCount: accounts.length,
    };
  }, [trialBalanceData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyDetailed = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const actionButtons = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: "Add Ledger Entry",
      path: "/accounting/ledger-entry",
      color: "bg-blue-600 hover:bg-blue-700",
      description: "Create new journal entry",
    },
    {
      icon: <Eye className="h-4 w-4" />,
      label: "View Journal Entries",
      path: "/accounting/journal-entries",
      color: "bg-purple-600 hover:bg-purple-700",
      description: "Browse all entries",
    },
    {
      icon: <Calculator className="h-4 w-4" />,
      label: "Trial Balance",
      path: "/accounting/trial-balance",
      color: "bg-green-600 hover:bg-green-700",
      description: "View trial balance",
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Balance Sheet",
      path: "/reports/balance-sheet",
      color: "bg-indigo-600 hover:bg-indigo-700",
      description: "Financial position",
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Income Statement",
      path: "/reports/income-statement",
      color: "bg-emerald-600 hover:bg-emerald-700",
      description: "P&L report",
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      label: "Chart of Accounts",
      path: "/accounting/chart-of-accounts",
      color: "bg-amber-600 hover:bg-amber-700",
      description: "Manage accounts",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md mr-2">
              <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Accounting Dashboard
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Financial overview and quick actions
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Loading accounting data...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Assets */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-md shadow border border-green-200 dark:border-green-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-green-200 dark:bg-green-900 rounded-md">
                  <TrendingUp className="h-4 w-4 text-green-700 dark:text-green-400" />
                </div>
                <span className="text-[10px] font-medium text-green-700 dark:text-green-400 uppercase">
                  Assets
                </span>
              </div>
              <p className="text-xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(kpis.totalAssets)}
              </p>
              <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">
                Total Assets
              </p>
            </div>

            {/* Total Liabilities */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-md shadow border border-red-200 dark:border-red-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-red-200 dark:bg-red-900 rounded-md">
                  <TrendingDown className="h-4 w-4 text-red-700 dark:text-red-400" />
                </div>
                <span className="text-[10px] font-medium text-red-700 dark:text-red-400 uppercase">
                  Liabilities
                </span>
              </div>
              <p className="text-xl font-bold text-red-900 dark:text-red-100">
                {formatCurrency(kpis.totalLiabilities)}
              </p>
              <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">
                Current & Long-term
              </p>
            </div>

            {/* Net Income */}
            <div
              className={`bg-gradient-to-br rounded-md shadow border p-4 ${
                kpis.netIncome >= 0
                  ? "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800"
                  : "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-1.5 rounded-md ${
                    kpis.netIncome >= 0
                      ? "bg-blue-200 dark:bg-blue-900"
                      : "bg-orange-200 dark:bg-orange-900"
                  }`}
                >
                  <DollarSign
                    className={`h-4 w-4 ${
                      kpis.netIncome >= 0
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-orange-700 dark:text-orange-400"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium uppercase ${
                    kpis.netIncome >= 0
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-orange-700 dark:text-orange-400"
                  }`}
                >
                  Net Income
                </span>
              </div>
              <p
                className={`text-xl font-bold ${
                  kpis.netIncome >= 0
                    ? "text-blue-900 dark:text-blue-100"
                    : "text-orange-900 dark:text-orange-100"
                }`}
              >
                {formatCurrency(kpis.netIncome)}
              </p>
              <p
                className={`text-[10px] mt-1 ${
                  kpis.netIncome >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-orange-600 dark:text-orange-400"
                }`}
              >
                Revenue: {formatCurrency(kpis.totalRevenue)}
              </p>
            </div>

            {/* Books Status */}
            <div
              className={`bg-gradient-to-br rounded-md shadow border p-4 ${
                kpis.isBalanced
                  ? "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800"
                  : "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-1.5 rounded-md ${
                    kpis.isBalanced
                      ? "bg-green-200 dark:bg-green-900"
                      : "bg-red-200 dark:bg-red-900"
                  }`}
                >
                  <Activity
                    className={`h-4 w-4 ${
                      kpis.isBalanced
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium uppercase ${
                    kpis.isBalanced
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  Books Status
                </span>
              </div>
              <p
                className={`text-xl font-bold ${
                  kpis.isBalanced
                    ? "text-green-900 dark:text-green-100"
                    : "text-red-900 dark:text-red-100"
                }`}
              >
                {kpis.isBalanced ? "Balanced" : "Unbalanced"}
              </p>
              <p
                className={`text-[10px] mt-1 ${
                  kpis.isBalanced
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {kpis.accountCount} accounts
              </p>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
            <div className="mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Common accounting tasks
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {actionButtons.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className={`${action.color} text-white rounded-md p-3 flex flex-col items-center justify-center hover:shadow-lg transition-all duration-200 group`}
                >
                  <div className="mb-2 group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Balance Sheet Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Balance Sheet Summary
                  </h3>
                </div>
                <button
                  onClick={() => navigate("/reports/balance-sheet")}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center"
                >
                  View Full
                  <ArrowRight className="h-3 w-3 ml-1" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Total Assets
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrencyDetailed(kpis.totalAssets)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Total Liabilities
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrencyDetailed(kpis.totalLiabilities)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Total Equity
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrencyDetailed(kpis.totalEquity)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    Difference
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      kpis.isBalanced
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrencyDetailed(
                      Math.abs(
                        kpis.totalAssets -
                          (kpis.totalLiabilities + kpis.totalEquity)
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Income Statement Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Income Statement Summary
                  </h3>
                </div>
                <button
                  onClick={() => navigate("/reports/income-statement")}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center"
                >
                  View Full
                  <ArrowRight className="h-3 w-3 ml-1" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrencyDetailed(kpis.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Total Expenses
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrencyDetailed(kpis.totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    Net Income
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      kpis.netIncome >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrencyDetailed(kpis.netIncome)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Journal Entries */}
          <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Receipt className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Recent Journal Entries
                </h3>
              </div>
              <button
                onClick={() => navigate("/accounting/journal-entries")}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center"
              >
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </button>
            </div>
            {((journalData as any)?.journals || []).length > 0 ? (
              <div className="space-y-2">
                {((journalData as any)?.journals || []).map((journal: any) => {
                  const totalDebit =
                    journal.lines?.reduce(
                      (sum: number, line: any) =>
                        sum + parseFloat(line.debit || 0),
                      0
                    ) || 0;
                  const totalCredit =
                    journal.lines?.reduce(
                      (sum: number, line: any) =>
                        sum + parseFloat(line.credit || 0),
                      0
                    ) || 0;
                  return (
                    <div
                      key={journal.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      onClick={() => navigate("/accounting/journal-entries")}
                    >
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {journal.description || "No description"}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {new Date(journal.date).toLocaleDateString()} ·{" "}
                          {journal.lines?.length || 0} lines
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Dr: {formatCurrencyDetailed(totalDebit)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Cr: {formatCurrencyDetailed(totalCredit)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No journal entries yet
                </p>
                <button
                  onClick={() => navigate("/accounting/ledger-entry")}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Create your first entry
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AccountingDashboard;
