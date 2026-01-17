import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email, password) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);
    return api.post("/auth/token", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, new_password: newPassword }),
  changePassword: (oldPassword, newPassword) =>
    api.post("/auth/change-password", {
      old_password: oldPassword,
      new_password: newPassword,
    }),
};

export const materialsApi = {
  getAll: () => api.get("/materials"),
  getById: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post("/materials", data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
};

export const productsApi = {
  getAll: () => api.get("/products"),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const bomApi = {
  getByProduct: (productId) => api.get(`/bom/${productId}`),
  create: (data) => api.post("/bom", data),
  update: (id, data) => api.put(`/bom/${id}`, data),
  delete: (id) => api.delete(`/bom/${id}`),
};

export const hppApi = {
  calculate: (productId) => api.get(`/hpp/${productId}`),
};

export const extraCostsApi = {
  getByProduct: (productId) => api.get(`/extra-costs/${productId}`),
  create: (data) => api.post("/extra-costs", data),
  update: (id, data) => api.put(`/extra-costs/${id}`, data),
  delete: (id) => api.delete(`/extra-costs/${id}`),
};

export const marketplacesApi = {
  getAll: () => api.get("/marketplaces"),
  create: (data) => api.post("/marketplaces", data),
  update: (id, data) => api.put(`/marketplaces/${id}`, data),
  delete: (id) => api.delete(`/marketplaces/${id}`),
};

export const storesApi = {
  getAll: (marketplaceId) =>
    api.get("/stores", { params: { marketplace_id: marketplaceId } }),
  create: (data) => api.post("/stores", data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`),
};

export const storeProductsApi = {
  getAll: (params) => api.get("/store-products", { params }),
  create: (data) => api.post("/store-products", data),
  update: (id, data) => api.put(`/store-products/${id}`, data),
  delete: (id) => api.delete(`/store-products/${id}`),
};

export const pricingApi = {
  calculate: (storeProductId) =>
    api.post("/pricing/calc", { store_product_id: storeProductId }),
  reverse: (data) => api.post("/pricing/reverse", data),
};

export const adsApi = {
  getAll: (params) => api.get("/ads", { params }),
  create: (data) => api.post("/ads", data),
  delete: (id) => api.delete(`/ads/${id}`),
};

export const marketplaceCostTypesApi = {
  getAll: () => api.get("/marketplace-cost-types"),
  create: (data) => api.post("/marketplace-cost-types", data),
  update: (id, data) => api.put(`/marketplace-cost-types/${id}`, data),
  delete: (id) => api.delete(`/marketplace-cost-types/${id}`),
};

export const storeProductMarketplaceCostsApi = {
  getAll: (storeProductId) =>
    api.get("/store-product-marketplace-costs", {
      params: { store_product_id: storeProductId },
    }),
  create: (data) => api.post("/store-product-marketplace-costs", data),
  update: (id, data) => api.put(`/store-product-marketplace-costs/${id}`, data),
  delete: (id) => api.delete(`/store-product-marketplace-costs/${id}`),
};

export const discountsApi = {
  getAll: (storeProductId) =>
    api.get("/discounts", { params: { store_product_id: storeProductId } }),
  create: (data) => api.post("/discounts", data),
  delete: (id) => api.delete(`/discounts/${id}`),
};

export const decisionApi = {
  get: (storeId, productId) => api.get(`/decision/${storeId}/${productId}`),
};

export const importsApi = {
  importShopeeSales: (storeId, file) => {
    const formData = new FormData();
    formData.append("store_id", storeId);
    formData.append("file", file);
    return api.post("/imports/shopee-sales", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  importShopeeProductSales: (storeId, file) => {
    const formData = new FormData();
    formData.append("store_id", storeId);
    formData.append("file", file);
    return api.post("/imports/shopee-products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getPerformance: (params) => api.get("/imports/performance", { params }),
  getReports: (params) => api.get("/imports/reports", { params }),
};

export default api;
