import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Save } from 'lucide-react';
import { useApiMutation } from '../../hooks';
import { accountingApi } from '../../services/api';

interface AccountFormData {
  accountCode: string;
  accountName: string;
  category: string;
  accountType: string;
  parentId: string;
  isActive: boolean;
}

interface AccountFormProps {
  account?: any;
  accounts: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

const AccountForm: React.FC<AccountFormProps> = ({ account, accounts, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<AccountFormData>({
    defaultValues: account ? {
      accountCode: account.accountCode,
      accountName: account.accountName,
      category: account.category,
      accountType: account.accountType,
      parentId: account.parentId || '',
      isActive: account.isActive
    } : {
      accountCode: '',
      accountName: '',
      category: '',
      accountType: '',
      parentId: '',
      isActive: true
    }
  });

  const selectedCategory = watch('category');

  const createMutation = useApiMutation(accountingApi.createChartOfAccount);
  const updateMutation = useApiMutation((data: any) => accountingApi.updateChartOfAccount(account.id, data));

  const isLoading = createMutation.loading || updateMutation.loading;
  const error = createMutation.error || updateMutation.error;

  const onSubmit = async (data: AccountFormData) => {
    try {
      if (account) {
        await updateMutation.mutate({
          accountCode: data.accountCode,
          accountName: data.accountName,
          category: data.category,
          accountType: data.accountType,
          parentId: data.parentId || undefined,
          isActive: data.isActive
        });
      } else {
        await createMutation.mutate({
          accountCode: data.accountCode,
          accountName: data.accountName,
          category: data.category,
          accountType: data.accountType,
          parentId: data.parentId || undefined,
          isActive: data.isActive
        });
      }
      onSuccess();
    } catch (err: any) {
      console.error('Failed to save account:', err);
    }
  };

  const categories = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' }
  ];

  const getAccountTypes = (category: string) => {
    switch (category) {
      case 'asset':
        return [
          { value: 'current_asset', label: 'Current Asset' },
          { value: 'fixed_asset', label: 'Fixed Asset' }
        ];
      case 'liability':
        return [
          { value: 'current_liability', label: 'Current Liability' },
          { value: 'long_term_liability', label: 'Long-term Liability' }
        ];
      case 'equity':
        return [
          { value: 'owners_equity', label: "Owner's Equity" }
        ];
      case 'revenue':
        return [
          { value: 'sales_revenue', label: 'Sales Revenue' },
          { value: 'other_revenue', label: 'Other Revenue' }
        ];
      case 'expense':
        return [
          { value: 'cost_of_goods_sold', label: 'Cost of Goods Sold' },
          { value: 'operating_expense', label: 'Operating Expense' },
          { value: 'other_expense', label: 'Other Expense' }
        ];
      default:
        return [];
    }
  };

  const availableAccounts = accounts.filter((acc: any) => 
    !account || acc.id !== account.id
  );

  return (
    <div className="fixed inset-0 bg-black/10 overflow-y-auto h-full w-full z-[105] flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800 z-[106]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {account ? 'Edit Account' : 'Create New Account'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-xs text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Code *
              </label>
              <input
                type="text"
                {...register('accountCode', {
                  required: 'Account code is required',
                  maxLength: { value: 20, message: 'Account code must be 20 characters or less' }
                })}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 1000"
              />
              {errors.accountCode && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.accountCode.message}</p>
              )}
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                {...register('accountName', {
                  required: 'Account name is required',
                  maxLength: { value: 255, message: 'Account name must be 255 characters or less' }
                })}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Cash"
              />
              {errors.accountName && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.accountName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.category.message}</p>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Type *
              </label>
              <select
                {...register('accountType', { required: 'Account type is required' })}
                disabled={!selectedCategory}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="">Select Type</option>
                {getAccountTypes(selectedCategory).map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.accountType && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.accountType.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parent Account */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parent Account (Optional)
              </label>
              <select
                {...register('parentId')}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">None</option>
                {availableAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountCode} - {acc.accountName}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Status */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {account ? 'Update' : 'Create'} Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountForm;

