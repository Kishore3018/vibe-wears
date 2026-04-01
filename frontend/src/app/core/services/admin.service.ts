import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_users: number;
  pending_orders: number;
  low_stock_products: number;
  today_orders: number;
  today_revenue: number;
  monthly_revenue: number;
  monthly_orders: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: number;
  name: string;
  image_url: string | null;
  total_sold: number;
  revenue: number;
}

export interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminUser {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
  order_count?: number;
  total_spent?: number;
  wishlist_count?: number;
  last_login?: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_price: number | null;
  cost_price: number | null;
  sku: string | null;
  quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  brand: string | null;
  material: string | null;
  average_rating: number;
  total_sold: number;
  created_at: string;
  images: any[];
  categories: any[];
  variants: any[];
}

export interface AdminOrder {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  total: number;
  shipping_full_name: string;
  shipping_phone: string;
  shipping_address: string | {
    full_name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  tracking_number: string | null;
  carrier: string | null;
  admin_notes: string | null;
  estimated_delivery: string | null;
  is_approved: boolean;
  approved_at: string | null;
  created_at: string;
  user: AdminUser;
  items: any[];
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  is_active: boolean;
  is_featured?: boolean;
  sort_order: number;
  display_order?: number;
  product_count?: number;
  created_at: string;
}

export interface AdminCoupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  usage_limit_per_user: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminReview {
  id: number;
  product_id: number;
  product_name: string;
  user_email: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  getRevenueChart(days: number = 30): Observable<RevenueData[]> {
    return this.http.get<RevenueData[]>(`${this.apiUrl}/dashboard/revenue-chart`, {
      params: { days: days.toString() }
    });
  }

  getTopProducts(limit: number = 5): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.apiUrl}/dashboard/top-products`, {
      params: { limit: limit.toString() }
    });
  }

  getRecentOrders(limit: number = 10): Observable<RecentOrder[]> {
    return this.http.get<RecentOrder[]>(`${this.apiUrl}/dashboard/recent-orders`, {
      params: { limit: limit.toString() }
    });
  }

  getOrderStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/dashboard/order-stats`);
  }

  // Users
  getUsers(params: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    is_admin?: boolean;
  } = {}): Observable<PaginatedResponse<AdminUser>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<PaginatedResponse<AdminUser>>(`${this.apiUrl}/users`, { params: httpParams });
  }

  getUser(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${userId}`);
  }

  createUser(userData: any): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.apiUrl}/users`, userData);
  }

  updateUser(userId: number, userData: any): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/users/${userId}`, userData);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${userId}`);
  }

  // Products
  getProducts(params: {
    skip?: number;
    limit?: number;
    search?: string;
    category_id?: number;
    is_active?: boolean;
    is_featured?: boolean;
    low_stock?: boolean;
  } = {}): Observable<PaginatedResponse<AdminProduct>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<PaginatedResponse<AdminProduct>>(`${this.apiUrl}/products`, { params: httpParams });
  }

  getProduct(productId: number): Observable<AdminProduct> {
    return this.http.get<AdminProduct>(`${this.apiUrl}/products/${productId}`);
  }

  createProduct(productData: any): Observable<AdminProduct> {
    return this.http.post<AdminProduct>(`${this.apiUrl}/products`, productData);
  }

  updateProduct(productId: number, productData: any): Observable<AdminProduct> {
    return this.http.patch<AdminProduct>(`${this.apiUrl}/products/${productId}`, productData);
  }

  deleteProduct(productId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${productId}`);
  }

  addProductImage(productId: number, imageData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products/${productId}/images`, imageData);
  }

  deleteProductImage(productId: number, imageId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${productId}/images/${imageId}`);
  }

  addProductVariant(productId: number, variantData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products/${productId}/variants`, variantData);
  }

  updateProductVariant(productId: number, variantId: number, variantData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/products/${productId}/variants/${variantId}`, variantData);
  }

  deleteProductVariant(productId: number, variantId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${productId}/variants/${variantId}`);
  }

  // Orders
  getOrders(params: {
    skip?: number;
    limit?: number;
    status?: string;
    payment_status?: string;
    is_approved?: boolean;
    search?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Observable<PaginatedResponse<AdminOrder>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<PaginatedResponse<AdminOrder>>(`${this.apiUrl}/orders`, { params: httpParams });
  }

  getOrder(orderId: number): Observable<AdminOrder> {
    return this.http.get<AdminOrder>(`${this.apiUrl}/orders/${orderId}`);
  }

  updateOrderStatus(orderId: number, statusData: {
    status: string;
    tracking_number?: string;
    carrier?: string;
    admin_notes?: string;
  }): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(`${this.apiUrl}/orders/${orderId}/status`, statusData);
  }

  updatePaymentStatus(orderId: number, paymentStatus: string): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(`${this.apiUrl}/orders/${orderId}/payment`, null, {
      params: { payment_status: paymentStatus }
    });
  }

  updateOrder(orderId: number, data: any): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(`${this.apiUrl}/orders/${orderId}`, data);
  }

  approveOrder(orderId: number): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(`${this.apiUrl}/orders/${orderId}/approve`, {});
  }

  rejectOrder(orderId: number): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(`${this.apiUrl}/orders/${orderId}/reject`, {});
  }

  // Categories
  getCategories(params: {
    skip?: number;
    limit?: number;
    include_inactive?: boolean;
  } = {}): Observable<{ items: AdminCategory[]; total: number }> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<{ items: AdminCategory[]; total: number }>(`${this.apiUrl}/categories`, { params: httpParams });
  }

  createCategory(categoryData: any): Observable<AdminCategory> {
    return this.http.post<AdminCategory>(`${this.apiUrl}/categories`, categoryData);
  }

  updateCategory(categoryId: number, categoryData: any): Observable<AdminCategory> {
    return this.http.patch<AdminCategory>(`${this.apiUrl}/categories/${categoryId}`, categoryData);
  }

  deleteCategory(categoryId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/categories/${categoryId}`);
  }

  // Coupons
  getCoupons(params: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  } = {}): Observable<PaginatedResponse<AdminCoupon>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<PaginatedResponse<AdminCoupon>>(`${this.apiUrl}/coupons`, { params: httpParams });
  }

  createCoupon(couponData: any): Observable<AdminCoupon> {
    return this.http.post<AdminCoupon>(`${this.apiUrl}/coupons`, couponData);
  }

  updateCoupon(couponId: number, couponData: any): Observable<AdminCoupon> {
    return this.http.patch<AdminCoupon>(`${this.apiUrl}/coupons/${couponId}`, couponData);
  }

  deleteCoupon(couponId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/coupons/${couponId}`);
  }

  // Reviews
  getReviews(params: {
    skip?: number;
    limit?: number;
    is_approved?: boolean;
    product_id?: number;
  } = {}): Observable<PaginatedResponse<AdminReview>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<PaginatedResponse<AdminReview>>(`${this.apiUrl}/reviews`, { params: httpParams });
  }

  approveReview(reviewId: number, isApproved: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/reviews/${reviewId}/approve`, null, {
      params: { is_approved: isApproved.toString() }
    });
  }

  deleteReview(reviewId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/reviews/${reviewId}`);
  }
}
