import { NextRequest } from "next/server"
import { requireAuth } from '@/middleware/auth'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

interface MarketplaceProduct {
  id: string
  title: string
  description: string
  price: number
  category: string
  brand?: string
  condition: string
  images: string[]
  location: string
  contactInfo: string
  owner_id: string
  owner_name: string
  status: string
  created_at: string
}

// Mock marketplace products storage (in real app, this would be a database)
let marketplaceProducts: MarketplaceProduct[] = [
  {
    id: "user_prod_001",
    title: "Vintage MacBook Pro 2015",
    description: "Guter Zustand, alle Ports funktionieren",
    price: 45000, // in cents
    category: "Laptops",
    brand: "Apple",
    condition: "good",
    images: [],
    location: "Zürich",
    contactInfo: "",
    owner_id: "user_123",
    owner_name: "Anna Müller",
    status: "published",
    created_at: new Date().toISOString()
  },
  {
    id: "user_prod_002",
    title: "Gaming Maus Logitech G305",
    description: "Wireless, kaum benutzt",
    price: 2500,
    category: "Zubehör",
    brand: "Logitech",
    condition: "excellent",
    images: [],
    location: "Bern",
    contactInfo: "",
    owner_id: "user_456",
    owner_name: "Max Weber",
    status: "published",
    created_at: new Date().toISOString()
  }
];

// GET /api/marketplace/products - Get all marketplace products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    let filteredProducts = [...marketplaceProducts];

    // Apply filters
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    if (location) {
      filteredProducts = filteredProducts.filter(p =>
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    if (minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price >= parseInt(minPrice));
    }
    if (maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price <= parseInt(maxPrice));
    }

    return apiSuccess({
      products: filteredProducts,
      total: filteredProducts.length
    });
  } catch (error) {
    return apiError(error, "Failed to fetch products");
  }
}

// POST /api/marketplace/products - Create new marketplace product
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    const productData = await request.json()

    // Validate required fields
    const requiredFields = ['title', 'description', 'price', 'category', 'condition', 'location']
    for (const field of requiredFields) {
      if (!productData[field]) {
        return apiBadRequest(`${field} is required`);
      }
    }

    // Create new product
    const newProduct: MarketplaceProduct = {
      id: `user_prod_${Date.now()}`,
      ...productData,
      owner_id: user.id,
      owner_name: user.name || user.email || '',
      status: "published", // Auto-publish user listings
      created_at: new Date().toISOString()
    };

    marketplaceProducts.push(newProduct);

    return apiSuccess(newProduct, undefined, 201);
  } catch (error) {
    return apiError(error, "Failed to create product");
  }
}



