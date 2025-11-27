import { API_BASE_URL } from "../utils/api";

// Helper function to make authenticated API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Request failed");
  }

  return response.json();
};

// Accounting API
export const accountingApi = {
  getTrialBalance: async (params?: {
    asOfDate?: string;
    companyId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.asOfDate) queryParams.append("asOfDate", params.asOfDate);
    if (params?.companyId) queryParams.append("companyId", params.companyId);
    const query = queryParams.toString();
    return apiCall(`/accounting/trial-balance${query ? `?${query}` : ""}`);
  },

  getAccountBalance: async (
    accountCode: string,
    params?: { asOfDate?: string; companyId?: string }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.asOfDate) queryParams.append("asOfDate", params.asOfDate);
    if (params?.companyId) queryParams.append("companyId", params.companyId);
    const query = queryParams.toString();
    return apiCall(
      `/accounting/accounts/${accountCode}/balance${query ? `?${query}` : ""}`
    );
  },

  getAccountJournalEntries: async (
    accountCode: string,
    params?: {
      startDate?: string;
      endDate?: string;
      companyId?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.companyId) queryParams.append("companyId", params.companyId);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const query = queryParams.toString();
    return apiCall(
      `/accounting/accounts/${accountCode}/entries${query ? `?${query}` : ""}`
    );
  },

  getChartOfAccounts: async (params?: {
    category?: string;
    isActive?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append("category", params.category);
    if (params?.isActive !== undefined)
      queryParams.append("isActive", params.isActive.toString());
    const query = queryParams.toString();
    return apiCall(`/accounting/chart-of-accounts${query ? `?${query}` : ""}`);
  },

  getChartOfAccountById: async (id: string) => {
    return apiCall(`/accounting/chart-of-accounts/${id}`);
  },

  createChartOfAccount: async (data: {
    accountCode: string;
    accountName: string;
    category: string;
    accountType: string;
    parentId?: string;
    isActive?: boolean;
  }) => {
    return apiCall("/accounting/chart-of-accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateChartOfAccount: async (
    id: string,
    data: {
      accountCode?: string;
      accountName?: string;
      category?: string;
      accountType?: string;
      parentId?: string;
      isActive?: boolean;
    }
  ) => {
    return apiCall(`/accounting/chart-of-accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteChartOfAccount: async (id: string) => {
    return apiCall(`/accounting/chart-of-accounts/${id}`, {
      method: "DELETE",
    });
  },

  getJournalEntries: async (params?: {
    startDate?: string;
    endDate?: string;
    companyId?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.companyId) queryParams.append("companyId", params.companyId);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const query = queryParams.toString();
    return apiCall(`/accounting/journal-entries${query ? `?${query}` : ""}`);
  },

  getJournalEntryById: async (id: string) => {
    return apiCall(`/accounting/journal-entries/${id}`);
  },

  createJournalEntry: async (data: {
    date: string;
    description: string;
    companyId?: string;
    lines: Array<{
      accountCode: string;
      debit: number;
      credit: number;
      description?: string;
    }>;
  }) => {
    return apiCall("/accounting/journal-entries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteJournalEntry: async (id: string) => {
    return apiCall(`/accounting/journal-entries/${id}`, {
      method: "DELETE",
    });
  },
};

// Party API
export const partyApi = {
  getParties: async (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    partyType?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.isActive !== undefined)
      queryParams.append("isActive", params.isActive.toString());
    if (params?.partyType) queryParams.append("partyType", params.partyType);
    const query = queryParams.toString();
    return apiCall(`/parties${query ? `?${query}` : ""}`);
  },

  getPartyById: async (id: string) => {
    return apiCall(`/parties/${id}`);
  },

  createParty: async (data: {
    partyType: string;
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
  }) => {
    return apiCall("/parties", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateParty: async (
    id: string,
    data: {
      name?: string;
      code?: string;
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
      isActive?: boolean;
    }
  ) => {
    return apiCall(`/parties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteParty: async (id: string) => {
    return apiCall(`/parties/${id}`, {
      method: "DELETE",
    });
  },

  getPartyStatement: async (
    id: string,
    params?: {
      fromDate?: string;
      toDate?: string;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append("fromDate", params.fromDate);
    if (params?.toDate) queryParams.append("toDate", params.toDate);
    const query = queryParams.toString();
    return apiCall(`/parties/${id}/statement${query ? `?${query}` : ""}`);
  },
};

// Company API (placeholder - you may need to create company routes)
export const companyApi = {
  getCompanies: async (params?: { limit?: number; page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    const query = queryParams.toString();
    // Note: This endpoint may need to be created in the backend
    return apiCall(`/companies${query ? `?${query}` : ""}`).catch(() => {
      // Return empty array if companies endpoint doesn't exist yet
      return { companies: [] };
    });
  },
};
