import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';

export interface ProductImage {
  id: number;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string | null;
  size: string | null;
  color: string | null;
  color_code: string | null;
  price_modifier: number;
  quantity: number;
  image_url: string | null;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  is_active: boolean;
  sort_order: number;
  subcategories: Category[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_price: number | null;
  sku: string | null;
  quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  brand: string | null;
  material: string | null;
  care_instructions: string | null;
  average_rating: number;
  total_reviews: number;
  total_sold: number;
  created_at: string;
  updated_at: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  categories: Category[];
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  price: number;
  compare_price: number | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  average_rating: number;
  total_reviews: number;
  primary_image: string | null;
}

export interface ProductListResponse {
  items: ProductListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ProductFilters {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  brand?: string;
  sort_by?: 'newest' | 'price_low' | 'price_high' | 'popular' | 'rating';
  is_featured?: boolean;
  is_new_arrival?: boolean;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export interface VirtualTryOnResponse {
  success: boolean;
  result_url: string;
  provider: string;
  model: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;
  
  // Signals for reactive state
  private productsSignal = signal<ProductListItem[]>([]);
  private loadingSignal = signal<boolean>(false);
  private totalSignal = signal<number>(0);
  private currentPageSignal = signal<number>(1);
  private totalPagesSignal = signal<number>(1);
  
  // Readonly accessors
  readonly products = this.productsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly total = this.totalSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly totalPages = this.totalPagesSignal.asReadonly();

  constructor(private http: HttpClient) {}

  getProducts(filters: ProductFilters = {}): Observable<ProductListResponse> {
    this.loadingSignal.set(true);
    
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    
    return this.http.get<ProductListResponse>(`${this.apiUrl}/products`, { params }).pipe(
      tap(response => {
        this.productsSignal.set(response.items);
        this.totalSignal.set(response.total);
        this.currentPageSignal.set(response.page);
        this.totalPagesSignal.set(response.total_pages);
        this.loadingSignal.set(false);
      })
    );
  }

  getProduct(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${slug}`);
  }

  getFeaturedProducts(limit: number = 8): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>(`${this.apiUrl}/products/featured`, {
      params: { limit: limit.toString() }
    });
  }

  getNewArrivals(limit: number = 8): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>(`${this.apiUrl}/products/new-arrivals`, {
      params: { limit: limit.toString() }
    });
  }

  getBestSellers(limit: number = 8): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>(`${this.apiUrl}/products/best-sellers`, {
      params: { limit: limit.toString() }
    });
  }

  getProductReviews(productId: number, page: number = 1, perPage: number = 10): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/products/${productId}/reviews`, {
      params: { page: page.toString(), per_page: perPage.toString() }
    });
  }

  createReview(productId: number, rating: number, title?: string, comment?: string): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/products/${productId}/reviews`, {
      product_id: productId,
      rating,
      title,
      comment
    });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`, {
      params: { parent_only: 'true', include_subcategories: 'true' }
    });
  }

  getCategory(slug: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${slug}`);
  }

  generateVirtualTryOn(personImage: File, garmentImageUrl: string, productName?: string): Observable<VirtualTryOnResponse> {
    const formData = new FormData();
    formData.append('person_image', personImage);
    formData.append('garment_image_url', garmentImageUrl);
    if (productName) {
      formData.append('product_name', productName);
    }

    return this.http.post<VirtualTryOnResponse>(`${this.apiUrl}/ai/virtual-tryon`, formData);
  }
}
