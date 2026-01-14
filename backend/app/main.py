"""
FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import (
    materials_router,
    products_router,
    bom_router,
    hpp_router,
    marketplaces_router,
    stores_router,
    store_products_router,
    discounts_router,
    marketplace_cost_types_router,
    store_marketplace_costs_router,
    pricing_router,
    ads_router,
    decision_router
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Marketplace Tool API",
    description="API untuk HPP, Pricing, Ads Analysis, Reverse Pricing, dan Grading",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(materials_router)
app.include_router(products_router)
app.include_router(bom_router)
app.include_router(hpp_router)
app.include_router(marketplaces_router)
app.include_router(stores_router)
app.include_router(store_products_router)
app.include_router(discounts_router)
app.include_router(marketplace_cost_types_router)
app.include_router(store_marketplace_costs_router)
app.include_router(pricing_router)
app.include_router(ads_router)
app.include_router(decision_router)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Marketplace Tool API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
