import React, { useState } from "react";
import { useApi } from "../../hooks";
import { accountingApi } from "../../services/api";
import { Printer, Calendar, Loader2 } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface Account {
  accountCode: string;
  accountName: string;
  balance: number;
  children: Account[];
}

const AccountRow: React.FC<{
  account: Account;
  level: number;
  calculateTotal: (acc: Account) => number;
}> = ({ account, level, calculateTotal }) => {
  const total = calculateTotal(account);
  const hasChildren = account.children && account.children.length > 0;
  const showAccount = total !== 0 || hasChildren;

  if (!showAccount) return null;

  return (
    <>
      <tr className="border-b border-gray-200 dark:border-gray-700">
        <td
          className="px-4 py-2 text-sm"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <div className="flex items-center">
            {level > 0 && (
              <span className="mr-2 text-gray-400">└─</span>
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {account.accountCode}
            </span>
            <span className="ml-2 text-gray-700 dark:text-gray-300">
              {account.accountName}
            </span>
          </div>
        </td>
        <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
          {formatCurrency(total)}
        </td>
      </tr>
      {hasChildren &&
        account.children.map((child) => (
          <AccountRow
            key={child.accountCode}
            account={child}
            level={level + 1}
            calculateTotal={calculateTotal}
          />
        ))}
    </>
  );
};

const IncomeStatement: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(
    new Date(currentYear, 0, 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data, loading, refetch } = useApi(() =>
    accountingApi.getIncomeStatement({ startDate, endDate })
  );

  const calculateAccountTotal = (account: Account): number => {
    let total = Math.abs(account.balance);
    if (account.children && account.children.length > 0) {
      account.children.forEach((child) => {
        total += calculateAccountTotal(child);
      });
    }
    return total;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 print:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Income Statement
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setTimeout(() => refetch(), 100);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setTimeout(() => refetch(), 100);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 print:shadow-none print:p-0">
        {/* Company Header */}
        <div className="text-center mb-8 print:mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            INCOME STATEMENT
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            For the period from{" "}
            {data?.startDate ? formatDate(data.startDate) : formatDate(startDate)}{" "}
            to {data?.endDate ? formatDate(data.endDate) : formatDate(endDate)}
          </p>
        </div>

        {/* Income Statement Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-800 dark:border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                  Account
                </th>
                <th className="text-right px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {/* REVENUE */}
              <tr className="bg-gray-50 dark:bg-gray-700">
                <td
                  colSpan={2}
                  className="px-4 py-3 text-lg font-bold text-gray-900 dark:text-white"
                >
                  REVENUE
                </td>
              </tr>
              {data?.revenue?.accounts?.map((account: Account) => (
                <AccountRow
                  key={account.accountCode}
                  account={account}
                  level={0}
                  calculateTotal={calculateAccountTotal}
                />
              ))}
              <tr className="border-t-2 border-gray-800 dark:border-gray-200">
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                  Total Revenue
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data?.revenue?.total || 0)}
                </td>
              </tr>

              {/* EXPENSES */}
              <tr>
                <td colSpan={2} className="px-4 py-4"></td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <td
                  colSpan={2}
                  className="px-4 py-3 text-lg font-bold text-gray-900 dark:text-white"
                >
                  EXPENSES
                </td>
              </tr>
              {data?.expenses?.accounts?.map((account: Account) => (
                <AccountRow
                  key={account.accountCode}
                  account={account}
                  level={0}
                  calculateTotal={calculateAccountTotal}
                />
              ))}
              <tr className="border-t-2 border-gray-800 dark:border-gray-200">
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                  Total Expenses
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data?.expenses?.total || 0)}
                </td>
              </tr>

              {/* NET INCOME */}
              <tr>
                <td colSpan={2} className="px-4 py-4"></td>
              </tr>
              <tr className="border-t-4 border-gray-800 dark:border-gray-200 bg-gray-100 dark:bg-gray-700">
                <td className="px-4 py-4 text-right text-lg font-bold text-gray-900 dark:text-white">
                  Net Income
                </td>
                <td
                  className={`px-4 py-4 text-right text-lg font-bold ${
                    (data?.netIncome || 0) >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(data?.netIncome || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 print:mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Generated on {formatDate(new Date())}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:p-0 {
            padding: 0;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem;
          }
          .print\\:mt-6 {
            margin-top: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default IncomeStatement;

