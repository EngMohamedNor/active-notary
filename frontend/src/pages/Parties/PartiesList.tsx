import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  Eye,
  FileText,
} from "lucide-react";
import { useApi, useApiMutation } from "../../hooks";
import { partyApi } from "../../services/api";
import PartyForm from "./PartyForm";

const PartiesList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingParty, setEditingParty] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<any>(null);

  // Set type filter based on route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/parties/customers") {
      setTypeFilter("customer");
    } else if (path === "/parties/vendors") {
      setTypeFilter("vendor");
    } else if (path === "/parties/employees") {
      setTypeFilter("employee");
    } else if (path === "/parties") {
      setTypeFilter("");
    }
  }, [location.pathname]);

  const {
    data: partiesData,
    loading,
    refetch,
  } = useApi(
    () =>
      partyApi.getParties({
        page,
        limit: 10,
        isActive:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
            ? false
            : undefined,
        partyType:
          (typeFilter as "customer" | "vendor" | "employee" | undefined) ||
          undefined,
      }),
    [page, statusFilter, typeFilter]
  );

  const deleteMutation = useApiMutation(partyApi.deleteParty);

  const filteredParties =
    partiesData?.data?.filter(
      (party: any) =>
        party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (party.email &&
          party.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

  const handleEdit = (party: any) => {
    setEditingParty(party);
    setShowForm(true);
  };

  const handleDelete = async (party: any) => {
    if (
      window.confirm(`Are you sure you want to deactivate "${party.name}"?`)
    ) {
      try {
        await deleteMutation.mutate(party.id);
        refetch();
      } catch (error: any) {
        alert(error.message || "Failed to deactivate party");
        console.error("Failed to deactivate party:", error);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingParty(null);
    refetch();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingParty(null);
  };

  const getPartyTypeColor = (type: string) => {
    switch (type) {
      case "customer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "vendor":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "employee":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md mr-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Parties Management
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Manage customers, vendors, and employees
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Party
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow border border-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search parties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="employee">Employee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Parties Table */}
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredParties.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No parties found
                      </td>
                    </tr>
                  ) : (
                    filteredParties.map((party: any) => (
                      <tr
                        key={party.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onDoubleClick={() =>
                          navigate(`/parties/${party.id}/statement`)
                        }
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {party.code}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {party.name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPartyTypeColor(
                              party.partyType
                            )}`}
                          >
                            {party.partyType}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {party.email || "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {party.phone || "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                          {typeof party.balance === "number"
                            ? new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(party.balance)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              party.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {party.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setShowDetails(party)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/parties/${party.id}/statement`)
                              }
                              className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                              title="View Statement"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleEdit(party)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(party)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Deactivate"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {partiesData?.pagination &&
              partiesData.pagination.totalPages > 1 && (
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {(page - 1) * 10 + 1} to{" "}
                    {Math.min(page * 10, partiesData.pagination.total)} of{" "}
                    {partiesData.pagination.total} parties
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= partiesData.pagination.totalPages}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
          </>
        )}
      </div>

      {/* Party Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/10">
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg z-[106] w-full max-w-2xl mx-4 border border-white max-h-[90vh] overflow-y-auto">
            <PartyForm
              party={editingParty}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      {/* Party Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/10">
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg z-[106] w-full max-w-md mx-4 p-4 border border-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Party Details
              </h2>
              <button
                onClick={() => setShowDetails(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Code:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {showDetails.code}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Name:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {showDetails.name}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Type:
                </span>
                <span
                  className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPartyTypeColor(
                    showDetails.partyType
                  )}`}
                >
                  {showDetails.partyType}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Email:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {showDetails.email || "-"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Phone:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {showDetails.phone || "-"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Balance:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {typeof showDetails.balance === "number"
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(showDetails.balance)
                    : "$0.00"}
                </span>
              </div>
              {showDetails.partyType === "customer" && (
                <>
                  {showDetails.paymentTerms && (
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Payment Terms:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {showDetails.paymentTerms}
                      </span>
                    </div>
                  )}
                  {showDetails.creditLimit !== null && (
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Credit Limit:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        ${showDetails.creditLimit?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  )}
                </>
              )}
              {showDetails.partyType === "vendor" &&
                showDetails.vendorNumber && (
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Vendor Number:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {showDetails.vendorNumber}
                    </span>
                  </div>
                )}
              {showDetails.partyType === "employee" && (
                <>
                  {showDetails.employeeId && (
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Employee ID:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {showDetails.employeeId}
                      </span>
                    </div>
                  )}
                  {showDetails.department && (
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Department:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {showDetails.department}
                      </span>
                    </div>
                  )}
                  {showDetails.hireDate && (
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Hire Date:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {new Date(showDetails.hireDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Status:
                </span>
                <span
                  className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    showDetails.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {showDetails.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDetails(null)}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
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

export default PartiesList;
