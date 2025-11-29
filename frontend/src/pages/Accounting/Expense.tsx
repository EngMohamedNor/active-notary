import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  DollarSign,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Plus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiUtils } from "../../utils/api";
import { accountingApi, partyApi } from "../../services/api";
import Select from "react-select";

interface ExpenseAccount {
  accountCode: string;
  accountName: string;
}

interface CashAccount {
  accountCode: string;
  accountName: string;
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

interface ExpenseFormData {
  expenseAccountCode: string;
  amount: string;
  refNo: string;
  description: string;
  transactionDate: string;
}

const Expense: React.FC = () => {
  const { token } = useAuth();
  const [expenseAccounts, setExpenseAccounts] = useState<ExpenseAccount[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExpenseAccount, setSelectedExpenseAccount] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [paymentAccountBalance, setPaymentAccountBalance] = useState<
    number | null
  >(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ExpenseFormData>({
    defaultValues: {
      expenseAccountCode: "",
      amount: "",
      refNo: "",
      description: "",
      transactionDate: new Date().toISOString().split("T")[0],
    },
  });

  const amount = watch("amount");

  // Generate supplier code
  const generateSupplierCode = () => {
    // Generate a simple supplier code based on timestamp and random number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `SUPP-${timestamp}-${random}`;
  };

  // Handle create supplier
  const handleCreateSupplier = async () => {
    if (!token) {
      setError("Authentication required");
      return;
    }

    if (!newSupplierForm.name.trim()) {
      setError("Supplier name is required");
      return;
    }

    try {
      setCreatingSupplier(true);
      setError(null);

      const supplierCode = generateSupplierCode();
      const data = await partyApi.createParty({
        partyType: "vendor",
        name: newSupplierForm.name.trim(),
        code: supplierCode,
        phone: newSupplierForm.phone.trim() || undefined,
        address: newSupplierForm.address.trim() || undefined,
      });

      const newSupplier = data.party;

      // Add new supplier to the list
      const updatedSuppliers = [
        ...suppliers,
        {
          id: newSupplier.id,
          name: newSupplier.name,
          code: newSupplier.code,
        },
      ];
      setSuppliers(updatedSuppliers);

      // Preselect the newly created supplier
      setSelectedSupplier({
        value: newSupplier.id,
        label: `${newSupplier.code} - ${newSupplier.name}`,
      });

      // Close modal and reset form
      setShowSupplierModal(false);
      setNewSupplierForm({ name: "", phone: "", address: "" });
    } catch (error) {
      console.error("Error creating supplier:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create supplier"
      );
    } finally {
      setCreatingSupplier(false);
    }
  };

  // Fetch expense accounts and cash accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!token) return;
      try {
        setLoadingAccounts(true);
        const [expenseResponse, cashResponse] = await Promise.all([
          apiUtils.get(
            "/accounting/chart-of-accounts?category=expense&isActive=true",
            token
          ),
          accountingApi.getCashAccounts(),
        ]);

        if (!expenseResponse.ok) {
          throw new Error("Failed to fetch expense accounts");
        }

        const expenseData = await expenseResponse.json();
        setExpenseAccounts(
          expenseData.accounts
            .filter((acc: any) => acc.category === "expense")
            .map((acc: any) => ({
              accountCode: acc.accountCode,
              accountName: acc.accountName,
            }))
        );

        setCashAccounts(
          cashResponse.accounts?.map((acc: any) => ({
            accountCode: acc.accountCode,
            accountName: acc.accountName,
          })) || []
        );
      } catch (error) {
        console.error("Error fetching accounts:", error);
        setError("Failed to load accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [token]);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!token) return;
      try {
        setLoadingSuppliers(true);
        const response = await partyApi.getParties({
          partyType: "vendor",
          isActive: true,
          limit: 1000, // Get all suppliers
        });
        // Backend returns { data: [...], pagination: {...} }
        const partiesList = response.data || [];
        setSuppliers(
          partiesList.map((party: any) => ({
            id: party.id,
            name: party.name,
            code: party.code,
          }))
        );
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, [token]);

  // Fetch payment account balance when account is selected
  useEffect(() => {
    const fetchBalance = async () => {
      if (!selectedPaymentAccount || !token || !amount) return;

      try {
        setLoadingBalance(true);
        const response = await accountingApi.getAccountBalance(
          selectedPaymentAccount.value
        );
        const balance = response.balance?.balance || 0;
        setPaymentAccountBalance(balance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setPaymentAccountBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };

    if (isPaid && selectedPaymentAccount) {
      fetchBalance();
    } else {
      setPaymentAccountBalance(null);
    }
  }, [selectedPaymentAccount, isPaid, amount, token]);

  const onSubmit = async (data: ExpenseFormData) => {
    if (!token) {
      setError("Authentication required");
      return;
    }

    if (!selectedExpenseAccount) {
      setError("Please select an expense account");
      return;
    }

    if (isPaid && !selectedPaymentAccount) {
      setError("Please select a payment account");
      return;
    }

    if (!isPaid && !selectedSupplier) {
      setError("Please select a supplier for unpaid expenses");
      return;
    }

    const expenseAmount = parseFloat(data.amount);
    if (
      isPaid &&
      paymentAccountBalance !== null &&
      paymentAccountBalance < expenseAmount
    ) {
      setError(
        `Insufficient balance. Available: ${paymentAccountBalance.toFixed(2)}`
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      await accountingApi.createExpense({
        expenseAccountCode: selectedExpenseAccount.value,
        amount: expenseAmount,
        refNo: data.refNo || undefined,
        description: data.description,
        transactionDate: data.transactionDate,
        paymentAccountCode: isPaid ? selectedPaymentAccount?.value : undefined,
        supplierId: !isPaid ? selectedSupplier?.value : undefined,
        isPaid: isPaid,
      });

      setSuccess(true);
      reset();
      setSelectedExpenseAccount(null);
      setSelectedPaymentAccount(null);
      setSelectedSupplier(null);
      setIsPaid(true);
      setPaymentAccountBalance(null);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error creating expense:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create expense"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
        <div className="flex items-center">
          <div className="p-1.5 bg-red-100 dark:bg-red-900 rounded-md mr-2">
            <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Expense
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Record a new expense transaction
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Expense created successfully!
            </span>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              {error}
            </span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Expense Form */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Transaction Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    {...register("transactionDate", {
                      required: "Transaction date is required",
                    })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                {errors.transactionDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.transactionDate.message}
                  </p>
                )}
              </div>

              {/* Expense Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expense Account <span className="text-red-500">*</span>
                </label>
                {loadingAccounts ? (
                  <div className="flex items-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Loading expense accounts...
                    </span>
                  </div>
                ) : (
                  <Select
                    value={selectedExpenseAccount}
                    onChange={setSelectedExpenseAccount}
                    options={expenseAccounts.map((account) => ({
                      value: account.accountCode,
                      label: `${account.accountCode} - ${account.accountName}`,
                    }))}
                    isSearchable
                    placeholder="Select an expense account"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base: any, state: any) => ({
                        ...base,
                        backgroundColor: "white",
                        borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                        minHeight: "38px",
                        boxShadow: state.isFocused
                          ? "0 0 0 1px #3b82f6"
                          : "none",
                        "&:hover": {
                          borderColor: "#3b82f6",
                        },
                      }),
                      menu: (base: any) => ({
                        ...base,
                        zIndex: 9999,
                      }),
                    }}
                    theme={(theme: any) => ({
                      ...theme,
                      colors: {
                        ...theme.colors,
                        primary: "#3b82f6",
                        primary25: "#dbeafe",
                      },
                    })}
                  />
                )}
                {!selectedExpenseAccount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Please select an expense account
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("amount", {
                    required: "Amount is required",
                    min: {
                      value: 0.01,
                      message: "Amount must be greater than 0",
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  {...register("refNo")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter reference number (optional)"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Paid/Unpaid Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="isPaid"
                      checked={isPaid}
                      onChange={() => {
                        setIsPaid(true);
                        setSelectedSupplier(null);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Paid
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="isPaid"
                      checked={!isPaid}
                      onChange={() => {
                        setIsPaid(false);
                        setSelectedPaymentAccount(null);
                        setPaymentAccountBalance(null);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unpaid
                    </span>
                  </label>
                </div>
              </div>

              {/* Payment Account (if paid) */}
              {isPaid && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Account <span className="text-red-500">*</span>
                  </label>
                  {loadingAccounts ? (
                    <div className="flex items-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Loading accounts...
                      </span>
                    </div>
                  ) : (
                    <>
                      <Select
                        value={selectedPaymentAccount}
                        onChange={setSelectedPaymentAccount}
                        options={cashAccounts.map((account) => ({
                          value: account.accountCode,
                          label: `${account.accountCode} - ${account.accountName}`,
                        }))}
                        isSearchable
                        placeholder="Select payment account"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base: any, state: any) => ({
                            ...base,
                            backgroundColor: "white",
                            borderColor: state.isFocused
                              ? "#3b82f6"
                              : "#d1d5db",
                            minHeight: "38px",
                            boxShadow: state.isFocused
                              ? "0 0 0 1px #3b82f6"
                              : "none",
                            "&:hover": {
                              borderColor: "#3b82f6",
                            },
                          }),
                          menu: (base: any) => ({
                            ...base,
                            zIndex: 9999,
                          }),
                        }}
                        theme={(theme: any) => ({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            primary: "#3b82f6",
                            primary25: "#dbeafe",
                          },
                        })}
                      />
                      {selectedPaymentAccount && amount && (
                        <div className="mt-2">
                          {loadingBalance ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Checking balance...
                            </p>
                          ) : paymentAccountBalance !== null ? (
                            <p
                              className={`text-xs ${
                                paymentAccountBalance >=
                                parseFloat(amount || "0")
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              Available Balance:{" "}
                              {paymentAccountBalance.toFixed(2)}
                              {paymentAccountBalance <
                                parseFloat(amount || "0") && " (Insufficient)"}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </>
                  )}
                  {!selectedPaymentAccount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Please select a payment account
                    </p>
                  )}
                </div>
              )}

              {/* Supplier (if unpaid) */}
              {!isPaid && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  {loadingSuppliers ? (
                    <div className="flex items-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Loading suppliers...
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <Select
                        value={selectedSupplier}
                        onChange={setSelectedSupplier}
                        options={suppliers.map((supplier) => ({
                          value: supplier.id,
                          label: `${supplier.code} - ${supplier.name}`,
                        }))}
                        isSearchable
                        placeholder="Select a supplier"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base: any, state: any) => ({
                            ...base,
                            backgroundColor: "white",
                            borderColor: state.isFocused
                              ? "#3b82f6"
                              : "#d1d5db",
                            minHeight: "38px",
                            paddingRight: "40px",
                            boxShadow: state.isFocused
                              ? "0 0 0 1px #3b82f6"
                              : "none",
                            "&:hover": {
                              borderColor: "#3b82f6",
                            },
                          }),
                          menu: (base: any) => ({
                            ...base,
                            zIndex: 9999,
                          }),
                        }}
                        theme={(theme: any) => ({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            primary: "#3b82f6",
                            primary25: "#dbeafe",
                          },
                        })}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowSupplierModal(true);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors z-10"
                        title="Create new supplier"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {!selectedSupplier && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Please select a supplier for unpaid expenses
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("description", {
                    required: "Description is required",
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter expense description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                reset();
                setSelectedExpenseAccount(null);
                setSelectedPaymentAccount(null);
                setSelectedSupplier(null);
                setIsPaid(true);
                setPaymentAccountBalance(null);
                setError(null);
                setSuccess(false);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !selectedExpenseAccount ||
                (isPaid && !selectedPaymentAccount) ||
                (!isPaid && !selectedSupplier)
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Supplier Creation Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Supplier
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowSupplierModal(false);
                  setNewSupplierForm({ name: "", phone: "", address: "" });
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSupplierForm.name}
                  onChange={(e) =>
                    setNewSupplierForm({
                      ...newSupplierForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter supplier name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  value={newSupplierForm.phone}
                  onChange={(e) =>
                    setNewSupplierForm({
                      ...newSupplierForm,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address{" "}
                  <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={newSupplierForm.address}
                  onChange={(e) =>
                    setNewSupplierForm({
                      ...newSupplierForm,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowSupplierModal(false);
                  setNewSupplierForm({ name: "", phone: "", address: "" });
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                disabled={creatingSupplier}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSupplier}
                disabled={creatingSupplier || !newSupplierForm.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {creatingSupplier ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Supplier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expense;
