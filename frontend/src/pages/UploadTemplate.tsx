import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadFormInputs {
  template_name: string;
  template: FileList;
  description?: string;
  category: string;
  sub_category: string;
}

const UploadTemplate: React.FC = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UploadFormInputs>();
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isUploading, setIsUploading] = useState(false);

  // Static category options - you can manually update these
  const categoryOptions = [
    'Legal Documents',
    'Business Documents',
    'Personal Documents',
    'Educational Documents',
    'Medical Documents',
    'Financial Documents',
    'Government Forms',
    'Other'
  ];

  // Static sub-category options - you can manually update these
  const subCategoryOptions = [
    'Contracts',
    'Agreements',
    'Certificates',
    'Reports',
    'Applications',
    'Declarations',
    'Letters',
    'Forms',
    'Invoices',
    'Receipts',
    'Statements',
    'Other'
  ];

  const onSubmit = async (data: UploadFormInputs) => {
    if (!data.template || data.template.length === 0) {
      setStatus({ type: 'error', message: 'Please select a DOCX file.' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: null, message: '' });

    const formData = new FormData();
    formData.append('template_name', data.template_name);
    formData.append('template', data.template[0]);
    formData.append('category', data.category);
    formData.append('sub_category', data.sub_category);
    if (data.description) {
      formData.append('description', data.description);
    }

    try {
      const res = await fetch('http://localhost:3000/api/templates/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        setStatus({ type: 'success', message: 'Template uploaded successfully!' });
        reset();
      } else {
        const err = await res.json();
        setStatus({ type: 'error', message: 'Upload failed: ' + (err.error || 'Unknown error') });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Upload failed: ' + error });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Template</h2>
        <p className="mt-1 text-sm text-gray-500">Upload a new DOCX template to your library</p>
      </div>

      {/* Upload Form */}
      <div className="card-hover rounded-2xl">
        <div className="px-6 py-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Name */}
            <div>
              <label htmlFor="template_name" className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                id="template_name"
                type="text"
                {...register('template_name', { required: 'Template name is required' })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter a descriptive name for your template"
              />
              {errors.template_name && (
                <p className="mt-1 text-sm text-red-600">{errors.template_name.message}</p>
              )}
            </div>

            {/* Category and Sub-Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  {...register('category', { required: 'Category is required' })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              {/* Sub-Category */}
              <div>
                <label htmlFor="sub_category" className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-Category *
                </label>
                <select
                  id="sub_category"
                  {...register('sub_category', { required: 'Sub-category is required' })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a sub-category</option>
                  {subCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.sub_category && (
                  <p className="mt-1 text-sm text-red-600">{errors.sub_category.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Provide a brief description of this template (optional)"
              />
            </div>

            {/* File Upload */}
            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                DOCX File *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="template"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="template"
                        type="file"
                        accept=".docx"
                        {...register('template', { required: 'Please select a DOCX file' })}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">DOCX files only, up to 10MB</p>
                </div>
              </div>
              {errors.template && (
                <p className="mt-1 text-sm text-red-600">{errors.template.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Template
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Status Message */}
          {status.message && (
            <div className={`mt-6 rounded-md p-4 ${
              status.type === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {status.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    status.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {status.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Guidelines */}
      <div className="card-hover rounded-2xl p-6" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'
      }}>
        <h3 className="text-lg font-medium text-blue-900 mb-2">Upload Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Only DOCX files are supported</li>
          <li>• Maximum file size is 10MB</li>
          <li>• Use descriptive names for easy identification</li>
          <li>• Templates should be properly formatted before upload</li>
          <li>• Consider adding merge fields using standard notation</li>
        </ul>
      </div>
    </div>
  );
};

export default UploadTemplate;
