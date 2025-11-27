import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Save,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { useApiMutation, useApi } from "../../hooks";
import { accountingApi } from "../../services/api";

interface JournalLine {
  accountCode: string;
  debit: number;
  credit: number;
  description: string;
}

interface LedgerEntryFormData {
  date: string;
  description: string;
  lines: JournalLine[];
}

const LedgerEntry: React.FC = () => {
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [isBalanced, setIsBalanced] = useState(false);
  const focusedInputRef = useRef<{
    index: number;
    field: "debit" | "credit";
  } | null>(null);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [pendingSubmission, setPendingSubmission] =
    useState<LedgerEntryFormData | null>(null);

  // Fetch chart of accounts
  const { data: accountsData } = useApi(() =>
    accountingApi.getChartOfAccounts()
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<LedgerEntryFormData>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      description: "",
      lines: [
        { accountCode: "", debit: 0, credit: 0, description: "" },
        { accountCode: "", debit: 0, credit: 0, description: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const watchedLines = watch("lines");

  // Calculate totals whenever lines change - use watch subscription for real-time updates
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // Recalculate totals when any debit/credit field changes
      if (!name || name.startsWith("lines.")) {
        const lines = value.lines || watchedLines || [];
        const totals = lines.reduce(
          (acc: { debit: number; credit: number }, line: any) => {
            const debitValue =
              typeof line.debit === "number"
                ? line.debit
                : parseFloat(line.debit?.toString() || "0");
            const creditValue =
              typeof line.credit === "number"
                ? line.credit
                : parseFloat(line.credit?.toString() || "0");
            acc.debit += isNaN(debitValue) ? 0 : debitValue;
            acc.credit += isNaN(creditValue) ? 0 : creditValue;
            return acc;
          },
          { debit: 0, credit: 0 }
        );

        setTotalDebit(totals.debit);
        setTotalCredit(totals.credit);
        setIsBalanced(Math.abs(totals.debit - totals.credit) < 0.01);
      }
    });

    // Also calculate on mount and when watchedLines changes
    const lines = watchedLines || [];
    const totals = lines.reduce(
      (acc: { debit: number; credit: number }, line: any) => {
        const debitValue =
          typeof line.debit === "number"
            ? line.debit
            : parseFloat(line.debit?.toString() || "0");
        const creditValue =
          typeof line.credit === "number"
            ? line.credit
            : parseFloat(line.credit?.toString() || "0");
        acc.debit += isNaN(debitValue) ? 0 : debitValue;
        acc.credit += isNaN(creditValue) ? 0 : creditValue;
        return acc;
      },
      { debit: 0, credit: 0 }
    );

    setTotalDebit(totals.debit);
    setTotalCredit(totals.credit);
    setIsBalanced(Math.abs(totals.debit - totals.credit) < 0.01);

    return () => subscription.unsubscribe();
  }, [watchedLines, watch]);

  const createMutation = useApiMutation(accountingApi.createJournalEntry);

  const handleFormSubmit = (data: LedgerEntryFormData) => {
    // Validate balance before submitting
    if (!isBalanced) {
      setModalMessage(
        `Journal entry is not balanced.\n\nDebits: $${totalDebit.toFixed(
          2
        )}\nCredits: $${totalCredit.toFixed(2)}\n\nDifference: $${Math.abs(
          totalDebit - totalCredit
        ).toFixed(2)}`
      );
      setShowValidationModal(true);
      return;
    }

    // Validate at least 2 lines
    if (data.lines.length < 2) {
      setModalMessage("Please add at least 2 journal lines before submitting.");
      setShowValidationModal(true);
      return;
    }

    // Remove empty lines
    const validLines = data.lines.filter(
      (line) => line.accountCode && (line.debit > 0 || line.credit > 0)
    );

    if (validLines.length < 2) {
      setModalMessage(
        "Please add at least 2 valid journal lines with account codes and amounts."
      );
      setShowValidationModal(true);
      return;
    }

    // Store data and show confirmation modal
    setPendingSubmission(data);
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    if (!pendingSubmission) return;

    try {
      // Remove empty lines
      const validLines = pendingSubmission.lines.filter(
        (line) => line.accountCode && (line.debit > 0 || line.credit > 0)
      );

      await createMutation.mutate({
        date: pendingSubmission.date,
        description: pendingSubmission.description,
        lines: validLines.map((line) => ({
          accountCode: line.accountCode,
          debit: parseFloat(line.debit?.toString() || "0"),
          credit: parseFloat(line.credit?.toString() || "0"),
          description: line.description || undefined,
        })),
      });

      // Reset form
      setValue("description", "");
      setValue("lines", [
        { accountCode: "", debit: 0, credit: 0, description: "" },
        { accountCode: "", debit: 0, credit: 0, description: "" },
      ]);

      setShowConfirmModal(false);
      setPendingSubmission(null);
      setShowSuccessModal(true);
    } catch (error: any) {
      setShowConfirmModal(false);
      setModalMessage(
        error.message || "Failed to create ledger entry. Please try again."
      );
      setShowErrorModal(true);
      console.error("Failed to create ledger entry:", error);
    }
  };

  const addLine = () => {
    append({ accountCode: "", debit: 0, credit: 0, description: "" });
  };

  const isLoading = createMutation.loading;
  const error = createMutation.error;

  const accounts = accountsData?.accounts || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
        <div className="flex items-center">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md mr-2">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Ledger Entry
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Record accounting transactions
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-xs text-red-800 dark:text-red-200">
            {error.message || String(error)}
          </p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <label
                htmlFor="date"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="date"
                  {...register("date", { required: "Date is required" })}
                  className="w-full px-2 py-1.5 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
                />
                <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.date && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className="md:col-span-1">
              <label
                htmlFor="description"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description *
              </label>
              <input
                type="text"
                id="description"
                {...register("description", {
                  required: "Description is required",
                  minLength: {
                    value: 3,
                    message: "Description must be at least 3 characters",
                  },
                })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter transaction description"
              />
              {errors.description && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Journal Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Journal Lines
              </h3>
              <button
                type="button"
                onClick={addLine}
                className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Line
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Account
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Debit
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Credit
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Description
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="px-3 py-2">
                        <select
                          {...register(`lines.${index}.accountCode`, {
                            required: "Account is required",
                          })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select Account</option>
                          {accounts
                            .filter((acc: any) => acc.isActive)
                            .map((account: any) => (
                              <option
                                key={account.accountCode}
                                value={account.accountCode}
                              >
                                {account.accountCode} - {account.accountName}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <Controller
                          name={`lines.${index}.debit`}
                          control={control}
                          rules={{
                            min: { value: 0, message: "Debit must be >= 0" },
                          }}
                          render={({
                            field: { onChange, value, onBlur, ref, ...field },
                          }) => {
                            const displayValue =
                              value === 0 ||
                              value === null ||
                              value === undefined
                                ? ""
                                : value;
                            return (
                              <input
                                {...field}
                                ref={ref}
                                type="number"
                                step="0.01"
                                min="0"
                                value={displayValue}
                                onFocus={() => {
                                  focusedInputRef.current = {
                                    index,
                                    field: "debit",
                                  };
                                }}
                                onBlur={(e) => {
                                  const numValue =
                                    parseFloat(e.target.value) || 0;
                                  focusedInputRef.current = null;
                                  // Update the value and clear opposite field on blur
                                  onChange(numValue);
                                  if (numValue > 0) {
                                    setValue(`lines.${index}.credit`, 0, {
                                      shouldDirty: true,
                                      shouldValidate: false,
                                      shouldTouch: true,
                                    });
                                  }
                                  onBlur();
                                }}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  if (inputValue === "" || inputValue === "-") {
                                    onChange(0);
                                  } else {
                                    const numValue = parseFloat(inputValue);
                                    if (!isNaN(numValue) && numValue >= 0) {
                                      onChange(numValue);
                                    }
                                  }
                                }}
                                className="w-full px-2 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="0.00"
                              />
                            );
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Controller
                          name={`lines.${index}.credit`}
                          control={control}
                          rules={{
                            min: { value: 0, message: "Credit must be >= 0" },
                          }}
                          render={({
                            field: { onChange, value, onBlur, ref, ...field },
                          }) => {
                            const displayValue =
                              value === 0 ||
                              value === null ||
                              value === undefined
                                ? ""
                                : value;
                            return (
                              <input
                                {...field}
                                ref={ref}
                                type="number"
                                step="0.01"
                                min="0"
                                value={displayValue}
                                onFocus={() => {
                                  focusedInputRef.current = {
                                    index,
                                    field: "credit",
                                  };
                                }}
                                onBlur={(e) => {
                                  const numValue =
                                    parseFloat(e.target.value) || 0;
                                  focusedInputRef.current = null;
                                  // Update the value and clear opposite field on blur
                                  onChange(numValue);
                                  if (numValue > 0) {
                                    setValue(`lines.${index}.debit`, 0, {
                                      shouldDirty: true,
                                      shouldValidate: false,
                                      shouldTouch: true,
                                    });
                                  }
                                  onBlur();
                                }}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  if (inputValue === "" || inputValue === "-") {
                                    onChange(0);
                                  } else {
                                    const numValue = parseFloat(inputValue);
                                    if (!isNaN(numValue) && numValue >= 0) {
                                      onChange(numValue);
                                    }
                                  }
                                }}
                                className="w-full px-2 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="0.00"
                              />
                            );
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          {...register(`lines.${index}.description`)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Line description"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        {fields.length > 2 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Remove line"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white">
                      Totals
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-right text-gray-900 dark:text-white">
                      ${totalDebit.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-right text-gray-900 dark:text-white">
                      ${totalCredit.toFixed(2)}
                    </td>
                    <td className="px-3 py-2" colSpan={2}>
                      <span
                        className={`text-xs font-semibold ${
                          isBalanced
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isBalanced
                          ? "✓ Balanced"
                          : `Difference: $${Math.abs(
                              totalDebit - totalCredit
                            ).toFixed(2)}`}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {fields.length < 2 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                At least 2 journal lines are required
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isLoading || !isBalanced || fields.length < 2}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Create Ledger Entry
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/10 overflow-y-auto h-full w-full z-[105] flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800 z-[106]">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full mr-3">
                <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Ledger Entry
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Are you sure you want to create this ledger entry?
              </p>
              {pendingSubmission && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Date:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {new Date(pendingSubmission.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Description:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {pendingSubmission.description}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total Debits:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      ${totalDebit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total Credits:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      ${totalCredit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Lines:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {
                        pendingSubmission.lines.filter(
                          (l: any) =>
                            l.accountCode && (l.debit > 0 || l.credit > 0)
                        ).length
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingSubmission(null);
                }}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                disabled={createMutation.loading}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {createMutation.loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Confirm & Create
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/10 overflow-y-auto h-full w-full z-[105] flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800 z-[106]">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Success!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Ledger entry has been created successfully.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/10 overflow-y-auto h-full w-full z-[105] flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800 z-[106]">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full mr-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Error
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {modalMessage}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/10 overflow-y-auto h-full w-full z-[105] flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800 z-[106]">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full mr-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Validation Error
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {modalMessage}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerEntry;
