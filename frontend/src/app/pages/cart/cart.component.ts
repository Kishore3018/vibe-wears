import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem, Cart } from '@core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="cart-page">
      <div class="container">
        <h1 class="page-title">Shopping Cart</h1>

        @if (loading()) {
          <div class="cart-skeleton">
            @for (i of [1,2,3]; track i) {
              <div class="item-skeleton"></div>
            }
          </div>
        } @else if (cartItems().length === 0) {
          <div class="empty-cart">
            <span class="material-icons-outlined">shopping_cart</span>
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <a routerLink="/products" class="btn btn-primary">Start Shopping</a>
          </div>
        } @else {
          <div class="cart-layout">
            <!-- Cart Items -->
            <div class="cart-items">
              <div class="cart-header">
                <span class="col-product">Product</span>
                <span class="col-price">Price</span>
                <span class="col-quantity">Quantity</span>
                <span class="col-total">Total</span>
                <span class="col-remove"></span>
              </div>

              @for (item of cartItems(); track item.id) {
                <div class="cart-item">
                  <div class="col-product">
                    <a [routerLink]="['/product', item.product?.slug]" class="item-image">
                      <img [src]="item.product?.primary_image || '/assets/images/placeholder.jpg'" [alt]="item.product?.name">
                    </a>
                    <div class="item-details">
                      <a [routerLink]="['/product', item.product?.slug]" class="item-name">
                        {{ item.product?.name }}
                      </a>
                      @if (item.variant) {
                        <span class="item-variant">
                          @if (item.variant.size) {
                            Size: {{ item.variant.size }}
                          }
                          @if (item.variant.color) {
                            / Color: {{ item.variant.color }}
                          }
                        </span>
                      }
                    </div>
                  </div>

                  <div class="col-price">
                    @if (item.product && item.product.compare_price && item.product.compare_price > item.product.price) {
                      <span class="original-price">{{ (item.product.compare_price + (item.variant?.price_modifier || 0)) | currency:'INR':'symbol':'1.0-0' }}</span>
                      <span class="sale-price">{{ getItemPrice(item) | currency:'INR':'symbol':'1.0-0' }}</span>
                    } @else {
                      <span>{{ getItemPrice(item) | currency:'INR':'symbol':'1.0-0' }}</span>
                    }
                  </div>

                  <div class="col-quantity">
                    <div class="quantity-selector">
                      <button (click)="updateQuantity(item, item.quantity - 1)" [disabled]="item.quantity <= 1">
                        <span class="material-icons">remove</span>
                      </button>
                      <input 
                        type="number" 
                        [value]="item.quantity" 
                        min="1"
                        (change)="onQuantityChange(item, $event)"
                      >
                      <button (click)="updateQuantity(item, item.quantity + 1)">
                        <span class="material-icons">add</span>
                      </button>
                    </div>
                  </div>

                  <div class="col-total">
                    <strong>{{ getItemTotal(item) | currency:'INR':'symbol':'1.0-0' }}</strong>
                  </div>

                  <div class="col-remove">
                    <button class="remove-btn" (click)="removeItem(item)">
                      <span class="material-icons">close</span>
                    </button>
                  </div>
                </div>
              }

              <!-- Coupon -->
              <div class="coupon-section">
                <div class="coupon-input">
                  <input 
                    type="text" 
                    placeholder="Enter coupon code"
                    [(ngModel)]="couponCode"
                  >
                  <button class="btn btn-outline" (click)="applyCoupon()">Apply</button>
                </div>
                @if (couponError()) {
                  <span class="coupon-error">{{ couponError() }}</span>
                }
                @if (appliedCoupon()) {
                  <div class="applied-coupon">
                    <span>Coupon "{{ appliedCoupon() }}" applied!</span>
                    <button (click)="removeCoupon()">
                      <span class="material-icons">close</span>
                    </button>
                  </div>
                }
              </div>
            </div>

            <!-- Order Summary -->
            <div class="order-summary">
              <h2>Order Summary</h2>

              <div class="summary-row">
                <span>Subtotal ({{ totalItems() }} items)</span>
                <span>{{ subtotal() | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>

              @if (discount() > 0) {
                <div class="summary-row discount">
                  <span>Discount</span>
                  <span>-{{ discount() | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
              }

              <div class="summary-row">
                <span>Shipping</span>
                <span>{{ shipping() === 0 ? 'Free' : (shipping() | currency:'INR':'symbol':'1.0-0') }}</span>
              </div>

              <div class="summary-row">
                <span>Tax (8%)</span>
                <span>{{ tax() | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>

              <div class="summary-total">
                <span>Total</span>
                <strong>{{ total() | currency:'INR':'symbol':'1.0-0' }}</strong>
              </div>

              <a routerLink="/checkout" class="btn btn-primary btn-lg w-full">
                Proceed to Checkout
              </a>

              <div class="summary-features">
                <div class="feature">
                  <span class="material-icons-outlined">local_shipping</span>
                  <span>Free shipping on orders over ₹100</span>
                </div>
                <div class="feature">
                  <span class="material-icons-outlined">replay</span>
                  <span>30-day return policy</span>
                </div>
                <div class="feature">
                  <span class="material-icons-outlined">lock</span>
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Continue Shopping -->
          <div class="continue-shopping">
            <a routerLink="/products">
              <span class="material-icons">arrow_back</span>
              Continue Shopping
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .cart-page {
      min-height: calc(100vh - 200px);
      padding: 3rem 0 5rem;
      background: linear-gradient(180deg, var(--primary-color) 0%, #0f0f15 100%);
    }

    .page-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.5rem;
      font-weight: 500;
      color: var(--text-light);
      margin-bottom: 2.5rem;
      letter-spacing: 2px;
    }

    /* Skeleton Loading */
    .cart-skeleton {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .item-skeleton {
      height: 120px;
      background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Empty Cart */
    .empty-cart {
      text-align: center;
      padding: 5rem 2rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);

      .material-icons-outlined {
        font-size: 5rem;
        color: rgba(255, 255, 255, 0.2);
        margin-bottom: 1.5rem;
      }

      h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.75rem;
        color: var(--text-light);
        margin-bottom: 0.75rem;
      }

      p {
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 2rem;
      }

      .btn-primary {
        background: var(--accent-color);
        color: var(--primary-color);
        border: 1px solid var(--accent-color);
        padding: 1rem 2.5rem;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 2px;
        text-transform: uppercase;
        transition: all 0.3s ease;

        &:hover {
          background: transparent;
          color: var(--accent-color);
        }
      }
    }

    /* Cart Layout */
    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 2.5rem;
      align-items: start;
    }

    /* Cart Items */
    .cart-items {
      background: var(--surface-card);
      border: 1px solid var(--surface-card-border);
      overflow: hidden;
    }

    .cart-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 40px;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: var(--surface-card-muted);
      border-bottom: 1px solid var(--surface-card-border);
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--accent-color);
    }

    .cart-item {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 40px;
      gap: 1rem;
      padding: 1.5rem;
      border-bottom: 1px solid var(--surface-card-border);
      align-items: center;

      &:last-of-type {
        border-bottom: none;
      }
    }

    .col-product {
      display: flex;
      gap: 1.25rem;
      align-items: center;
    }

    .item-image {
      width: 90px;
      height: 90px;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid var(--surface-card-border);

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

    .item-details {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .item-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--text-primary);
      transition: color 0.3s ease;

      &:hover {
        color: var(--accent-color);
      }
    }

    .item-variant {
      font-size: 0.8rem;
      color: var(--text-secondary);
      letter-spacing: 0.5px;
    }

    .col-price {
      color: var(--text-primary);

      .original-price {
        display: block;
        text-decoration: line-through;
        color: var(--text-secondary);
        font-size: 0.85rem;
      }

      .sale-price {
        color: var(--accent-color);
        font-weight: 500;
      }
    }

    .quantity-selector {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--surface-card-border);

      button {
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-primary);
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          background: var(--bg-tertiary);
          color: var(--accent-color);
        }

        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .material-icons {
          font-size: 1rem;
        }
      }

      input {
        width: 48px;
        height: 36px;
        border: none;
        border-left: 1px solid var(--surface-card-border);
        border-right: 1px solid var(--surface-card-border);
        text-align: center;
        font-size: 0.9rem;
        background: transparent;
        color: var(--text-primary);
        font-family: 'Montserrat', sans-serif;

        &:focus {
          outline: none;
        }

        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      }
    }

    .col-total {
      font-size: 1.1rem;
      color: var(--text-primary);

      strong {
        font-weight: 600;
      }
    }

    .remove-btn {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.4);
      transition: all 0.3s ease;

      &:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.3);
        color: #ef4444;
      }
    }

    /* Coupon */
    .coupon-section {
      padding: 1.5rem;
      border-top: 1px solid var(--surface-card-border);
      background: var(--surface-card-muted);
    }

    .coupon-input {
      display: flex;
      gap: 0;

      input {
        flex: 1;
        padding: 0.875rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-right: none;
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-light);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;

        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        &:focus {
          outline: none;
          border-color: var(--accent-color);
        }
      }

      .btn-outline {
        padding: 0.875rem 1.5rem;
        background: transparent;
        border: 1px solid var(--accent-color);
        color: var(--accent-color);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: var(--accent-color);
          color: var(--primary-color);
        }
      }
    }

    .coupon-error {
      display: block;
      margin-top: 0.75rem;
      color: #ef4444;
      font-size: 0.85rem;
    }

    .applied-coupon {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
      padding: 0.75rem 1rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: #10b981;
      font-size: 0.9rem;

      button {
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        color: inherit;
        padding: 0.25rem;
        transition: opacity 0.3s ease;

        &:hover {
          opacity: 0.7;
        }

        .material-icons {
          font-size: 1rem;
        }
      }
    }

    /* Order Summary */
    .order-summary {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 2rem;
      position: sticky;
      top: 100px;

      h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.5rem;
        font-weight: 500;
        color: var(--text-light);
        margin-bottom: 1.75rem;
        padding-bottom: 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.95rem;

      &.discount {
        color: #10b981;
      }
    }

    .summary-total {
      display: flex;
      justify-content: space-between;
      padding: 1.25rem 0;
      margin: 1.25rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 1.25rem;
      color: var(--text-light);

      strong {
        color: var(--accent-color);
      }
    }

    .w-full {
      width: 100%;
    }

    .btn-primary.btn-lg {
      display: block;
      text-align: center;
      background: var(--accent-color);
      color: var(--primary-color);
      border: 1px solid var(--accent-color);
      padding: 1.15rem 2rem;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      transition: all 0.3s ease;

      &:hover {
        background: transparent;
        color: var(--accent-color);
      }
    }

    .summary-features {
      margin-top: 2rem;
      padding-top: 1.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.5);

      &:last-child {
        margin-bottom: 0;
      }

      .material-icons-outlined {
        font-size: 1.25rem;
        color: var(--accent-color);
      }
    }

    /* Continue Shopping */
    .continue-shopping {
      margin-top: 2.5rem;

      a {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
        transition: color 0.3s ease;

        &:hover {
          color: var(--accent-color);
        }

        .material-icons {
          font-size: 1.1rem;
        }
      }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .cart-layout {
        grid-template-columns: 1fr;
      }

      .order-summary {
        position: static;
      }
    }

    @media (max-width: 768px) {
      .cart-page {
        padding: 2rem 0 3rem;
      }

      .page-title {
        font-size: 1.75rem;
      }

      .cart-header {
        display: none;
      }

      .cart-item {
        grid-template-columns: 1fr auto;
        gap: 1rem;
        position: relative;
      }

      .col-product {
        grid-column: 1 / -1;
      }

      .col-price {
        color: var(--text-light);

        &::before {
          content: 'Price: ';
          color: rgba(255, 255, 255, 0.5);
        }
      }

      .col-total {
        &::before {
          content: 'Total: ';
          color: rgba(255, 255, 255, 0.5);
          font-weight: normal;
        }
      }

      .col-remove {
        position: absolute;
        top: 1rem;
        right: 1rem;
      }

      .coupon-input {
        flex-direction: column;
        gap: 0.75rem;

        input {
          border-right: 1px solid rgba(255, 255, 255, 0.15);
        }
      }
    }
  `]
})
export class CartComponent implements OnInit {
  cartItems = signal<CartItem[]>([]);
  loading = signal(true);
  couponCode = '';
  couponError = signal('');
  appliedCoupon = signal('');

  constructor(private cartService: CartService) {}

  subtotal = computed(() => {
    return this.cartItems().reduce((sum, item) => {
      const basePrice = item.product?.price || 0;
      const modifier = item.variant?.price_modifier || 0;
      return sum + (basePrice + modifier) * item.quantity;
    }, 0);
  });

  totalItems = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  discount = computed(() => {
    // Example: 10% discount if coupon applied
    return this.appliedCoupon() ? this.subtotal() * 0.1 : 0;
  });

  shipping = computed(() => {
    // Free shipping over INR 100
    return this.subtotal() > 100 ? 0 : 9.99;
  });

  tax = computed(() => {
    return (this.subtotal() - this.discount()) * 0.08;
  });

  total = computed(() => {
    return this.subtotal() - this.discount() + this.shipping() + this.tax();
  });

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading.set(true);
    this.cartService.loadCart().subscribe({
      next: (cart: Cart) => {
        this.cartItems.set(cart.items || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getItemPrice(item: CartItem): number {
    const basePrice = item.product?.price || 0;
    const modifier = item.variant?.price_modifier || 0;
    return basePrice + modifier;
  }

  getItemTotal(item: CartItem): number {
    return this.getItemPrice(item) * item.quantity;
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) return;
    
    this.cartService.updateQuantity(item.id, newQuantity).subscribe({
      next: () => {
        this.cartItems.update(items => 
          items.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i)
        );
      }
    });
  }

  onQuantityChange(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);
    if (newQuantity >= 1) {
      this.updateQuantity(item, newQuantity);
    }
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.id).subscribe({
      next: () => {
        this.cartItems.update(items => items.filter(i => i.id !== item.id));
      }
    });
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.couponError.set('Please enter a coupon code');
      return;
    }

    // Mock coupon validation
    if (this.couponCode.toUpperCase() === 'SAVE10') {
      this.appliedCoupon.set(this.couponCode.toUpperCase());
      this.couponError.set('');
      this.couponCode = '';
    } else {
      this.couponError.set('Invalid coupon code');
    }
  }

  removeCoupon(): void {
    this.appliedCoupon.set('');
  }
}
