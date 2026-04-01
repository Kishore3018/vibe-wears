import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '@core/services/order.service';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="track-order-page">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header">
          <h1>Track Your Order</h1>
          <p>Enter your order number and email to track your order status</p>
        </div>

        <!-- Track Order Form -->
        <div class="track-form-container">
          <form (ngSubmit)="trackOrder()" class="track-form">
            <div class="form-group">
              <label for="orderNumber">Order Number</label>
              <input
                type="text"
                id="orderNumber"
                [(ngModel)]="orderNumber"
                name="orderNumber"
                placeholder="e.g., VW-202603021234-ABCD1234"
                required
              />
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                placeholder="Enter your email address"
                required
              />
            </div>

            @if (errorMessage()) {
              <div class="error-message">
                <span class="material-icons">error_outline</span>
                {{ errorMessage() }}
              </div>
            }

            <button type="submit" class="track-btn" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner"></span>
                Tracking...
              } @else {
                <span class="material-icons">search</span>
                Track Order
              }
            </button>
          </form>
        </div>

        <!-- Order Details -->
        @if (order()) {
          <div class="order-details">
            <div class="order-header">
              <div class="order-info">
                <h2>Order #{{ order()!.order_number }}</h2>
                <span class="order-date">Placed on {{ order()!.created_at | date:'mediumDate' }}</span>
              </div>
              <span class="status-badge" [class]="'status-' + order()!.status">
                {{ formatStatus(order()!.status) }}
              </span>
            </div>

            <!-- Order Timeline -->
            <div class="order-timeline">
              <div class="timeline-step" [class.completed]="isStepCompleted('pending')" [class.active]="order()!.status === 'pending'">
                <div class="step-icon">
                  <span class="material-icons">receipt_long</span>
                </div>
                <span class="step-label">Order Placed</span>
              </div>
              <div class="timeline-connector" [class.completed]="isStepCompleted('confirmed')"></div>
              <div class="timeline-step" [class.completed]="isStepCompleted('confirmed')" [class.active]="order()!.status === 'confirmed'">
                <div class="step-icon">
                  <span class="material-icons">check_circle</span>
                </div>
                <span class="step-label">Confirmed</span>
              </div>
              <div class="timeline-connector" [class.completed]="isStepCompleted('processing')"></div>
              <div class="timeline-step" [class.completed]="isStepCompleted('processing')" [class.active]="order()!.status === 'processing'">
                <div class="step-icon">
                  <span class="material-icons">inventory</span>
                </div>
                <span class="step-label">Processing</span>
              </div>
              <div class="timeline-connector" [class.completed]="isStepCompleted('shipped')"></div>
              <div class="timeline-step" [class.completed]="isStepCompleted('shipped')" [class.active]="order()!.status === 'shipped'">
                <div class="step-icon">
                  <span class="material-icons">local_shipping</span>
                </div>
                <span class="step-label">Shipped</span>
              </div>
              <div class="timeline-connector" [class.completed]="isStepCompleted('delivered')"></div>
              <div class="timeline-step" [class.completed]="isStepCompleted('delivered')" [class.active]="order()!.status === 'delivered'">
                <div class="step-icon">
                  <span class="material-icons">home</span>
                </div>
                <span class="step-label">Delivered</span>
              </div>
            </div>

            <!-- Shipping Info -->
            @if (order()!.tracking_number) {
              <div class="shipping-info">
                <h3>Shipping Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Carrier</span>
                    <span class="value">{{ order()!.carrier || 'Standard Shipping' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Tracking Number</span>
                    <span class="value tracking-number">{{ order()!.tracking_number }}</span>
                  </div>
                  @if (order()!.estimated_delivery) {
                    <div class="info-item">
                      <span class="label">Estimated Delivery</span>
                      <span class="value">{{ order()!.estimated_delivery | date:'mediumDate' }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Delivery Address -->
            <div class="delivery-address">
              <h3>Delivery Address</h3>
              <p>{{ order()!.shipping_full_name }}</p>
              <p>{{ order()!.shipping_address }}</p>
              <p>{{ order()!.shipping_city }}, {{ order()!.shipping_state }} - {{ order()!.shipping_postal_code }}</p>
              <p>{{ order()!.shipping_country }}</p>
            </div>

            <!-- Order Items -->
            <div class="order-items">
              <h3>Order Items</h3>
              @for (item of order()!.items; track item.id) {
                <div class="order-item">
                  <div class="item-info">
                    <span class="item-name">{{ item.product_name }}</span>
                    @if (item.variant_info) {
                      <span class="item-variant">{{ item.variant_info }}</span>
                    }
                    <span class="item-qty">Qty: {{ item.quantity }}</span>
                  </div>
                  <span class="item-price">₹{{ item.total | number:'1.0-0' }}</span>
                </div>
              }
            </div>

            <!-- Order Summary -->
            <div class="order-summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>₹{{ order()!.subtotal | number:'1.0-0' }}</span>
              </div>
              @if (order()!.discount_amount > 0) {
                <div class="summary-row discount">
                  <span>Discount</span>
                  <span>-₹{{ order()!.discount_amount | number:'1.0-0' }}</span>
                </div>
              }
              <div class="summary-row">
                <span>Shipping</span>
                <span>{{ order()!.shipping_amount === 0 ? 'Free' : '₹' + order()!.shipping_amount }}</span>
              </div>
              <div class="summary-row">
                <span>Tax (GST)</span>
                <span>₹{{ order()!.tax_amount | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>₹{{ order()!.total_amount | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>
        }

        <!-- Help Section -->
        <div class="help-section">
          <h3>Need Help?</h3>
          <p>If you have any questions about your order, please visit our <a routerLink="/help">Help Center</a> or contact our support team.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .track-order-page {
      min-height: 100vh;
      padding: 120px 0 60px;
      background: var(--bg-light);
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;

      h1 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 2.5rem;
        font-weight: 600;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--text-secondary);
        font-size: 1rem;
      }
    }

    .track-form-container {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
      margin-bottom: 2rem;
    }

    .track-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-weight: 500;
        color: var(--primary-color);
        font-size: 0.9rem;
      }

      input {
        padding: 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }

        &::placeholder {
          color: #999;
        }
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #fff5f5;
      border: 1px solid #ffccc7;
      border-radius: 8px;
      color: #cf1322;
      font-size: 0.9rem;

      .material-icons {
        font-size: 1.2rem;
      }
    }

    .track-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: var(--secondary-color);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .order-details {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
      margin-bottom: 2rem;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #eee;

      h2 {
        font-size: 1.25rem;
        color: var(--primary-color);
        margin-bottom: 0.25rem;
      }

      .order-date {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.status-pending {
        background: #fff7e6;
        color: #d46b08;
      }

      &.status-confirmed {
        background: #e6f7ff;
        color: #0050b3;
      }

      &.status-processing {
        background: #f0f5ff;
        color: #2f54eb;
      }

      &.status-shipped {
        background: #f6ffed;
        color: #389e0d;
      }

      &.status-delivered {
        background: #f6ffed;
        color: #52c41a;
      }

      &.status-cancelled {
        background: #fff1f0;
        color: #cf1322;
      }
    }

    .order-timeline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding: 1rem 0;
    }

    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      .step-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;

        .material-icons {
          color: #999;
          font-size: 1.5rem;
        }
      }

      .step-label {
        font-size: 0.75rem;
        color: #999;
        text-align: center;
      }

      &.completed .step-icon {
        background: var(--accent-color);

        .material-icons {
          color: white;
        }
      }

      &.completed .step-label {
        color: var(--primary-color);
        font-weight: 500;
      }

      &.active .step-icon {
        background: var(--primary-color);
        animation: pulse 2s infinite;

        .material-icons {
          color: white;
        }
      }

      &.active .step-label {
        color: var(--primary-color);
        font-weight: 600;
      }
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(26, 26, 26, 0.4); }
      50% { box-shadow: 0 0 0 10px rgba(26, 26, 26, 0); }
    }

    .timeline-connector {
      flex: 1;
      height: 3px;
      background: #e0e0e0;
      margin: 0 0.5rem;
      margin-bottom: 1.5rem;
      transition: background 0.3s;

      &.completed {
        background: var(--accent-color);
      }
    }

    .shipping-info, .delivery-address, .order-items {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #eee;

      h3 {
        font-size: 1rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .label {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      .value {
        font-weight: 500;
        color: var(--primary-color);
      }

      .tracking-number {
        font-family: monospace;
        background: #f5f5f5;
        padding: 0.5rem;
        border-radius: 4px;
      }
    }

    .delivery-address {
      p {
        margin: 0.25rem 0;
        color: var(--text-primary);

        &:first-of-type {
          font-weight: 500;
        }
      }
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .item-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .item-name {
        font-weight: 500;
        color: var(--primary-color);
      }

      .item-variant, .item-qty {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      .item-price {
        font-weight: 600;
        color: var(--primary-color);
      }
    }

    .order-summary {
      padding-top: 1rem;

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        font-size: 0.95rem;

        &.discount {
          color: #52c41a;
        }

        &.total {
          border-top: 2px solid var(--primary-color);
          padding-top: 1rem;
          margin-top: 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
        }
      }
    }

    .help-section {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);

      h3 {
        font-size: 1.1rem;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--text-secondary);
        font-size: 0.95rem;
      }

      a {
        color: var(--accent-color);
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    @media (max-width: 768px) {
      .track-order-page {
        padding-top: 100px;
      }

      .page-header h1 {
        font-size: 2rem;
      }

      .order-timeline {
        flex-wrap: wrap;
        gap: 1rem;
      }

      .timeline-connector {
        display: none;
      }

      .timeline-step {
        flex: 0 0 calc(33.333% - 1rem);
      }

      .order-header {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class TrackOrderComponent {
  orderNumber = '';
  email = '';
  
  loading = signal(false);
  errorMessage = signal('');
  order = signal<Order | null>(null);

  private statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

  constructor(private orderService: OrderService) {}

  trackOrder(): void {
    if (!this.orderNumber.trim() || !this.email.trim()) {
      this.errorMessage.set('Please enter both order number and email address');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.order.set(null);

    this.orderService.trackOrder(this.orderNumber.trim(), this.email.trim()).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'No order found with this order number and email combination');
        this.loading.set(false);
      }
    });
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  }

  isStepCompleted(step: string): boolean {
    const order = this.order();
    if (!order) return false;
    
    if (order.status === 'cancelled') return false;
    
    const currentIndex = this.statusOrder.indexOf(order.status);
    const stepIndex = this.statusOrder.indexOf(step);
    
    return stepIndex <= currentIndex;
  }
}
