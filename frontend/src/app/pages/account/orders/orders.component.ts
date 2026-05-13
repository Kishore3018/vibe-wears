import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService, Order } from '@core/services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="orders-page">
      <div class="page-header">
        <h2>My Orders</h2>
        <p class="subtitle">Track and manage your orders</p>
      </div>

      @if (loading()) {
        <div class="orders-skeleton">
          @for (i of [1,2,3]; track i) {
            <div class="order-skeleton">
              <div class="skeleton-header"></div>
              <div class="skeleton-body">
                <div class="skeleton-item"></div>
                <div class="skeleton-item"></div>
              </div>
              <div class="skeleton-footer"></div>
            </div>
          }
        </div>
      } @else if (orders().length === 0) {
        <div class="empty-orders">
          <div class="empty-icon">
            <span class="material-icons-outlined">inventory_2</span>
          </div>
          <h3>No Orders Yet</h3>
          <p>Your order history is empty. Start exploring our premium collection and place your first order.</p>
          <a routerLink="/products" class="btn-shop">
            <span>Start Shopping</span>
            <span class="material-icons">arrow_forward</span>
          </a>
        </div>
      } @else {
        <div class="orders-list">
          @for (order of orders(); track order.id) {
            <div class="order-card">
              <div class="order-header">
                <div class="order-info">
                  <span class="order-number">{{ order.order_number }}</span>
                  <span class="order-date">{{ order.created_at | date:'MMMM d, yyyy' }}</span>
                </div>
                <div class="order-badges">
                  <span class="status-badge" [class]="order.status">
                    {{ getStatusLabel(order.status) }}
                  </span>
                  <span class="payment-badge" [class]="order.payment_status">
                    {{ order.payment_status }}
                  </span>
                </div>
              </div>

              @if (order.tracking_number) {
                <div class="tracking-info">
                  <span class="material-icons-outlined">local_shipping</span>
                  <div class="tracking-details">
                    <span class="tracking-label">Tracking Number</span>
                    <span class="tracking-number">{{ order.tracking_number }}</span>
                  </div>
                  @if (order.carrier) {
                    <span class="carrier">{{ order.carrier }}</span>
                  }
                </div>
              }

              <!-- Order Progress Tracker -->
              @if (order.status !== 'cancelled') {
                <div class="order-progress">
                  <div class="progress-step" [class.active]="getStatusIndex(order.status) >= 0" [class.completed]="getStatusIndex(order.status) > 0">
                    <div class="step-icon">
                      <span class="material-icons">receipt_long</span>
                    </div>
                    <span class="step-label">Pending</span>
                  </div>
                  <div class="progress-line" [class.active]="getStatusIndex(order.status) >= 1"></div>
                  <div class="progress-step" [class.active]="getStatusIndex(order.status) >= 1" [class.completed]="getStatusIndex(order.status) > 1">
                    <div class="step-icon">
                      <span class="material-icons">check_circle</span>
                    </div>
                    <span class="step-label">Confirmed</span>
                  </div>
                  <div class="progress-line" [class.active]="getStatusIndex(order.status) >= 2"></div>
                  <div class="progress-step" [class.active]="getStatusIndex(order.status) >= 2" [class.completed]="getStatusIndex(order.status) > 2">
                    <div class="step-icon">
                      <span class="material-icons">inventory_2</span>
                    </div>
                    <span class="step-label">Processing</span>
                  </div>
                  <div class="progress-line" [class.active]="getStatusIndex(order.status) >= 3"></div>
                  <div class="progress-step" [class.active]="getStatusIndex(order.status) >= 3" [class.completed]="getStatusIndex(order.status) > 3">
                    <div class="step-icon">
                      <span class="material-icons">local_shipping</span>
                    </div>
                    <span class="step-label">Shipped</span>
                  </div>
                  <div class="progress-line" [class.active]="getStatusIndex(order.status) >= 4"></div>
                  <div class="progress-step" [class.active]="getStatusIndex(order.status) >= 4">
                    <div class="step-icon">
                      <span class="material-icons">done_all</span>
                    </div>
                    <span class="step-label">Delivered</span>
                  </div>
                </div>
              } @else {
                <div class="cancelled-notice">
                  <span class="material-icons">cancel</span>
                  <span>This order has been cancelled</span>
                </div>
              }

              <div class="order-items">
                @for (item of order.items; track item.id) {
                  <div class="order-item">
                    <div class="item-image">
                      <span class="material-icons-outlined">checkroom</span>
                    </div>
                    <div class="item-details">
                      <span class="item-name">{{ item.product_name }}</span>
                      @if (item.variant_info) {
                        <span class="item-variant">{{ item.variant_info }}</span>
                      }
                      <span class="item-qty">Qty: {{ item.quantity }}</span>
                    </div>
                    <div class="item-price">
                      <span class="price">₹{{ item.total | number:'1.0-0' }}</span>
                      @if (item.quantity > 1) {
                        <span class="unit-price">₹{{ item.price | number:'1.0-0' }} each</span>
                      }
                    </div>
                  </div>
                }
              </div>

              @if (order.shipping_address) {
                <div class="shipping-info">
                  <div class="shipping-header">
                    <span class="material-icons-outlined">location_on</span>
                    <span>Shipping Address</span>
                  </div>
                  <div class="shipping-address">
                    <span class="name">{{ order.shipping_full_name }}</span>
                    <span class="address">{{ order.shipping_address }}</span>
                    <span class="city">{{ order.shipping_city }}, {{ order.shipping_state }} {{ order.shipping_postal_code }}</span>
                    <span class="phone">{{ order.shipping_phone }}</span>
                  </div>
                </div>
              }

              <div class="order-footer">
                <div class="order-summary">
                  <div class="summary-row">
                    <span>Subtotal</span>
                    <span>₹{{ order.subtotal | number:'1.0-0' }}</span>
                  </div>
                  @if (order.discount_amount > 0) {
                    <div class="summary-row discount">
                      <span>Discount</span>
                      <span>-₹{{ order.discount_amount | number:'1.0-0' }}</span>
                    </div>
                  }
                  <div class="summary-row">
                    <span>Shipping</span>
                    <span>{{ order.shipping_amount > 0 ? '₹' + (order.shipping_amount | number:'1.0-0') : 'FREE' }}</span>
                  </div>
                  <div class="summary-row">
                    <span>Tax</span>
                    <span>₹{{ order.tax_amount | number:'1.0-0' }}</span>
                  </div>
                  <div class="summary-total">
                    <span>Total</span>
                    <span>₹{{ order.total_amount | number:'1.0-0' }}</span>
                  </div>
                </div>
                <div class="order-actions">
                  @if (order.status === 'pending') {
                    <button class="btn-cancel" (click)="cancelOrder(order.order_number)">
                      <span class="material-icons-outlined">close</span>
                      Cancel Order
                    </button>
                  }
                  <a [routerLink]="['/order-confirmation', order.order_number]" class="btn-details">
                    View Details
                    <span class="material-icons">arrow_forward</span>
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-page {
    :host-context(body.vw-light-mode) .orders-page h2,
    :host-context(body.vw-light-mode) .orders-page .subtitle,
    :host-context(body.vw-light-mode) .orders-page .order-number,
    :host-context(body.vw-light-mode) .orders-page .order-date,
    :host-context(body.vw-light-mode) .orders-page .tracking-label,
    :host-context(body.vw-light-mode) .orders-page .tracking-number,
    :host-context(body.vw-light-mode) .orders-page .carrier,
    :host-context(body.vw-light-mode) .orders-page .step-label,
    :host-context(body.vw-light-mode) .orders-page .item-name,
    :host-context(body.vw-light-mode) .orders-page .item-variant,
    :host-context(body.vw-light-mode) .orders-page .item-qty,
    :host-context(body.vw-light-mode) .orders-page .shipping-header,
    :host-context(body.vw-light-mode) .orders-page .shipping-address span,
    :host-context(body.vw-light-mode) .orders-page .summary-row,
    :host-context(body.vw-light-mode) .orders-page .summary-total,
    :host-context(body.vw-light-mode) .orders-page .empty-orders h3,
    :host-context(body.vw-light-mode) .orders-page .empty-orders p,
    :host-context(body.vw-light-mode) .orders-page .loading-state p {
      color: #1f2937;
    }

    :host-context(body.vw-light-mode) .orders-page .order-card,
    :host-context(body.vw-light-mode) .orders-page .empty-orders {
      background: #ffffff;
      border-color: rgba(17, 24, 39, 0.12);
    }

    :host-context(body.vw-light-mode) .orders-page .status-badge,
    :host-context(body.vw-light-mode) .orders-page .payment-badge,
    :host-context(body.vw-light-mode) .orders-page .btn-details,
    :host-context(body.vw-light-mode) .orders-page .btn-cancel {
      color: #1f2937;
      background: #f9fafb;
      border-color: rgba(17, 24, 39, 0.16);
    }

    :host-context(body.vw-light-mode) .orders-page .order-progress .progress-line,
    :host-context(body.vw-light-mode) .orders-page .order-progress .step-icon {
      background: rgba(17, 24, 39, 0.08);
      border-color: rgba(17, 24, 39, 0.12);
    }

    :host-context(body.vw-light-mode) .orders-page .progress-step.active .step-icon,
    :host-context(body.vw-light-mode) .orders-page .progress-step.completed .step-icon,
    :host-context(body.vw-light-mode) .orders-page .order-actions .btn-details:hover,
    :host-context(body.vw-light-mode) .orders-page .order-actions .btn-cancel:hover {
      background: rgba(201, 169, 98, 0.16);
      color: #111827;
    }
      padding: 0;
    }

    .page-header {
      margin-bottom: 2.5rem;

      h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 2rem;
        font-weight: 600;
        color: var(--text-light);
        margin-bottom: 0.5rem;
      }

      .subtitle {
        font-family: 'Montserrat', sans-serif;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
      }
    }

    /* Skeleton Loading */
    .orders-skeleton {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .order-skeleton {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      overflow: hidden;

      .skeleton-header {
        height: 70px;
        background: linear-gradient(90deg, 
          rgba(255,255,255,0.03) 25%, 
          rgba(255,255,255,0.06) 50%, 
          rgba(255,255,255,0.03) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      .skeleton-body {
        padding: 1.5rem;
      }

      .skeleton-item {
        height: 60px;
        margin-bottom: 1rem;
        background: linear-gradient(90deg, 
          rgba(255,255,255,0.02) 25%, 
          rgba(255,255,255,0.05) 50%, 
          rgba(255,255,255,0.02) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .skeleton-footer {
        height: 80px;
        background: linear-gradient(90deg, 
          rgba(255,255,255,0.03) 25%, 
          rgba(255,255,255,0.06) 50%, 
          rgba(255,255,255,0.03) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Empty State */
    .empty-orders {
      text-align: center;
      padding: 4rem 2rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);

      .empty-icon {
        width: 100px;
        height: 100px;
        margin: 0 auto 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(201, 169, 98, 0.1);
        border: 1px solid rgba(201, 169, 98, 0.2);

        .material-icons-outlined {
          font-size: 3rem;
          color: var(--accent-color);
        }
      }

      h3 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.75rem;
        color: var(--text-light);
        margin-bottom: 0.75rem;
      }

      p {
        font-family: 'Montserrat', sans-serif;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
        max-width: 400px;
        margin: 0 auto 2rem;
        line-height: 1.7;
      }

      .btn-shop {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        background: var(--accent-color);
        color: #0a0a0f;
        padding: 1rem 2rem;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        text-decoration: none;
        transition: all 0.3s ease;

        &:hover {
          background: transparent;
          color: var(--accent-color);
          box-shadow: inset 0 0 0 1px var(--accent-color);
        }

        .material-icons {
          font-size: 1.1rem;
          transition: transform 0.3s ease;
        }

        &:hover .material-icons {
          transform: translateX(4px);
        }
      }
    }

    /* Orders List */
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .order-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-card-border);
      border-radius: 24px;
      overflow: hidden;
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba(201, 169, 98, 0.3);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      }
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: var(--surface-card-muted);
      border-bottom: 1px solid var(--surface-card-border);
    }

    .order-info {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      .order-number {
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
        font-size: 1rem;
        color: var(--accent-color);
        letter-spacing: 0.5px;
      }

      .order-date {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
    }

    .order-badges {
      display: flex;
      gap: 0.75rem;
    }

    .status-badge, .payment-badge {
      padding: 0.5rem 1rem;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .status-badge {
      &.pending {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }

      &.confirmed {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }

      &.processing {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
        border: 1px solid rgba(139, 92, 246, 0.3);
      }

      &.shipped {
        background: rgba(201, 169, 98, 0.15);
        color: var(--accent-color);
        border: 1px solid rgba(201, 169, 98, 0.3);
      }

      &.delivered {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      &.cancelled {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
    }

    .payment-badge {
      &.pending {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.2);
      }

      &.paid, &.completed {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }

      &.failed {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
      }
    }

    /* Tracking Info */
    .tracking-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 2rem;
      background: #f8f6f1;
      border-bottom: 1px solid var(--surface-card-border);

      .material-icons-outlined {
        font-size: 1.5rem;
        color: var(--accent-color);
      }

      .tracking-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;

        .tracking-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .tracking-number {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: 1px;
        }
      }

      .carrier {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        color: var(--accent-color);
        padding: 0.35rem 0.75rem;
        background: rgba(201, 169, 98, 0.15);
        border: 1px solid rgba(201, 169, 98, 0.3);
      }
    }

    /* Order Progress Tracker */
    .order-progress {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 2rem;
      background: var(--surface-card-muted);
      border-bottom: 1px solid var(--surface-card-border);
    }

    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      opacity: 0.4;
      transition: opacity 0.3s ease;

      .step-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid #d1d5db;
        transition: all 0.3s ease;

        .material-icons {
          font-size: 1.25rem;
          color: #6b7280;
        }
      }

      .step-label {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.7rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      &.active {
        opacity: 1;

        .step-icon {
          background: rgba(201, 169, 98, 0.2);
          border-color: var(--accent-color);

          .material-icons {
            color: var(--accent-color);
          }
        }

        .step-label {
          color: var(--accent-color);
        }
      }

      &.completed {
        .step-icon {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;

          .material-icons {
            color: #10b981;
          }
        }

        .step-label {
          color: #10b981;
        }
      }
    }

    .progress-line {
      width: 60px;
      height: 2px;
      background: #d1d5db;
      margin: 0 0.25rem;
      margin-bottom: 1.5rem;
      transition: background 0.3s ease;

      &.active {
        background: linear-gradient(90deg, #10b981, var(--accent-color));
      }
    }

    .cancelled-notice {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      background: rgba(239, 68, 68, 0.1);
      border-bottom: 1px solid rgba(239, 68, 68, 0.2);

      .material-icons {
        color: #ef4444;
      }

      span:last-child {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        color: #ef4444;
      }
    }

    /* Order Items */
    .order-items {
      padding: 1.5rem 2rem;
      background: var(--surface-card);
      border-top: 1px solid var(--surface-card-border);
      border-bottom: 1px solid var(--surface-card-border);
    }

    .order-item {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem 0;
      border-bottom: 1px solid var(--surface-card-border);

      &:first-child {
        padding-top: 0;
      }

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .item-image {
        width: 70px;
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-card-muted);
        border: 1px solid var(--surface-card-border);

        .material-icons-outlined {
          font-size: 1.75rem;
          color: var(--text-secondary);
        }
      }

      .item-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        .item-name {
          font-family: 'Montserrat', sans-serif;
          font-weight: 500;
          color: var(--text-primary);
        }

        .item-variant {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .item-qty {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
      }

      .item-price {
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .price {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          color: var(--accent-color);
          font-size: 1.1rem;
        }

        .unit-price {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      }
    }

    /* Shipping Info */
    .shipping-info {
      padding: 1.25rem 2rem;
      background: var(--surface-card-muted);
      border-top: 1px solid var(--surface-card-border);
      border-bottom: 1px solid var(--surface-card-border);

      .shipping-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-secondary);

        .material-icons-outlined {
          font-size: 1rem;
        }
      }

      .shipping-address {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        color: var(--text-secondary);
        line-height: 1.5;

        .name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .phone {
          color: var(--text-secondary);
        }
      }
    }

    /* Order Footer */
    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 1.5rem 2rem;
      background: var(--surface-card-muted);
      border-top: 1px solid var(--surface-card-border);
    }

    .order-summary {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 200px;

      .summary-row {
        display: flex;
        justify-content: space-between;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        color: var(--text-secondary);

        &.discount {
          color: #10b981;
        }
      }

      .summary-total {
        display: flex;
        justify-content: space-between;
        padding-top: 0.75rem;
        margin-top: 0.25rem;
        border-top: 1px solid rgba(201, 169, 98, 0.3);
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);

        span:last-child {
          color: var(--accent-color);
        }
      }
    }

    .order-actions {
      display: flex;
      gap: 1rem;
      align-items: center;

      .btn-cancel {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: transparent;
        border: 1px solid rgba(239, 68, 68, 0.5);
        color: #ef4444;
        padding: 0.75rem 1.25rem;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: all 0.3s ease;

        .material-icons-outlined {
          font-size: 1rem;
        }

        &:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
        }
      }

      .btn-details {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--accent-color);
        color: #0a0a0f;
        padding: 0.75rem 1.5rem;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-decoration: none;
        transition: all 0.3s ease;

        .material-icons {
          font-size: 1rem;
          transition: transform 0.3s ease;
        }

        &:hover {
          background: transparent;
          color: var(--accent-color);
          box-shadow: inset 0 0 0 1px var(--accent-color);
        }

        &:hover .material-icons {
          transform: translateX(4px);
        }
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .order-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.25rem 1.5rem;
      }

      .order-badges {
        width: 100%;
        justify-content: flex-start;
      }

      .tracking-info {
        flex-wrap: wrap;
        padding: 1rem 1.5rem;

        .carrier {
          margin-left: auto;
        }
      }

      .order-progress {
        padding: 1rem 0.5rem;
        overflow-x: auto;
      }

      .progress-step {
        .step-icon {
          width: 32px;
          height: 32px;

          .material-icons { font-size: 1rem; }
        }

        .step-label {
          font-size: 0.6rem;
        }
      }

      .progress-line {
        width: 30px;
      }

      .order-items {
        padding: 1.25rem 1.5rem;
      }

      .order-item {
        .item-image {
          width: 50px;
          height: 50px;

          .material-icons-outlined {
            font-size: 1.25rem;
          }
        }
      }

      .shipping-info {
        padding: 1rem 1.5rem;
      }

      .order-footer {
        flex-direction: column;
        gap: 1.5rem;
        align-items: stretch;
        padding: 1.25rem 1.5rem;
      }

      .order-summary {
        min-width: 100%;
      }

      .order-actions {
        flex-direction: column;

        .btn-cancel, .btn-details {
          width: 100%;
          justify-content: center;
        }
      }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders = signal<Order[]>([]);
  loading = signal(true);

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.orders.set([]);
        this.loading.set(false);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  }

  getStatusIndex(status: string): number {
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    return statusOrder.indexOf(status);
  }

  cancelOrder(orderNumber: string): void {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.orderService.cancelOrder(orderNumber).subscribe({
        next: () => {
          this.loadOrders();
        },
        error: (err) => {
          console.error('Failed to cancel order:', err);
        }
      });
    }
  }
}
