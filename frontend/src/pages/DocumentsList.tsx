import React, { useState, useEffect } from 'react';
import { Download, Calendar, Search, FileText, Filter, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUtils } from '../utils/api';

interface Document {
  id: number;
  template_id: number;
  document_name: string;
  document_link: string;
  description: string;
  user_id?: number;
  doc_serial: number;
  book_no: number;
  serial_number: string;
  total?: number;
  paid?: number;
  balance?: number;
  customer_name?: string;
  customer_phone?: string;
  field_values?: Record<string, string>;
  created_at: string;
  updated_at: string;
  DocumentTemplate?: {
    template_name: string;
    template_id: string;
  };
}

const DocumentsList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    document: Document | null;
    placeholders: string[];
    placeholderData: Record<string, string>;
  }>({
    isOpen: false,
    document: null,
    placeholders: [],
    placeholderData: {}
  });
  const [editing, setEditing] = useState(false);
  const { token } = useAuth();

  // Fetch documents from database
  const fetchDocuments = async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiUtils.get('/documents/db', token);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data);
      setFilteredDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  // Filter documents based on search term and date range
  useEffect(() => {
    let filtered = documents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.document_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (dateFilter.startDate) {
      filtered = filtered.filter(doc => 
        new Date(doc.created_at) >= new Date(dateFilter.startDate)
      );
    }

    if (dateFilter.endDate) {
      filtered = filtered.filter(doc => 
        new Date(doc.created_at) <= new Date(dateFilter.endDate + 'T23:59:59')
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, dateFilter]);

  const handleDownload = async (doc: Document) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      // Extract filename from document_link or use document_name
      // The document_name should contain the serial number filename
      const filename = doc.document_name || `document_${doc.id}.docx`;
      
      console.log('Downloading document:', { 
        id: doc.id, 
        document_name: doc.document_name, 
        serial_number: doc.serial_number,
        filename 
      });
      
      const response = await apiUtils.get(`/documents/${filename}/download`, token);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
  };

  const handleEditDocument = async (doc: Document) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setEditing(true);
      
      // Fetch the template to get placeholders
      console.log('Fetching template analysis for template_id:', doc.DocumentTemplate?.template_id);
      const response = await apiUtils.get(`/templates/${doc.DocumentTemplate?.template_id}/analyze`, token);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Template not found. The template used for this document may have been deleted.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch template analysis');
      }
      
      const analysis = await response.json();
      
      // Initialize placeholder data with stored field values or empty strings
      const placeholderData: Record<string, string> = {};
      analysis.placeholders.forEach((placeholder: string) => {
        // Use stored field value if available, otherwise use empty string
        placeholderData[placeholder] = doc.field_values?.[placeholder] || '';
      });
      
      setEditModal({
        isOpen: true,
        document: doc,
        placeholders: analysis.placeholders,
        placeholderData
      });
    } catch (err) {
      console.error('Error opening edit modal:', err);
      setError(err instanceof Error ? err.message : 'Failed to open edit modal');
    } finally {
      setEditing(false);
    }
  };

  const handleUpdateDocument = async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setEditing(true);
      
      if (!editModal.document) return;
      
      const response = await apiUtils.put(`/documents/${editModal.document.id}/update`, {
        data: editModal.placeholderData,
      }, token);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update document');
      }
      
      const result = await response.json();
      console.log('Document updated:', result);
      
      // Close modal and refresh documents list
      setEditModal({
        isOpen: false,
        document: null,
        placeholders: [],
        placeholderData: {}
      });
      
      // Refresh the documents list
      await fetchDocuments();
      
      setError(null);
    } catch (err) {
      console.error('Error updating document:', err);
      setError(err instanceof Error ? err.message : 'Failed to update document');
    } finally {
      setEditing(false);
    }
  };

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      document: null,
      placeholders: [],
      placeholderData: {}
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Documents List
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all generated documents
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents by name, serial number, customer, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Date Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredDocuments.length} of {documents.length} documents
        </p>
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No documents found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {documents.length === 0 
                ? 'No documents have been generated yet'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {document.document_name || `Document ${document.id}`}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {document.serial_number}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {document.DocumentTemplate?.template_name || 'Unknown Template'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {document.customer_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {document.customer_phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          Total: {formatCurrency(document.total)}
                        </div>
                        {document.paid && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Paid: {formatCurrency(document.paid)}
                          </div>
                        )}
                        {document.balance && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Balance: {formatCurrency(document.balance)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(document.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDownload(document)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>
                        <button
                          onClick={() => handleEditDocument(document)}
                          disabled={editing}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center disabled:opacity-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit Document Placeholders
                </h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {editModal.document && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Original Document: {editModal.document.document_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Serial Number: {editModal.document.serial_number}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Template: {editModal.document.DocumentTemplate?.template_name}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Edit Placeholder Values
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Modify the placeholder values below. The existing document will be updated with these values. 
                  {editModal.document?.field_values && (
                    <span className="block mt-1 text-blue-600 dark:text-blue-400">
                      ✓ Values are pre-filled from the original document
                    </span>
                  )}
                </p>

                {editModal.placeholders.map((placeholder) => (
                  placeholder !== 'serial_number' && (
                    <div key={placeholder}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {placeholder.charAt(0).toUpperCase() + placeholder.slice(1).replace(/_/g, ' ')}
                        {placeholder.toLowerCase().includes('taariikh') && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                            (date)
                          </span>
                        )}
                        {editModal.document?.field_values?.[placeholder] && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            (pre-filled)
                          </span>
                        )}
                      </label>
                      {placeholder.toLowerCase().includes('taariikh') ? (
                        <input
                          type="date"
                          value={editModal.placeholderData[placeholder] || ''}
                          onChange={(e) => setEditModal(prev => ({
                            ...prev,
                            placeholderData: {
                              ...prev.placeholderData,
                              [placeholder]: e.target.value
                            }
                          }))}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                            editModal.document?.field_values?.[placeholder] 
                              ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={editModal.placeholderData[placeholder] || ''}
                          onChange={(e) => setEditModal(prev => ({
                            ...prev,
                            placeholderData: {
                              ...prev.placeholderData,
                              [placeholder]: e.target.value
                            }
                          }))}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                            editModal.document?.field_values?.[placeholder] 
                              ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder={`Enter ${placeholder.replace(/_/g, ' ')}`}
                        />
                      )}
                    </div>
                  )
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDocument}
                  disabled={editing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {editing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Update Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsList;
