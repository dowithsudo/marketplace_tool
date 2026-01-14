"""
API Routers
"""
from .auth import router as auth_router
from .materials import router as materials_router
from .products import router as products_router
from .bom import router as bom_router
from .hpp import router as hpp_router
from .marketplaces import router as marketplaces_router
from .stores import router as stores_router
from .store_products import router as store_products_router
from .discounts import router as discounts_router
from .marketplace_cost_types import router as marketplace_cost_types_router
from .store_marketplace_costs import router as store_marketplace_costs_router
from .pricing import router as pricing_router
from .ads import router as ads_router
from .decision import router as decision_router

__all__ = [
    "auth_router",
    "materials_router",
    "products_router",
    "bom_router",
    "hpp_router",
    "marketplaces_router",
    "stores_router",
    "store_products_router",
    "discounts_router",
    "marketplace_cost_types_router",
    "store_marketplace_costs_router",
    "pricing_router",
    "ads_router",
    "decision_router"
]
