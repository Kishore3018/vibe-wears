import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
}

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-coupons">
      <div class="page-header">
        <div>
          <h1>Coupons Management</h1>
          <p class="subtitle">Create and manage discount coupons</p>
        </div>
        <button class="btn btn-primary" (click)="showCreateModal = true">
          <span class="material-icons">add</span>
          Create Coupon
        </button>
      </div>

      <div class="coupons-grid">
        @if (loading()) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading coupons...</p>
          </div>
        } @else if (coupons().length === 0) {
          <div class="empty-state">
            <span class="material-icons">local_offer</span>
            <h3>No Coupons Yet</h3>
            <p>Create your first coupon to offer discounts</p>
            <button class="btn btn-primary" (click)="showCreateModal = true">
              Create Coupon
            </button>
          </div>
        } @else {
          @for (coupon of coupons(); track coupon.id) {
            <div class="coupon-card" [class.inactive]="!coupon.is_active">
              <div class="coupon-header">
                <span class="coupon-code">{{ coupon.code }}</span>
                <span class="status-badge" [class.active]="coupon.is_active">
                  {{ coupon.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="coupon-discount">
                @if (coupon.discount_type === 'percentage') {
                  <span class="value">{{ coupon.discount_value }}%</span>
                  <span class="label">OFF</span>
                } @else {
                  <span class="value">₹{{ coupon.discount_value }}</span>
                  <span class="label">OFF</span>
                }
              </div>
              <div class="coupon-details">
                <div class="detail">
                  <span class="material-icons">shopping_cart</span>
                  <span>Min. order: ₹{{ coupon.min_order_amount }}</span>
                </div>
                <div class="detail">
                  <span class="material-icons">confirmation_number</span>
                  <span>Used: {{ coupon.used_count }}/{{ coupon.max_uses }}</span>
                </div>
                <div class="detail">
                  <span class="material-icons">event</span>
                  <span>Expires: {{ coupon.expires_at | date:'mediumDate' }}</span>
                </div>
              </div>
              <div class="coupon-actions">
                <button class="btn btn-sm" (click)="toggleStatus(coupon)">
                  {{ coupon.is_active ? 'Deactivate' : 'Activate' }}
                </button>
                <button class="btn btn-sm btn-danger" (click)="deleteCoupon(coupon)">
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
          }
        }
      </div>

      <!-- Create Modal -->
      @if (showCreateModal) {
        <div class="modal-overlay" (click)="showCreateModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Create New Coupon</h2>
              <button class="close-btn" (click)="showCreateModal = false">
                <span class="material-icons">close</span>
              </button>
            </div>
            <form (ngSubmit)="createCoupon()">
              <div class="form-group">
                <label>Coupon Code</label>
                <input type="text" [(ngModel)]="newCoupon.code" name="code" placeholder="e.g., SAVE20" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Discount Type</label>
                  <select [(ngModel)]="newCoupon.discount_type" name="discount_type">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Discount Value</label>
                  <input type="number" [(ngModel)]="newCoupon.discount_value" name="discount_value" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Min. Order Amount (₹)</label>
                  <input type="number" [(ngModel)]="newCoupon.min_order_amount" name="min_order" required>
                </div>
                <div class="form-group">
                  <label>Max Uses</label>
                  <input type="number" [(ngModel)]="newCoupon.max_uses" name="max_uses" required>
                </div>
              </div>
              <div class="form-group">
                <label>Expiry Date</label>
                <input type="date" [(ngModel)]="newCoupon.expires_at" name="expires_at" required>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn" (click)="showCreateModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Coupon</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-coupons {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 {
        font-size: 1.75rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .subtitle {
        color: #64748b;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      background: white;
      transition: all 0.2s;

      &:hover {
        background: #f8fafc;
      }

      &.btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
      }

      &.btn-danger {
        color: #ef4444;
        border-color: #fecaca;

        &:hover {
          background: #fef2f2;
        }
      }

      &.btn-sm {
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
      }

      .material-icons {
        font-size: 1.125rem;
      }
    }

    .coupons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .coupon-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 2px dashed #e2e8f0;
      position: relative;
      overflow: hidden;

      &.inactive {
        opacity: 0.6;
      }

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }
    }

    .coupon-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      .coupon-code {
        font-size: 1.25rem;
        font-weight: 700;
        font-family: monospace;
        color: #1e293b;
        letter-spacing: 2px;
      }

      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        background: #fee2e2;
        color: #991b1b;

        &.active {
          background: #dcfce7;
          color: #166534;
        }
      }
    }

    .coupon-discount {
      text-align: center;
      padding: 1.5rem 0;
      border-top: 1px dashed #e2e8f0;
      border-bottom: 1px dashed #e2e8f0;
      margin-bottom: 1rem;

      .value {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .label {
        display: block;
        color: #64748b;
        font-weight: 500;
        margin-top: 0.25rem;
      }
    }

    .coupon-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .detail {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #64748b;
        font-size: 0.875rem;

        .material-icons {
          font-size: 1rem;
        }
      }
    }

    .coupon-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .loading, .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;

      .material-icons {
        font-size: 4rem;
        color: #cbd5e1;
        margin-bottom: 1rem;
      }

      h3 {
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
      }

      p {
        color: #64748b;
        margin-bottom: 1.5rem;
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;

      h2 {
        font-size: 1.25rem;
        font-weight: 600;
      }

      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #64748b;

        &:hover {
          color: #1e293b;
        }
      }
    }

    form {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: #374151;
      }

      input, select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;

        &:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }
  `]
})
export class AdminCouponsComponent implements OnInit {
  coupons = signal<Coupon[]>([]);
  loading = signal(true);
  showCreateModal = false;

  newCoupon = {
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_order_amount: 500,
    max_uses: 100,
    expires_at: ''
  };

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {
    setTimeout(() => {
      const mockCoupons: Coupon[] = [
        {
          id: 1,
          code: 'WELCOME10',
          discount_type: 'percentage',
          discount_value: 10,
          min_order_amount: 500,
          max_uses: 1000,
          used_count: 245,
          expires_at: '2026-12-31',
          is_active: true
        },
        {
          id: 2,
          code: 'FLAT200',
          discount_type: 'fixed',
          discount_value: 200,
          min_order_amount: 1500,
          max_uses: 500,
          used_count: 123,
          expires_at: '2026-06-30',
          is_active: true
        },
        {
          id: 3,
          code: 'SUMMER25',
          discount_type: 'percentage',
          discount_value: 25,
          min_order_amount: 2000,
          max_uses: 200,
          used_count: 200,
          expires_at: '2026-03-31',
          is_active: false
        }
      ];
      this.coupons.set(mockCoupons);
      this.loading.set(false);
    }, 500);
  }

  createCoupon() {
    const coupon: Coupon = {
      id: Date.now(),
      ...this.newCoupon,
      used_count: 0,
      is_active: true
    };
    this.coupons.update(coupons => [coupon, ...coupons]);
    this.showCreateModal = false;
    this.resetForm();
  }

  toggleStatus(coupon: Coupon) {
    coupon.is_active = !coupon.is_active;
  }

  deleteCoupon(coupon: Coupon) {
    if (confirm('Are you sure you want to delete this coupon?')) {
      this.coupons.update(coupons => coupons.filter(c => c.id !== coupon.id));
    }
  }

  resetForm() {
    this.newCoupon = {
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 500,
      max_uses: 100,
      expires_at: ''
    };
  }
}
