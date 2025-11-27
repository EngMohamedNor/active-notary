import React, { useState } from "react";
import {
  Calculator,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Printer,
} from "lucide-react";
import { useApi } from "../../hooks";
import { accountingApi } from "../../services/api";

const TrialBalance: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Fetch trial balance
  const {
    data: trialBalanceData,
    loading,
    refetch,
  } = useApi(() => {
    return accountingApi.getTrialBalance({
      asOfDate,
    });
  }, [asOfDate]);

  const handleExport = () => {
    if (!trialBalanceData?.trialBalance) return;

    const csvContent = [
      ["Account Code", "Account Name", "Debit", "Credit", "Balance"],
      ...trialBalanceData.trialBalance.map((account: any) => [
        account.accountCode,
        account.accountName,
        account.debit.toFixed(2),
        account.credit.toFixed(2),
        account.balance.toFixed(2),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trial-balance-${asOfDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!trialBalanceData?.trialBalance) return;

    window.print();
  };

  const totalDebits =
    trialBalanceData?.trialBalance?.reduce(
      (sum: number, account: any) => sum + account.debit,
      0
    ) || 0;
  const totalCredits =
    trialBalanceData?.trialBalance?.reduce(
      (sum: number, account: any) => sum + account.credit,
      0
    ) || 0;
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 1cm;
            size: A4 landscape;
          }
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-content .print-header {
            display: block !important;
            margin-bottom: 20px;
            text-align: center;
            page-break-after: avoid;
          }
          .print-content .print-summary {
            display: block !important;
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9fafb;
            page-break-after: avoid;
          }
          .print-content table {
            border-collapse: collapse;
            width: 100%;
            font-size: 11px;
            page-break-inside: auto;
          }
          .print-content table th,
          .print-content table td {
            border: 1px solid #333;
            padding: 6px;
            text-align: left;
          }
          .print-content table th {
            background-color: #f3f4f6 !important;
            font-weight: bold;
            color: #000 !important;
          }
          .print-content table tbody tr {
            page-break-inside: avoid;
          }
          .print-content table tfoot {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-6 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Trial Balance
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Financial position as of a specific date
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                disabled={!trialBalanceData?.trialBalance}
                className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 flex items-center"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </button>
              <button
                onClick={handleExport}
                disabled={!trialBalanceData?.trialBalance}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <label
                htmlFor="asOfDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  As of Date
                </div>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="asOfDate"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
          <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg mr-3">
                <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Debits
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  $
                  {totalDebits.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Credits
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  $
                  {totalCredits.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-6">
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg mr-3 ${
                  isBalanced
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-red-100 dark:bg-red-900"
                }`}
              >
                <Calculator
                  className={`h-6 w-6 ${
                    isBalanced
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Balance Status
                </p>
                <p
                  className={`text-2xl font-bold ${
                    isBalanced
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {isBalanced ? "Balanced" : "Unbalanced"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Balance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white overflow-hidden print-content">
          {loading ? (
            <div className="text-center py-8 no-print">
              <div className="animate-spin mx-auto h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Loading trial balance...
              </p>
            </div>
          ) : (
            <>
              {/* Print Header - Only visible when printing */}
              <div
                className="print-header print-only"
                style={{ display: "none" }}
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Trial Balance
                </h1>
                <p className="text-sm text-gray-600">
                  As of:{" "}
                  {new Date(asOfDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Generated on:{" "}
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Print Summary - Only visible when printing */}
              <div
                className="print-summary print-only"
                style={{ display: "none" }}
              >
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Total Debits:</span>
                    <span className="ml-2">
                      $
                      {totalDebits.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Total Credits:</span>
                    <span className="ml-2">
                      $
                      {totalCredits.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>
                    <span
                      className={`ml-2 ${
                        isBalanced ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isBalanced ? "Balanced" : "Unbalanced"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Account Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Account Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Debit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Credit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {trialBalanceData?.trialBalance?.map(
                      (account: any, index: number) => (
                        <tr
                          key={account.accountCode}
                          className={
                            index % 2 === 0
                              ? "bg-white dark:bg-gray-800"
                              : "bg-gray-50 dark:bg-gray-700"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {account.accountCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {account.accountName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                            {account.debit > 0
                              ? `$${account.debit.toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                            {account.credit > 0
                              ? `$${account.credit.toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                            <span
                              className={`font-medium ${
                                account.balance >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              ${account.balance.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                  <tfoot className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white"
                      >
                        TOTALS
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white text-right">
                        ${totalDebits.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white text-right">
                        ${totalCredits.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white text-right">
                        <span
                          className={`${
                            isBalanced
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isBalanced ? "BALANCED" : "UNBALANCED"}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TrialBalance;
