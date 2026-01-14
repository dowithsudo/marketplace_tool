import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

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

export const marketplacesApi = {
  getAll: () => api.get("/marketplaces"),
  create: (data) => api.post("/marketplaces", data),
  delete: (id) => api.delete(`/marketplaces/${id}`),
};

export const storesApi = {
  getAll: (marketplaceId) =>
    api.get("/stores", { params: { marketplace_id: marketplaceId } }),
  create: (data) => api.post("/stores", data),
  delete: (id) => api.delete(`/stores/${id}`),
};

export const storeProductsApi = {
  getAll: (params) => api.get("/store-products", { params }),
  create: (data) => api.post("/store-products", data),
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
  delete: (id) => api.delete(`/marketplace-cost-types/${id}`),
};

export const storeMarketplaceCostsApi = {
  getAll: (storeId) =>
    api.get("/store-marketplace-costs", { params: { store_id: storeId } }),
  create: (data) => api.post("/store-marketplace-costs", data),
  delete: (id) => api.delete(`/store-marketplace-costs/${id}`),
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

export default api;
