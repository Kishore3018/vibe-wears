import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface QuickViewProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  images: string[];
  sizes?: string[];
  colors?: string[];
  stock: number;
  rating?: number;
  reviews_count?: number;
}

@Component({
  selector: 'app-quick-view-modal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ]),
    trigger('slideUp', [
      state('void', style({ transform: 'translateY(30px) scale(0.95)', opacity: 0 })),
      state('*', style({ transform: 'translateY(0) scale(1)', opacity: 1 })),
      transition('void => *', animate('400ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ])
  ],
  template: `
    @if (isOpen && product) {
      <div class="modal-overlay" [@fadeIn] (click)="close()">
        <div class="modal-container" [@slideUp] (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="close()">
            <span class="material-icons">close</span>
          </button>

          <div class="modal-content">
            <!-- Image Gallery -->
            <div class="image-section">
              <div class="main-image">
                <img [src]="product.images[selectedImage()]" [alt]="product.name">
                @if (product.compare_price && product.compare_price > product.price) {
                  <span class="sale-badge">
                    -{{ calculateDiscount() }}%
                  </span>
                }
              </div>
              @if (product.images.length > 1) {
                <div class="thumbnail-list">
                  @for (image of product.images; track $index; let i = $index) {
                    <button 
                      class="thumbnail" 
                      [class.active]="selectedImage() === i"
                      (click)="selectImage(i)"
                    >
                      <img [src]="image" [alt]="product.name + ' thumbnail'">
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Product Details -->
            <div class="details-section">
              <div class="product-badges">
                @if (product.stock < 10 && product.stock > 0) {
                  <span class="badge low-stock">Only {{ product.stock }} left</span>
                }
                @if (product.stock === 0) {
                  <span class="badge out-of-stock">Out of Stock</span>
                }
              </div>

              <h2 class="product-name">{{ product.name }}</h2>

              @if (product.rating) {
                <div class="rating">
                  <div class="stars">
                    @for (star of [1,2,3,4,5]; track star) {
                      <span class="material-icons" [class.filled]="star <= (product.rating || 0)">star</span>
                    }
                  </div>
                  <span class="count">({{ product.reviews_count || 0 }} reviews)</span>
                </div>
              }

              <div class="price-section">
                <span class="current-price">₹{{ product.price.toLocaleString() }}</span>
                @if (product.compare_price && product.compare_price > product.price) {
                  <span class="original-price">₹{{ product.compare_price.toLocaleString() }}</span>
                  <span class="savings">You save ₹{{ (product.compare_price - product.price).toLocaleString() }}</span>
                }
              </div>

              <p class="description">{{ product.description }}</p>

              <!-- Size Selection -->
              @if (product.sizes?.length) {
                <div class="option-group">
                  <label>Size: <strong>{{ selectedSize() || 'Select' }}</strong></label>
                  <div class="size-options">
                    @for (size of product.sizes; track size) {
                      <button 
                        class="size-btn" 
                        [class.selected]="selectedSize() === size"
                        (click)="selectSize(size)"
                      >
                        {{ size }}
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Color Selection -->
              @if (product.colors?.length) {
                <div class="option-group">
                  <label>Color: <strong>{{ selectedColor() || 'Select' }}</strong></label>
                  <div class="color-options">
                    @for (color of product.colors; track color) {
                      <button 
                        class="color-btn" 
                        [class.selected]="selectedColor() === color"
                        [style.background-color]="getColorCode(color)"
                        [title]="color"
                        (click)="selectColor(color)"
                      >
                        @if (selectedColor() === color) {
                          <span class="material-icons">check</span>
                        }
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Quantity -->
              <div class="option-group">
                <label>Quantity</label>
                <div class="quantity-selector">
                  <button (click)="decrementQty()" [disabled]="quantity() <= 1">
                    <span class="material-icons">remove</span>
                  </button>
                  <span class="qty-value">{{ quantity() }}</span>
                  <button (click)="incrementQty()" [disabled]="quantity() >= (product.stock || 10)">
                    <span class="material-icons">add</span>
                  </button>
                </div>
              </div>

              <!-- Actions -->
              <div class="action-buttons">
                <button 
                  class="add-to-cart" 
                  [disabled]="product.stock === 0"
                  (click)="addToCart()"
                >
                  <span class="material-icons">shopping_bag</span>
                  Add to Cart
                </button>
                <button class="wishlist-btn" (click)="addToWishlist()">
                  <span class="material-icons">favorite_border</span>
                </button>
              </div>

              <!-- Trust Badges -->
              <div class="trust-badges">
                <div class="badge-item">
                  <span class="material-icons">local_shipping</span>
                  <span>Free Shipping</span>
                </div>
                <div class="badge-item">
                  <span class="material-icons">refresh</span>
                  <span>Easy Returns</span>
                </div>
                <div class="badge-item">
                  <span class="material-icons">verified_user</span>
                  <span>Secure Checkout</span>
                </div>
              </div>

              <!-- View Full Details Link -->
              <a [routerLink]="['/products', product._id]" class="view-full" (click)="close()">
                View Full Details
                <span class="material-icons">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow-y: auto;
    }

    .modal-container {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 24px;
      max-width: 1000px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 25px 100px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(201, 169, 98, 0.2);
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.3s ease;
      z-index: 10;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        transform: rotate(90deg);
      }
    }

    .modal-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      padding: 2rem;
    }

    /* Image Section */
    .image-section {
      position: sticky;
      top: 2rem;
    }

    .main-image {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      background: #0a0a0f;
      aspect-ratio: 1;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .sale-badge {
        position: absolute;
        top: 16px;
        left: 16px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 6px 12px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.9rem;
      }
    }

    .thumbnail-list {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }

    .thumbnail {
      width: 70px;
      height: 70px;
      border-radius: 10px;
      overflow: hidden;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 0;
      background: #0a0a0f;

      &.active, &:hover {
        border-color: #c9a962;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    /* Details Section */
    .details-section {
      padding: 1rem 0;
    }

    .product-badges {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .badge {
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .low-stock {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
      }

      .out-of-stock {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
    }

    .product-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
      margin: 0 0 1rem 0;
      line-height: 1.3;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;

      .stars {
        display: flex;
        gap: 2px;

        .material-icons {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.2);

          &.filled {
            color: #f59e0b;
          }
        }
      }

      .count {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .price-section {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;

      .current-price {
        font-size: 1.75rem;
        font-weight: 700;
        color: #c9a962;
      }

      .original-price {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.4);
        text-decoration: line-through;
      }

      .savings {
        font-size: 0.85rem;
        color: #10b981;
        font-weight: 600;
      }
    }

    .description {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .option-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 0.75rem;

        strong {
          color: white;
        }
      }
    }

    .size-options {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .size-btn {
      min-width: 50px;
      height: 44px;
      padding: 0 1rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba(201, 169, 98, 0.5);
      }

      &.selected {
        border-color: #c9a962;
        background: rgba(201, 169, 98, 0.15);
        color: #c9a962;
      }
    }

    .color-options {
      display: flex;
      gap: 0.75rem;
    }

    .color-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        transform: scale(1.1);
      }

      &.selected {
        border-color: white;
        box-shadow: 0 0 0 2px rgba(201, 169, 98, 0.5);
      }

      .material-icons {
        font-size: 18px;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }
    }

    .quantity-selector {
      display: inline-flex;
      align-items: center;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      overflow: hidden;

      button {
        width: 44px;
        height: 44px;
        border: none;
        background: rgba(255, 255, 255, 0.05);
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      }

      .qty-value {
        width: 60px;
        text-align: center;
        font-weight: 600;
        color: white;
      }
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .add-to-cart {
      flex: 1;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #c9a962 0%, #a08347 100%);
      border: none;
      border-radius: 12px;
      color: #0a0a0f;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(201, 169, 98, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .wishlist-btn {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.05);
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #ef4444;
      }
    }

    .trust-badges {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      margin-bottom: 1.5rem;

      .badge-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        text-align: center;

        .material-icons {
          font-size: 20px;
          color: #c9a962;
        }

        span:last-child {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }
      }
    }

    .view-full {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #c9a962;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;

      &:hover {
        gap: 0.75rem;
      }

      .material-icons {
        font-size: 18px;
      }
    }

    @media (max-width: 768px) {
      .modal-content {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .image-section {
        position: static;
      }

      .product-name {
        font-size: 1.5rem;
      }

      .trust-badges {
        flex-wrap: wrap;
      }
    }
  `]
})
export class QuickViewModalComponent {
  @Input() isOpen = false;
  @Input() product: QuickViewProduct | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() addedToCart = new EventEmitter<{product: QuickViewProduct; quantity: number; size?: string; color?: string}>();
  @Output() addedToWishlist = new EventEmitter<QuickViewProduct>();

  selectedImage = signal(0);
  selectedSize = signal<string | null>(null);
  selectedColor = signal<string | null>(null);
  quantity = signal(1);

  private colorMap: Record<string, string> = {
    'Black': '#000000',
    'White': '#FFFFFF',
    'Navy': '#000080',
    'Navy Blue': '#000080',
    'Grey': '#808080',
    'Gray': '#808080',
    'Red': '#DC2626',
    'Blue': '#2563EB',
    'Green': '#059669',
    'Brown': '#78350F',
    'Beige': '#D4B896',
    'Khaki': '#C3B091',
    'Olive': '#556B2F',
    'Maroon': '#800000',
    'Burgundy': '#800020',
    'Charcoal': '#36454F',
  };

  selectImage(index: number) {
    this.selectedImage.set(index);
  }

  selectSize(size: string) {
    this.selectedSize.set(size);
  }

  selectColor(color: string) {
    this.selectedColor.set(color);
  }

  getColorCode(colorName: string): string {
    return this.colorMap[colorName] || '#808080';
  }

  incrementQty() {
    if (this.quantity() < (this.product?.stock || 10)) {
      this.quantity.update(q => q + 1);
    }
  }

  decrementQty() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  calculateDiscount(): number {
    if (this.product?.compare_price && this.product.compare_price > this.product.price) {
      return Math.round(((this.product.compare_price - this.product.price) / this.product.compare_price) * 100);
    }
    return 0;
  }

  close() {
    this.closeModal.emit();
    this.selectedImage.set(0);
    this.quantity.set(1);
    this.selectedSize.set(null);
    this.selectedColor.set(null);
  }

  addToCart() {
    if (this.product) {
      this.addedToCart.emit({
        product: this.product,
        quantity: this.quantity(),
        size: this.selectedSize() || undefined,
        color: this.selectedColor() || undefined
      });
    }
  }

  addToWishlist() {
    if (this.product) {
      this.addedToWishlist.emit(this.product);
    }
  }
}
