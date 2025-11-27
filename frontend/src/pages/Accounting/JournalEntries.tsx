import React, { useState } from "react";
import {
  FileText,
  Search,
  Calendar,
  Eye,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useApi, useApiMutation } from "../../hooks";
import { accountingApi } from "../../services/api";

const JournalEntries: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const {
    data: journalData,
    loading,
    refetch,
  } = useApi(
    () =>
      accountingApi.getJournalEntries({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 10,
      }),
    [startDate, endDate, page]
  );

  const deleteMutation = useApiMutation(accountingApi.deleteJournalEntry);

  const handleDateFilter = () => {
    setPage(1);
    refetch();
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleDelete = async (entry: any) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this journal entry?\n\nDate: ${new Date(
          entry.date
        ).toLocaleDateString()}\nDescription: ${
          entry.description
        }\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteMutation.mutate(entry.id);
      setSelectedEntry(null);
      refetch();
      alert("Journal entry deleted successfully");
    } catch (error: any) {
      alert(error.message || "Failed to delete journal entry");
      console.error("Failed to delete journal entry:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Journal Entries
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View all accounting journal entries
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleDateFilter}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <Search className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Journal Entries Table */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin mx-auto h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Loading journal entries...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Credit
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Lines
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {((journalData as any)?.journals || []).map(
                    (journal: any) => {
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
                      const isBalanced =
                        Math.abs(totalDebit - totalCredit) < 0.01; // Allow small rounding differences
                      const difference = Math.abs(totalDebit - totalCredit);

                      return (
                        <tr
                          key={journal.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(journal.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div
                              className="max-w-xs truncate"
                              title={journal.description}
                            >
                              {journal.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                            ${totalDebit.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                            ${totalCredit.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                            {isBalanced ? (
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                title="Balanced"
                              >
                                ✓ Balanced
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                title={`Unbalanced by $${difference.toFixed(
                                  2
                                )}`}
                              >
                                ✗ Unbalanced
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                            {journal.lines?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                            <button
                              onClick={() => setSelectedEntry(journal)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {journalData?.pagination && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= journalData.pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{" "}
                      <span className="font-medium">{(page - 1) * 10 + 1}</span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(page * 10, journalData.pagination.total)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {journalData.pagination.total}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= journalData.pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Journal Entry Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/10 overflow-y-auto h-full w-full z-[105] flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white dark:bg-gray-800 z-[106]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Journal Entry Details
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDelete(selectedEntry)}
                  disabled={deleteMutation.loading}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  title="Delete Entry"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleteMutation.loading ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Date:</strong>{" "}
                    {new Date(selectedEntry.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Description:</strong> {selectedEntry.description}
                  </p>
                  {selectedEntry.referenceId && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Reference:</strong> {selectedEntry.referenceId}
                    </p>
                  )}
                </div>
                {(() => {
                  const totalDebit =
                    selectedEntry.lines?.reduce(
                      (sum: number, line: any) =>
                        sum + parseFloat(line.debit || 0),
                      0
                    ) || 0;
                  const totalCredit =
                    selectedEntry.lines?.reduce(
                      (sum: number, line: any) =>
                        sum + parseFloat(line.credit || 0),
                      0
                    ) || 0;
                  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
                  const difference = Math.abs(totalDebit - totalCredit);

                  return (
                    <div className="text-right">
                      {isBalanced ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          ✓ Balanced
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          title={`Unbalanced by $${difference.toFixed(2)}`}
                        >
                          ✗ Unbalanced (${difference.toFixed(2)})
                        </span>
                      )}
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Debit: ${totalDebit.toFixed(2)} | Credit: $
                        {totalCredit.toFixed(2)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedEntry.lines?.map((line: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">{line.accountCode}</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {line.accountName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {line.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                        {parseFloat(line.debit || 0) > 0
                          ? `$${parseFloat(line.debit || 0).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                        {parseFloat(line.credit || 0) > 0
                          ? `$${parseFloat(line.credit || 0).toFixed(2)}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntries;
