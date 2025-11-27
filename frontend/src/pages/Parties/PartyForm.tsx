import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, X, Users, Calendar } from 'lucide-react';
import { useApiMutation, useApi } from '../../hooks';
import { partyApi } from '../../services/api';

interface PartyFormData {
  partyType: 'customer' | 'vendor' | 'employee';
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  vendorNumber?: string;
  employeeId?: string;
  department?: string;
  hireDate?: string;
}

interface PartyFormProps {
  party?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PartyForm: React.FC<PartyFormProps> = ({ party, onSuccess, onCancel }) => {
  const isEditing = !!party;
  const [partyType, setPartyType] = useState<'customer' | 'vendor' | 'employee'>(party?.partyType || 'customer');

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<PartyFormData>({
    defaultValues: party ? {
      partyType: party.partyType,
      name: party.name,
      code: party.code,
      email: party.email,
      phone: party.phone,
      address: party.address,
      city: party.city,
      state: party.state,
      zipCode: party.zipCode,
      country: party.country,
      taxId: party.taxId,
      paymentTerms: party.paymentTerms,
      creditLimit: party.creditLimit,
      vendorNumber: party.vendorNumber,
      employeeId: party.employeeId,
      department: party.department,
      hireDate: party.hireDate ? new Date(party.hireDate).toISOString().split('T')[0] : undefined,
    } : {
      partyType: 'customer',
    }
  });

  const watchedPartyType = watch('partyType');

  useEffect(() => {
    if (watchedPartyType) {
      setPartyType(watchedPartyType);
    }
  }, [watchedPartyType]);

  const createMutation = useApiMutation(partyApi.createParty);
  const updateMutation = useApiMutation((data: PartyFormData) => partyApi.updateParty(party!.id, data));

  // Load party data for editing
  useEffect(() => {
    if (party) {
      reset({
        partyType: party.partyType,
        name: party.name,
        code: party.code,
        email: party.email,
        phone: party.phone,
        address: party.address,
        city: party.city,
        state: party.state,
        zipCode: party.zipCode,
        country: party.country,
        taxId: party.taxId,
        paymentTerms: party.paymentTerms,
        creditLimit: party.creditLimit,
        vendorNumber: party.vendorNumber,
        employeeId: party.employeeId,
        department: party.department,
        hireDate: party.hireDate ? new Date(party.hireDate).toISOString().split('T')[0] : undefined,
      });
      setPartyType(party.partyType);
    }
  }, [party, reset]);

  const onSubmit = async (data: PartyFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutate(data);
      } else {
        await createMutation.mutate(data);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save party:', error);
    }
  };

  const isLoading = createMutation.loading || updateMutation.loading;
  const error = createMutation.error || updateMutation.error;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md mr-2">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Party' : 'Create New Party'}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {isEditing ? 'Update party information' : 'Add a new customer, vendor, or employee'}
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-xs text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="partyType" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Party Type *
          </label>
          <select
            id="partyType"
            {...register('partyType', { required: 'Party type is required' })}
            onChange={(e) => {
              setValue('partyType', e.target.value as 'customer' | 'vendor' | 'employee');
              setPartyType(e.target.value as 'customer' | 'vendor' | 'employee');
            }}
            disabled={isEditing}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          >
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="employee">Employee</option>
          </select>
          {errors.partyType && (
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.partyType.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { 
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter party name"
            />
            {errors.name && (
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="code" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code *
            </label>
            <input
              type="text"
              id="code"
              {...register('code', { 
                required: 'Code is required',
                pattern: {
                  value: /^[A-Z0-9-]+$/,
                  message: 'Code must contain only uppercase letters, numbers, and hyphens'
                }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder={partyType === 'customer' ? 'e.g., CUST-001' : partyType === 'vendor' ? 'e.g., VEND-001' : 'e.g., EMP-001'}
            />
            {errors.code && (
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.code.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register('email', {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address'
                }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter email (optional)"
            />
            {errors.email && (
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="text"
              id="phone"
              {...register('phone')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter phone (optional)"
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Address
          </label>
          <input
            type="text"
            id="address"
            {...register('address')}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter address (optional)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="city" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              {...register('city')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="City"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              State
            </label>
            <input
              type="text"
              id="state"
              {...register('state')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="State"
            />
          </div>

          <div>
            <label htmlFor="zipCode" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Zip Code
            </label>
            <input
              type="text"
              id="zipCode"
              {...register('zipCode')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Zip Code"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="country" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country
            </label>
            <input
              type="text"
              id="country"
              {...register('country')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Country"
            />
          </div>

          <div>
            <label htmlFor="taxId" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tax ID
            </label>
            <input
              type="text"
              id="taxId"
              {...register('taxId')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Tax ID (optional)"
            />
          </div>
        </div>

        {/* Customer-specific fields */}
        {partyType === 'customer' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div>
              <label htmlFor="paymentTerms" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                id="paymentTerms"
                {...register('paymentTerms')}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Net 30, Net 60"
              />
            </div>

            <div>
              <label htmlFor="creditLimit" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credit Limit
              </label>
              <input
                type="number"
                id="creditLimit"
                step="0.01"
                {...register('creditLimit', {
                  min: { value: 0, message: 'Credit limit must be positive' }
                })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
              />
              {errors.creditLimit && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.creditLimit.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Vendor-specific fields */}
        {partyType === 'vendor' && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div>
              <label htmlFor="vendorNumber" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vendor Number
              </label>
              <input
                type="text"
                id="vendorNumber"
                {...register('vendorNumber')}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Vendor-specific identifier (optional)"
              />
            </div>
          </div>
        )}

        {/* Employee-specific fields */}
        {partyType === 'employee' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div>
              <label htmlFor="employeeId" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                id="employeeId"
                {...register('employeeId')}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Employee ID (optional)"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <input
                type="text"
                id="department"
                {...register('department')}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Department (optional)"
              />
            </div>

            <div>
              <label htmlFor="hireDate" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hire Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="hireDate"
                  {...register('hireDate')}
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isLoading ? 'Saving...' : isEditing ? 'Update Party' : 'Create Party'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PartyForm;

