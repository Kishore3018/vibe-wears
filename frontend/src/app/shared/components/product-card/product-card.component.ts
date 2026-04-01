import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductListItem } from '@core/services/product.service';
import { CartService } from '@core/services/cart.service';
import { AuthService } from '@core/services/auth.service';
import { WishlistService } from '@core/services/wishlist.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="product-card" (mouseenter)="showActions.set(true)" (mouseleave)="showActions.set(false)">
      <!-- Image -->
      <a [routerLink]="['/products', product.slug]" class="product-image">
        <img [src]="product.primary_image || 'https://via.placeholder.com/400x500'" [alt]="product.name">
        
        <!-- Badges -->
        <div class="badges">
          @if (product.is_new_arrival) {
            <span class="badge badge-new">New</span>
          }
          @if (product.compare_price && product.compare_price > product.price) {
            <span class="badge badge-sale">{{ discountPercent }}% Off</span>
          }
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions" [class.visible]="showActions()">
          <button class="action-btn" (click)="addToCart($event)" title="Add to Cart">
            <span class="material-icons-outlined">shopping_bag</span>
          </button>
          <button class="action-btn wishlist-btn" [class.in-wishlist]="isInWishlist()" (click)="toggleWishlist($event)" [title]="isInWishlist() ? 'Remove from Wishlist' : 'Add to Wishlist'">
            <span class="material-icons">{{ isInWishlist() ? 'favorite' : 'favorite_border' }}</span>
          </button>
          <button class="action-btn" [routerLink]="['/products', product.slug]" title="Quick View">
            <span class="material-icons-outlined">visibility</span>
          </button>
        </div>
      </a>

      <!-- Info -->
      <div class="product-info">
        <a [routerLink]="['/products', product.slug]" class="product-name">{{ product.name }}</a>
        
        <!-- Rating -->
        @if (product.total_reviews > 0) {
          <div class="product-rating">
            <div class="stars">
              @for (star of [1,2,3,4,5]; track star) {
                <span class="material-icons" [class.filled]="star <= product.average_rating">
                  {{ star <= product.average_rating ? 'star' : 'star_border' }}
                </span>
              }
            </div>
            <span class="review-count">({{ product.total_reviews }})</span>
          </div>
        }

        <!-- Price -->
        <div class="product-price">
          <span class="current-price">₹{{ product.price | number:'1.0-0' }}</span>
          @if (product.compare_price && product.compare_price > product.price) {
            <span class="original-price">₹{{ product.compare_price | number:'1.0-0' }}</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-card {
      position: relative;
      background-color: var(--bg-primary);
      overflow: hidden;
      transition: var(--transition);
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--surface-card-border);

      &:hover {
        box-shadow: var(--shadow-lg);

        .product-image img {
          transform: scale(1.05);
        }

        .quick-actions {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    }

    .product-image {
      display: block;
      position: relative;
      aspect-ratio: 3/4;
      overflow: hidden;
      background: var(--bg-secondary);
      border-top-left-radius: var(--border-radius-lg);
      border-top-right-radius: var(--border-radius-lg);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }

    .badges {
      position: absolute;
      top: 1rem;
      left: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .badge {
      padding: 0.4rem 0.75rem;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-radius: 0;
    }

    .badge-new {
      background: var(--accent-color);
      color: var(--primary-color);
    }

    .badge-sale {
      background: var(--primary-color);
      color: var(--accent-color);
    }

    .quick-actions {
      position: absolute;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      display: flex;
      gap: 0.5rem;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

      &.visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: var(--transition);

      .material-icons-outlined, .material-icons {
        font-size: 1.15rem;
        color: var(--text-primary);
      }

      &:hover {
        background: var(--accent-color);
        border-color: var(--accent-color);

        .material-icons-outlined, .material-icons {
          color: var(--primary-color);
        }
      }
      
      &.wishlist-btn.in-wishlist {
        background: var(--accent-color);
        border-color: var(--accent-color);
        
        .material-icons {
          color: var(--primary-color);
        }
      }
    }

    .product-info {
      padding: 1.25rem 0.5rem;
      border-bottom-left-radius: var(--border-radius-lg);
      border-bottom-right-radius: var(--border-radius-lg);
    }

    .product-name {
      display: block;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      letter-spacing: 0.5px;

      &:hover {
        color: var(--accent-color);
      }
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .stars {
      display: flex;
      gap: 2px;

      .material-icons {
        font-size: 0.9rem;
        color: var(--border-color);

        &.filled {
          color: var(--accent-color);
        }
      }
    }

    .review-count {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.7rem;
      color: var(--text-secondary);
      letter-spacing: 0.5px;
    }

    .product-price {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .current-price {
      font-family: 'Montserrat', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      letter-spacing: 0.5px;
    }

    .original-price {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.85rem;
      font-weight: 400;
      color: var(--text-secondary);
      text-decoration: line-through;
    }

    @media (max-width: 576px) {
      .quick-actions {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      .action-btn {
        width: 38px;
        height: 38px;

        .material-icons-outlined {
          font-size: 1rem;
        }
      }

      .product-info {
        padding: 1rem 0.25rem;
      }

      .product-name {
        font-size: 1rem;
      }
    }
  `]
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductListItem;
  
  showActions = signal(false);

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private wishlistService: WishlistService,
    private router: Router
  ) {}
  
  // Method to check if product is in wishlist (works better with non-signal inputs)
  isInWishlist(): boolean {
    return this.product ? this.wishlistService.wishlistIds().has(this.product.id) : false;
  }

  get discountPercent(): number {
    if (!this.product.compare_price || this.product.compare_price <= this.product.price) {
      return 0;
    }
    return Math.round((1 - this.product.price / this.product.compare_price) * 100);
  }

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.cartService.addToCart(this.product.id).subscribe({
      next: () => {
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        console.error('Failed to add to cart', err);
      }
    });
  }

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.wishlistService.toggleWishlist(this.product.id, this.product.name).subscribe({
      error: (err) => {
        console.error('Failed to update wishlist', err);
      }
    });
  }
}
