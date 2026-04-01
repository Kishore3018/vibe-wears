import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, Subject } from 'rxjs';
import { environment } from '@env/environment';

export interface WishlistProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_price: number | null;
  quantity: number;
  is_active: boolean;
  is_featured: boolean;
  brand: string;
  average_rating: number;
  total_reviews: number;
  primary_image: string | null;
  images: any[];
  categories: any[];
}

export interface WishlistEvent {
  action: 'added' | 'removed';
  productId: number;
  productName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = environment.apiUrl;
  
  // Signals for reactive state
  private wishlistSignal = signal<WishlistProduct[]>([]);
  private loadingSignal = signal<boolean>(false);
  
  // Event emitter for wishlist changes
  private wishlistEventSubject = new Subject<WishlistEvent>();
  readonly wishlistEvent$ = this.wishlistEventSubject.asObservable();
  
  // Computed values
  readonly wishlist = this.wishlistSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly count = computed(() => this.wishlistSignal().length);
  readonly wishlistIds = computed(() => new Set(this.wishlistSignal().map(p => p.id)));
  
  constructor(private http: HttpClient) {}
  
  loadWishlist(): Observable<WishlistProduct[]> {
    this.loadingSignal.set(true);
    return this.http.get<WishlistProduct[]>(`${this.apiUrl}/wishlist`).pipe(
      tap(items => {
        this.wishlistSignal.set(items);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        console.error('Error loading wishlist:', error);
        return of([]);
      })
    );
  }
  
  addToWishlist(productId: number, productName?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/wishlist/items/${productId}`, {}).pipe(
      tap(() => {
        this.loadWishlist().subscribe();
        this.wishlistEventSubject.next({ action: 'added', productId, productName });
      })
    );
  }
  
  removeFromWishlist(productId: number, productName?: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/wishlist/items/${productId}`).pipe(
      tap(() => {
        this.wishlistSignal.update(items => items.filter(item => item.id !== productId));
        this.wishlistEventSubject.next({ action: 'removed', productId, productName });
      })
    );
  }
  
  clearWishlist(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/wishlist`).pipe(
      tap(() => {
        this.wishlistSignal.set([]);
      })
    );
  }
  
  isInWishlist(productId: number): boolean {
    return this.wishlistSignal().some(item => item.id === productId);
  }
  
  checkWishlist(productId: number): Observable<{product_id: number, in_wishlist: boolean}> {
    return this.http.get<{product_id: number, in_wishlist: boolean}>(
      `${this.apiUrl}/wishlist/check/${productId}`
    );
  }
  
  toggleWishlist(productId: number, productName?: string): Observable<any> {
    if (this.isInWishlist(productId)) {
      return this.removeFromWishlist(productId, productName);
    } else {
      return this.addToWishlist(productId, productName);
    }
  }
}
