import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { OrderService, Order } from '@core/services/order.service';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="confirmation-page">
      <div class="container">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner-lg"></div>
            <p>Loading order details...</p>
          </div>
        } @else if (order()) {
          <div class="confirmation-content">
            <!-- Success Icon -->
            <div class="success-icon">
              <span class="material-icons">check_circle</span>
            </div>

            <h1>Thank You for Your Order!</h1>
            <p class="order-number">Order #{{ order()?.order_number }}</p>
            
            <p class="confirmation-message">
              We've received your order and will begin processing it soon. 
              You'll receive an email confirmation with tracking details.
            </p>

            <!-- Order Summary Card -->
            <div class="order-card">
              <div class="card-header">
                <h2>Order Summary</h2>
                <span class="order-status" [class]="order()?.status?.toLowerCase()">
                  {{ formatStatus(order()?.status) }}
                </span>
              </div>

              <!-- Order Items -->
              <div class="order-items">
                @for (item of order()?.items; track item.id) {
                  <div class="order-item">
                    <div class="item-info">
                      <span class="item-name">{{ item.product_name }}</span>
                      @if (item.variant_info) {
                        <span class="item-variant">{{ item.variant_info }}</span>
                      }
                      <span class="item-qty">Qty: {{ item.quantity }}</span>
                    </div>
                    <span class="item-price">{{ item.total | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                }
              </div>

              <!-- Order Totals -->
              <div class="order-totals">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>{{ order()?.subtotal | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                @if (order()?.discount_amount && order()!.discount_amount > 0) {
                  <div class="total-row discount">
                    <span>Discount</span>
                    <span>-{{ order()?.discount_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                }
                <div class="total-row">
                  <span>Shipping</span>
                  <span>{{ order()?.shipping_amount === 0 ? 'Free' : (order()?.shipping_amount | currency:'INR':'symbol':'1.0-0') }}</span>
                </div>
                <div class="total-row">
                  <span>Tax</span>
                  <span>{{ order()?.tax_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="total-row final">
                  <span>Total</span>
                  <strong>{{ order()?.total_amount | currency:'INR':'symbol':'1.0-0' }}</strong>
                </div>
              </div>
            </div>

            <!-- Shipping Details -->
            <div class="details-grid">
              <div class="detail-card">
                <h3>
                  <span class="material-icons">local_shipping</span>
                  Shipping Address
                </h3>
                <p>
                  {{ order()?.shipping_full_name }}<br>
                  {{ order()?.shipping_address }}<br>
                  {{ order()?.shipping_city }}, {{ order()?.shipping_state }} {{ order()?.shipping_postal_code }}<br>
                  {{ order()?.shipping_country }}
                </p>
                @if (order()?.shipping_phone) {
                  <p class="phone">{{ order()?.shipping_phone }}</p>
                }
              </div>

              <div class="detail-card">
                <h3>
                  <span class="material-icons">payment</span>
                  Payment Method
                </h3>
                <p>{{ formatPaymentMethod(order()?.payment_method) }}</p>
                <p class="payment-status" [class]="order()?.payment_status?.toLowerCase()">
                  {{ formatStatus(order()?.payment_status) }}
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <a routerLink="/account/orders" class="btn btn-outline">
                <span class="material-icons">receipt_long</span>
                View All Orders
              </a>
              <a routerLink="/products" class="btn btn-primary">
                <span class="material-icons">shopping_bag</span>
                Continue Shopping
              </a>
            </div>

            <!-- Help Section -->
            <div class="help-section">
              <p>Need help with your order?</p>
              <a href="mailto:support@vibewears.com">Contact Support</a>
            </div>
          </div>
        } @else {
          <div class="error-state">
            <span class="material-icons">error_outline</span>
            <h2>Order Not Found</h2>
            <p>We couldn't find the order you're looking for.</p>
            <a routerLink="/products" class="btn btn-primary">Browse Products</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .confirmation-page {
      min-height: calc(100vh - 200px);
      padding: 3rem 0 5rem;
      background: linear-gradient(180deg, var(--primary-color) 0%, #0f0f15 100%);
    }

    .loading-state,
    .error-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-light);

      .spinner-lg {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1.5rem;
      }

      .material-icons {
        font-size: 4rem;
        color: rgba(255, 255, 255, 0.3);
        margin-bottom: 1rem;
      }

      h2 {
        margin-bottom: 0.5rem;
      }

      p {
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 2rem;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .confirmation-content {
      max-width: 700px;
      margin: 0 auto;
      text-align: center;
    }

    .success-icon {
      margin-bottom: 1.5rem;

      .material-icons {
        font-size: 5rem;
        color: var(--accent-color);
        animation: scaleIn 0.5s ease-out;
      }
    }

    @keyframes scaleIn {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.5rem;
      font-weight: 500;
      color: var(--text-light);
      margin-bottom: 0.5rem;
    }

    .order-number {
      font-family: 'Montserrat', sans-serif;
      font-size: 1rem;
      color: var(--accent-color);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }

    .confirmation-message {
      color: rgba(255, 255, 255, 0.7);
      max-width: 500px;
      margin: 0 auto 2.5rem;
      line-height: 1.7;
    }

    .order-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 2rem;
      text-align: left;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--text-light);
        margin: 0;
      }
    }

    .order-status {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 0.35rem 0.75rem;
      border: 1px solid;

      &.pending {
        color: #f59e0b;
        border-color: rgba(245, 158, 11, 0.3);
        background: rgba(245, 158, 11, 0.1);
      }

      &.confirmed, &.processing {
        color: #3b82f6;
        border-color: rgba(59, 130, 246, 0.3);
        background: rgba(59, 130, 246, 0.1);
      }

      &.shipped {
        color: #8b5cf6;
        border-color: rgba(139, 92, 246, 0.3);
        background: rgba(139, 92, 246, 0.1);
      }

      &.delivered {
        color: #10b981;
        border-color: rgba(16, 185, 129, 0.3);
        background: rgba(16, 185, 129, 0.1);
      }

      &.cancelled {
        color: #ef4444;
        border-color: rgba(239, 68, 68, 0.3);
        background: rgba(239, 68, 68, 0.1);
      }
    }

    .order-items {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0.75rem 0;

      &:not(:last-child) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .item-name {
      color: var(--text-light);
      font-weight: 500;
    }

    .item-variant,
    .item-qty {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .item-price {
      color: var(--text-light);
      font-weight: 500;
    }

    .order-totals {
      padding: 1rem 1.5rem;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.95rem;

      &.discount {
        color: #10b981;
      }

      &.final {
        padding-top: 1rem;
        margin-top: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-light);
        font-size: 1.1rem;

        strong {
          color: var(--accent-color);
        }
      }
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 2.5rem;
      text-align: left;
    }

    .detail-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 1.5rem;

      h3 {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: var(--accent-color);
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .material-icons {
          font-size: 1.1rem;
        }
      }

      p {
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.7;
        margin: 0;

        &.phone {
          margin-top: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }

      .payment-status {
        margin-top: 0.75rem;
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;

        &.pending {
          color: #f59e0b;
        }

        &.paid, &.completed {
          color: #10b981;
        }

        &.failed {
          color: #ef4444;
        }
      }
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2.5rem;

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem 2rem;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        transition: all 0.3s ease;

        .material-icons {
          font-size: 1.1rem;
        }
      }

      .btn-outline {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: var(--text-light);

        &:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--accent-color);
        }
      }

      .btn-primary {
        background: var(--accent-color);
        border: 1px solid var(--accent-color);
        color: var(--primary-color);

        &:hover {
          background: transparent;
          color: var(--accent-color);
        }
      }
    }

    .help-section {
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);

      p {
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }

      a {
        color: var(--accent-color);
        text-decoration: underline;
        text-underline-offset: 3px;

        &:hover {
          text-decoration: none;
        }
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .confirmation-page {
        padding: 2rem 0 3rem;
      }

      h1 {
        font-size: 1.75rem;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-direction: column;

        .btn {
          width: 100%;
          justify-content: center;
        }
      }
    }
  `]
})
export class OrderConfirmationComponent implements OnInit {
  order = signal<Order | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const orderNumber = this.route.snapshot.paramMap.get('orderNumber');
    if (orderNumber) {
      this.loadOrder(orderNumber);
    } else {
      // Check if order was just placed (from checkout)
      const currentOrder = this.orderService.currentOrder();
      if (currentOrder) {
        this.order.set(currentOrder);
        this.loading.set(false);
      } else {
        this.loading.set(false);
      }
    }
  }

  loadOrder(orderNumber: string): void {
    this.orderService.getOrder(orderNumber).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: () => {
        const currentOrder = this.orderService.currentOrder();
        if (currentOrder && currentOrder.order_number === orderNumber) {
          this.order.set(currentOrder);
        }
        this.loading.set(false);
      }
    });
  }

  formatStatus(status?: string): string {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
  }

  formatPaymentMethod(method?: string): string {
    if (!method) return 'Not specified';
    const methods: { [key: string]: string } = {
      'card': 'Credit/Debit Card',
      'stripe': 'Credit/Debit Card',
      'razorpay': 'Online Payment (Razorpay)',
      'upi': 'UPI',
      'wallet': 'Wallet',
      'netbanking': 'Net Banking',
      'paypal': 'PayPal',
      'cod': 'Cash on Delivery',
      'cash_on_delivery': 'Cash on Delivery'
    };
    return methods[method.toLowerCase()] || method;
  }
}
