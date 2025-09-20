import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUtils } from '../utils/api';

interface Template {
  template_id: string;
  template_name: string;
  template_path: string;
  category: string;
  sub_category: string;
}

interface TemplateAnalysis {
  template_id: string;
  template_name: string;
  placeholders: string[];
}

interface FormData {
  [key: string]: string;
}

interface DocumentMetadata {
  description: string;
  customer_name: string;
  customer_phone: string;
  total: string;
}

const GenerateDocument: React.FC = () => {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateAnalysis, setTemplateAnalysis] = useState<TemplateAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedDocumentUrl, setGeneratedDocumentUrl] = useState<string | null>(null);
  const [generatedDocumentFilename, setGeneratedDocumentFilename] = useState<string>('');
  
  // Category and sub-category selection states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const { register: registerMetadata, handleSubmit: handleSubmitMetadata, reset: resetMetadata, formState: { errors: metadataErrors } } = useForm<DocumentMetadata>();

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async (category?: string, subCategory?: string) => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let endpoint = '/templates';
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (subCategory) params.append('sub_category', subCategory);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      const response = await apiUtils.get(endpoint, token);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch templates');
      }
      const data = await response.json();
      
      if (!category && !subCategory) {
        // Initial load - get all templates and extract categories
        setTemplates(data);
        const categories = [...new Set(data.map((t: Template) => t.category))].sort();
        setAvailableCategories(categories);
      } else {
        // Filtered load
        setFilteredTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubCategory('');
    setSelectedTemplate(null);
    setTemplateAnalysis(null);
    setFilteredTemplates([]);
    setAvailableSubCategories([]);
    
    if (category) {
      // Get sub-categories for the selected category
      const subCategories = [...new Set(
        templates
          .filter(t => t.category === category)
          .map(t => t.sub_category)
      )].sort();
      setAvailableSubCategories(subCategories);
    }
  };

  const handleSubCategoryChange = (subCategory: string) => {
    setSelectedSubCategory(subCategory);
    setSelectedTemplate(null);
    setTemplateAnalysis(null);
    
    if (subCategory && selectedCategory) {
      // Filter templates by both category and sub-category
      const filtered = templates.filter(
        t => t.category === selectedCategory && t.sub_category === subCategory
      );
      setFilteredTemplates(filtered);
    }
  };

  const handleTemplateSelect = async (template: Template) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setSelectedTemplate(template);
      
      const response = await apiUtils.get(`/templates/${template.template_id}/analyze`, token);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze template');
      }
      
      const analysis = await response.json();
      setTemplateAnalysis(analysis);
      
      // Reset form when template changes
      reset();
    } catch (error) {
      console.error('Error analyzing template:', error);
      setError('Failed to analyze template');
    } finally {
      setAnalyzing(false);
    }
  };

  const onSubmit = async (data: FormData, metadata: DocumentMetadata) => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const response = await apiUtils.post('/documents/generate', {
        template_id: selectedTemplate.template_id,
        data: data,
        description: metadata.description,
        customer_name: metadata.customer_name,
        customer_phone: metadata.customer_phone,
        total: metadata.total,
      }, token);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate document');
      }

      // Get the filename from the response headers
      console.log('All response headers:', Object.fromEntries(response.headers.entries()));
      const contentDisposition = response.headers.get('content-disposition');
      const xFilename = response.headers.get('x-filename');
      console.log('Content-Disposition header:', contentDisposition);
      console.log('X-Filename header:', xFilename);
      let filename = 'generated-document.docx';
      
      // Try X-Filename header first (more reliable)
      if (xFilename) {
        filename = xFilename;
      } else if (contentDisposition) {
        // Try different parsing methods for Content-Disposition
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        } else {
          // Fallback to simple split method
          const splitResult = contentDisposition.split('filename=')[1];
          if (splitResult) {
            filename = splitResult.replace(/"/g, '').trim();
          }
        }
      }
      
      console.log('Final extracted filename:', filename);

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Store the URL and filename for the download step
      setGeneratedDocumentUrl(url);
      setGeneratedDocumentFilename(filename);
      
      // Move to step 4 (Download)
      setCurrentStep(4);

    } catch (error) {
      console.error('Error generating document:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate document');
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setTemplateAnalysis(null);
    setSelectedCategory('');
    setSelectedSubCategory('');
    setFilteredTemplates([]);
    setAvailableSubCategories([]);
    reset();
    resetMetadata();
    setError(null);
    setCurrentStep(1);
    setGeneratedDocumentUrl(null);
    setGeneratedDocumentFilename('');
  };

  const handleFormSubmit = (data: FormData) => {
    handleSubmitMetadata((metadata) => {
      onSubmit(data, metadata);
    })();
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return selectedTemplate !== null;
      case 2:
        return true; // Customer info validation will be handled by form
      case 3:
        return true; // Template fields validation will be handled by form
      case 4:
        return false; // Final step, no next
      default:
        return false;
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Generate New Notary Document
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Follow the steps to generate your document.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Wizard Steps Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4">
            {/* Step 1 */}
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Document Type Selection</span>
            </div>
            
            <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            
            {/* Step 2 */}
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Customer & Payment</span>
            </div>
            
            <div className={`w-12 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            
            {/* Step 3 */}
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Document Fields</span>
            </div>
            
            <div className={`w-12 h-0.5 ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            
            {/* Step 4 */}
            <div className={`flex items-center ${currentStep >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                4
              </div>
              <span className="ml-2 text-sm font-medium">Download</span>
            </div>
          </div>
        </div>

        {/* Step 1: Template Selection */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Step 1: Select Document Type
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading templates...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No templates available</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Upload a template first to generate documents
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Category and Sub-Category Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select a category</option>
                      {availableCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Category Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sub-Category *
                    </label>
                    <select
                      value={selectedSubCategory}
                      onChange={(e) => handleSubCategoryChange(e.target.value)}
                      disabled={!selectedCategory}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a sub-category</option>
                      {availableSubCategories.map((subCategory) => (
                        <option key={subCategory} value={subCategory}>
                          {subCategory}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Template Selection */}
                {selectedCategory && selectedSubCategory && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Available Document Types
                    </h3>
                    {filteredTemplates.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No templates found</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          No templates available for the selected category and sub-category
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredTemplates.map((template) => (
                          <button
                            key={template.template_id}
                            onClick={() => handleTemplateSelect(template)}
                            className={`w-full p-4 text-left rounded-lg border transition-colors ${
                              selectedTemplate?.template_id === template.template_id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-gray-500 mr-3" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {template.template_name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {template.category} • {template.sub_category}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Template Analysis */}
            {analyzing && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Analyzing template...</span>
                </div>
              </div>
            )}

            {/* {templateAnalysis && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Template Analysis
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Template:</span> {templateAnalysis.template_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Placeholders found:</span> {templateAnalysis.placeholders.length}
                  </p>
                  {templateAnalysis.placeholders.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Required fields:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {templateAnalysis.placeholders.map((placeholder) => (
                          <span
                            key={placeholder}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {placeholder}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )} */}

            <div className="flex justify-end mt-6">
              <button
                onClick={nextStep}
                disabled={!canProceedToNext()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Customer & Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Customer Info and Payment */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Step 2: Customer Information & Payment
            </h2>
            
            <form onSubmit={handleSubmitMetadata(nextStep)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    {...registerMetadata('description', { required: 'Description is required' })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter document description"
                  />
                  {metadataErrors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {metadataErrors.description?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...registerMetadata('total', { required: 'Total amount is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter total amount"
                  />
                  {metadataErrors.total && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {metadataErrors.total?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    {...registerMetadata('customer_name', { required: 'Customer name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter customer name"
                  />
                  {metadataErrors.customer_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {metadataErrors.customer_name?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    {...registerMetadata('customer_phone', { required: 'Customer phone is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter customer phone number"
                  />
                  {metadataErrors.customer_phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {metadataErrors.customer_phone?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Next: Fill Document Fields
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Template Fields */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Step 3: Fill Document Fields
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Fill in all the required fields below. Fields are organized in a 3-column layout for better readability.
              {templateAnalysis?.placeholders && (
                <span className="block mt-1 text-blue-600 dark:text-blue-400">
                  {templateAnalysis.placeholders.filter(p => p !== 'serial_number').length} field(s) required
                </span>
              )}
            </p>
            
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templateAnalysis?.placeholders.map((placeholder) => (
                  placeholder !== 'serial_number' && (
                    <div key={placeholder} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {placeholder.charAt(0).toUpperCase() + placeholder.slice(1).replace(/_/g, ' ')}
                        {placeholder.toLowerCase().includes('taariikh') && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                            (date)
                          </span>
                        )}
                      </label>
                      {placeholder.toLowerCase().includes('taariikh') ? (
                        <input
                          type="date"
                          {...register(placeholder, { required: `${placeholder} is required` })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      ) : (
                        <input
                          type="text"
                          {...register(placeholder, { required: `${placeholder} is required` })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder={`Enter ${placeholder.replace(/_/g, ' ')}`}
                        />
                      )}
                      {errors[placeholder] && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {errors[placeholder]?.message}
                        </p>
                      )}
                    </div>
                  )
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate DOCX
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Download Document */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Step 4: Download Document
            </h2>
            
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Document Generated Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your document <span className="font-semibold text-gray-900 dark:text-white">{generatedDocumentFilename}</span> has been generated and saved. You can download it now or generate another document.
                </p>
              </div>

              <div className="space-y-4">
                {generatedDocumentUrl && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedDocumentUrl;
                      link.download = generatedDocumentFilename || 'generated-document.docx';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center mx-auto"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download {generatedDocumentFilename || 'Document'}
                  </button>
                )}
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Generate Another Document
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateDocument;
