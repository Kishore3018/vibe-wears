import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';

export interface Address {
  id: number;
  user_id: number;
  address_type: string;
  full_name: string;
  phone: string;
  street_address: string;
  apartment?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface AddressCreate {
  address_type?: string;
  full_name: string;
  phone: string;
  street_address: string;
  apartment?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  is_default?: boolean;
}

export interface OrderItem {
  id: number;
  product_name: string;
  variant_info?: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  coupon_code?: string;
  shipping_full_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  customer_notes?: string;
  is_approved: boolean;
  approved_at?: string;
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface OrderCreate {
  shipping_address_id: number;
  billing_address_id?: number;
  payment_method?: string;
  coupon_code?: string;
  customer_notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;
  
  // Signals for reactive state
  private ordersSignal = signal<Order[]>([]);
  private loadingSignal = signal<boolean>(false);
  private currentOrderSignal = signal<Order | null>(null);
  
  // Public readonly signals
  readonly orders = this.ordersSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly currentOrder = this.currentOrderSignal.asReadonly();

  constructor(private http: HttpClient) {}

  // Address API calls
  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/addresses`);
  }

  createAddress(address: AddressCreate): Observable<Address> {
    return this.http.post<Address>(`${this.apiUrl}/addresses`, address);
  }

  updateAddress(id: number, address: Partial<AddressCreate>): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/addresses/${id}`, address);
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/addresses/${id}`);
  }

  setDefaultAddress(id: number): Observable<Address> {
    return this.http.post<Address>(`${this.apiUrl}/addresses/${id}/set-default`, {});
  }

  // Order API calls
  getOrders(page: number = 1, perPage: number = 10): Observable<Order[]> {
    this.loadingSignal.set(true);
    return this.http.get<Order[]>(`${this.apiUrl}/orders`, {
      params: { page: page.toString(), per_page: perPage.toString() }
    }).pipe(
      tap(orders => {
        this.ordersSignal.set(orders);
        this.loadingSignal.set(false);
      })
    );
  }

  getOrder(orderNumber: string): Observable<Order> {
    this.loadingSignal.set(true);
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderNumber}`).pipe(
      tap(order => {
        this.currentOrderSignal.set(order);
        this.loadingSignal.set(false);
      })
    );
  }

  createOrder(orderData: OrderCreate): Observable<Order> {
    this.loadingSignal.set(true);
    return this.http.post<Order>(`${this.apiUrl}/orders`, orderData).pipe(
      tap(order => {
        this.currentOrderSignal.set(order);
        this.loadingSignal.set(false);
      })
    );
  }

  cancelOrder(orderNumber: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders/${orderNumber}/cancel`, {});
  }

  // Track order by order number and email (public - no auth required)
  trackOrder(orderNumber: string, email: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders/track`, {
      order_number: orderNumber,
      email: email
    });
  }

  // Helper to clear current order
  clearCurrentOrder(): void {
    this.currentOrderSignal.set(null);
  }
}
