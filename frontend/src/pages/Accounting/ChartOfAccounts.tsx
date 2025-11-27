import React, { useState } from 'react';
import { BookOpen, Search, Plus, Edit, Eye, Trash2, RefreshCw, X } from 'lucide-react';
import { useApi, useApiMutation } from '../../hooks';
import { accountingApi } from '../../services/api';
import AccountForm from './AccountForm';

const ChartOfAccounts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const deleteMutation = useApiMutation(accountingApi.deleteChartOfAccount);

  const { data: accountsData, loading, refetch } = useApi(
    () => accountingApi.getChartOfAccounts({
      category: categoryFilter || undefined,
      isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    }),
    [categoryFilter, statusFilter]
  );

  const filteredAccounts = accountsData?.accounts?.filter((account: any) =>
    account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'asset', label: 'Assets' },
    { value: 'liability', label: 'Liabilities' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expenses' },
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      asset: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      liability: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      equity: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      revenue: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = async (account: any) => {
    if (!window.confirm(`Are you sure you want to delete "${account.accountName}" (${account.accountCode})?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await deleteMutation.mutate(account.id);
      refetch();
      alert('Account deleted successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to delete account');
      console.error('Failed to delete account:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAccount(null);
    refetch();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md mr-2">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chart of Accounts</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Manage your accounting accounts</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setEditingAccount(null);
                setShowForm(true);
              }}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Account
            </button>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Search accounts..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
              className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAccounts.map((account: any) => (
                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {account.accountCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {account.accountName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(account.category)}`}>
                          {account.category.charAt(0).toUpperCase() + account.category.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {account.accountType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          account.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setSelectedAccount(account)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(account)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(account)}
                            disabled={deleteMutation.loading}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAccounts.length === 0 && !loading && (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No accounts found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <AccountForm
          account={editingAccount}
          accounts={(accountsData?.accounts || [])}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {/* Account Details Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black/10 overflow-y-auto h-full w-full z-[105] flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white dark:bg-gray-800 z-[106]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Details</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedAccount(null);
                    handleEdit(selectedAccount);
                  }}
                  className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Account Code</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAccount.accountCode}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Account Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAccount.accountName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{selectedAccount.category}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedAccount.accountType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedAccount.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {selectedAccount.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Parent Account</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedAccount.parent ? `${selectedAccount.parent.accountCode} - ${selectedAccount.parent.accountName}` : 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
