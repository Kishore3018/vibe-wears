import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';

export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    compare_price: number | null;
    primary_image: string | null;
  };
  variant: {
    id: number;
    size: string | null;
    color: string | null;
    color_code: string | null;
    price_modifier: number;
    image_url: string | null;
  } | null;
}

export interface Cart {
  id: number | null;
  items: CartItem[];
  subtotal: number;
  total_items: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;
  
  // Signals for reactive state
  private cartSignal = signal<Cart>({ id: null, items: [], subtotal: 0, total_items: 0 });
  private loadingSignal = signal<boolean>(false);
  
  // Computed values
  readonly cart = this.cartSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly itemCount = computed(() => this.cartSignal().total_items);
  readonly subtotal = computed(() => this.cartSignal().subtotal);
  readonly items = computed(() => this.cartSignal().items);
  readonly isEmpty = computed(() => this.cartSignal().items.length === 0);

  constructor(private http: HttpClient) {}

  loadCart(): Observable<Cart> {
    this.loadingSignal.set(true);
    
    return this.http.get<Cart>(`${this.apiUrl}/cart`).pipe(
      tap(cart => {
        this.cartSignal.set(cart);
        this.loadingSignal.set(false);
      })
    );
  }

  addToCart(productId: number, quantity: number = 1, variantId?: number): Observable<any> {
    this.loadingSignal.set(true);
    
    const body: any = { product_id: productId, quantity };
    if (variantId) {
      body.variant_id = variantId;
    }
    
    return this.http.post(`${this.apiUrl}/cart/items`, body).pipe(
      tap(() => {
        this.loadCart().subscribe();
      })
    );
  }

  updateQuantity(itemId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/cart/items/${itemId}`, { quantity }).pipe(
      tap(() => {
        this.loadCart().subscribe();
      })
    );
  }

  removeItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cart/items/${itemId}`).pipe(
      tap(() => {
        this.loadCart().subscribe();
      })
    );
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cart`).pipe(
      tap(() => {
        this.resetCartState();
      })
    );
  }

  resetCartState(): void {
    this.cartSignal.set({ id: null, items: [], subtotal: 0, total_items: 0 });
    this.loadingSignal.set(false);
  }

  getItemPrice(item: CartItem): number {
    const basePrice = item.product.price;
    const modifier = item.variant?.price_modifier || 0;
    return basePrice + modifier;
  }

  getItemTotal(item: CartItem): number {
    return this.getItemPrice(item) * item.quantity;
  }
}
