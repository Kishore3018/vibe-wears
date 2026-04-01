import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '@core/services/cart.service';
import { WishlistService, WishlistProduct } from '@core/services/wishlist.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="wishlist-page">
      <h2>My Wishlist</h2>
      <p class="subtitle">{{ wishlistService.count() }} items saved</p>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading wishlist...</p>
        </div>
      } @else if (wishlistService.wishlist().length === 0) {
        <div class="empty-wishlist">
          <span class="material-icons-outlined">favorite_border</span>
          <h3>Your Wishlist is Empty</h3>
          <p>Save items you love by clicking the heart icon on product pages.</p>
          <a routerLink="/products" class="btn btn-primary">Explore Products</a>
        </div>
      } @else {
        <div class="wishlist-grid">
          @for (item of wishlistService.wishlist(); track item.id) {
            <div class="wishlist-card">
              <button class="remove-btn" (click)="removeFromWishlist(item)">
                <span class="material-icons">close</span>
              </button>

              <a [routerLink]="['/product', item.slug]" class="product-image">
                <img [src]="item.primary_image || '/assets/images/placeholder.jpg'" [alt]="item.name">
                @if (item.quantity <= 0) {
                  <span class="out-of-stock-overlay">Out of Stock</span>
                }
              </a>

              <div class="product-info">
                <a [routerLink]="['/product', item.slug]" class="product-name">
                  {{ item.name }}
                </a>
                <div class="product-price">
                  @if (item.compare_price && item.compare_price > item.price) {
                    <span class="original-price">{{ item.compare_price | currency:'INR':'symbol':'1.0-0' }}</span>
                    <span class="sale-price">{{ item.price | currency:'INR':'symbol':'1.0-0' }}</span>
                  } @else {
                    <span>{{ item.price | currency:'INR':'symbol':'1.0-0' }}</span>
                  }
                </div>
                @if (item.brand) {
                  <span class="brand-name">{{ item.brand }}</span>
                }
              </div>

              <button 
                class="btn btn-primary w-full"
                [disabled]="item.quantity <= 0"
                (click)="addToCart(item)"
              >
                @if (item.quantity > 0) {
                  <span class="material-icons">shopping_cart</span>
                  Add to Cart
                } @else {
                  Out of Stock
                }
              </button>
            </div>
          }
        </div>

        <div class="wishlist-actions">
          <button class="btn btn-outline" (click)="clearWishlist()">
            <span class="material-icons">delete_sweep</span>
            Clear Wishlist
          </button>
          <button class="btn btn-primary" (click)="addAllToCart()">
            <span class="material-icons">add_shopping_cart</span>
            Add All to Cart
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .wishlist-page {
      h2 {
        margin-bottom: 0.25rem;
        color: #ffffff !important;
      }

      .subtitle {
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 2rem;
      }
    }

    .empty-wishlist {
      text-align: center;
      padding: 3rem;
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius-lg);

      .material-icons-outlined {
        font-size: 4rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }

      h3 { margin-bottom: 0.5rem; color: var(--text-primary); }
      p { color: var(--text-secondary); margin-bottom: 1.5rem; }
    }

    .wishlist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .wishlist-card {
      position: relative;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .remove-btn {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 32px;
      height: 32px;
      border: none;
      background-color: var(--bg-secondary);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
      transition: var(--transition);

      .material-icons {
        font-size: 1rem;
      }

      &:hover {
        background-color: rgba(239, 68, 68, 0.1);
        color: var(--error-color);
      }
    }

    .product-image {
      position: relative;
      aspect-ratio: 1;
      border-radius: var(--border-radius);
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      &:hover img {
        transform: scale(1.05);
      }
    }

    .out-of-stock-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .product-name {
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.4;

      &:hover {
        color: var(--accent-color);
      }
    }

    .product-price {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      span {
        color: var(--text-primary);
      }
    }

    .original-price {
      text-decoration: line-through;
      color: var(--text-secondary) !important;
      font-size: 0.9rem;
    }

    .sale-price {
      color: var(--error-color) !important;
      font-weight: 600;
    }

    .added-date {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .w-full {
      width: 100%;
    }

    .wishlist-card .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .wishlist-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);

      .btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-outline {
        color: var(--text-light);
        border-color: rgba(255, 255, 255, 0.3);

        &:hover {
          background-color: var(--text-light);
          color: var(--primary-color);
        }
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color);
        border-top-color: var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      p {
        margin-top: 1rem;
        color: var(--text-secondary);
      }
    }

    .brand-name {
      font-size: 0.75rem;
      color: var(--accent-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 576px) {
      .wishlist-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .wishlist-actions {
        flex-direction: column;
        gap: 1rem;

        .btn { width: 100%; justify-content: center; }
      }
    }
  `]
})
export class WishlistComponent implements OnInit {
  loading = signal<boolean>(false);
  
  wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.loading.set(true);
    this.wishlistService.loadWishlist().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  removeFromWishlist(item: WishlistProduct): void {
    this.wishlistService.removeFromWishlist(item.id).subscribe({
      error: (err) => {
        console.error('Failed to remove from wishlist:', err);
      }
    });
  }

  addToCart(item: WishlistProduct): void {
    if (item.quantity <= 0) return;
    
    this.cartService.addToCart(item.id, 1).subscribe({
      next: () => {
        // Optionally remove from wishlist after adding to cart
        this.wishlistService.removeFromWishlist(item.id).subscribe();
      },
      error: (err) => {
        console.error('Failed to add to cart:', err);
      }
    });
  }

  addAllToCart(): void {
    const inStockItems = this.wishlistService.wishlist().filter(item => item.quantity > 0);
    inStockItems.forEach(item => {
      this.cartService.addToCart(item.id, 1).subscribe();
    });
  }

  clearWishlist(): void {
    if (confirm('Are you sure you want to clear your wishlist?')) {
      this.wishlistService.clearWishlist().subscribe({
        error: (err) => {
          console.error('Failed to clear wishlist:', err);
        }
      });
    }
  }
}
