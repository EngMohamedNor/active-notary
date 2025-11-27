import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  FileText,
  Calendar,
  Download,
  ArrowLeft,
  Loader2,
  Filter,
} from "lucide-react";
import { useApi } from "../../hooks";
import { partyApi } from "../../services/api";

const PartyStatement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setToDate(today.toISOString().split("T")[0]);
    setFromDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

  const {
    data: statementData,
    loading,
    refetch,
  } = useApi(() => {
    if (!id) return Promise.resolve(null);
    return partyApi.getPartyStatement(id, {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  }, [id, fromDate, toDate]);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export statement");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!id) {
    return (
      <div className="p-4">
        <p className="text-red-600">Invalid party ID</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md mr-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Party Statement
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {statementData?.party?.name || "Loading..."}
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center text-sm"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
        <div className="flex items-center mb-3">
          <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Filters
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => refetch()}
              className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Party Info */}
      {statementData?.party && (
        <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Name:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {statementData.party.name}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Code:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {statementData.party.code}
              </span>
            </div>
            {statementData.party.email && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {statementData.party.email}
                </span>
              </div>
            )}
            {statementData.party.phone && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {statementData.party.phone}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statement Table */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Memo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {!statementData?.statement ||
                  statementData.statement.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No transactions found for the selected date range
                      </td>
                    </tr>
                  ) : (
                    statementData.statement.map((item: any, index: number) => (
                      <tr
                        key={item.id || index}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.memo || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                          {item.debit > 0 ? formatCurrency(item.debit) : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                          {item.credit > 0 ? formatCurrency(item.credit) : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {statementData?.summary && (
                  <tfoot className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white"
                      >
                        Totals
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-white">
                        {formatCurrency(statementData.summary.totalDebit)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-white">
                        {formatCurrency(statementData.summary.totalCredit)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(statementData.summary.endingBalance)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PartyStatement;
