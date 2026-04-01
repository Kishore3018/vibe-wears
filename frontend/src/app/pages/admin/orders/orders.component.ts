import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminOrder } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="orders-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h2>Orders</h2>
          <span class="total-count">{{ total() }} orders</span>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card pending">
          <span class="stat-value">{{ orderCounts().pending }}</span>
          <span class="stat-label">Pending</span>
        </div>
        <div class="stat-card processing">
          <span class="stat-value">{{ orderCounts().processing }}</span>
          <span class="stat-label">Processing</span>
        </div>
        <div class="stat-card shipped">
          <span class="stat-value">{{ orderCounts().shipped }}</span>
          <span class="stat-label">Shipped</span>
        </div>
        <div class="stat-card delivered">
          <span class="stat-value">{{ orderCounts().delivered }}</span>
          <span class="stat-label">Delivered</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <span class="material-icons">search</span>
          <input 
            type="text" 
            placeholder="Search by order ID or customer..." 
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
          >
        </div>
        <div class="filter-group">
          <select [(ngModel)]="filterStatus" (change)="applyFilters()">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select [(ngModel)]="filterPayment" (change)="applyFilters()">
            <option value="">All Payment</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select [(ngModel)]="filterApproval" (change)="applyFilters()">
            <option value="">All Approval</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
          </select>
          <input type="date" [(ngModel)]="filterFromDate" (change)="applyFilters()" placeholder="From Date">
          <input type="date" [(ngModel)]="filterToDate" (change)="applyFilters()" placeholder="To Date">
        </div>
      </div>

      <!-- Orders Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Approval</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders(); track order.id) {
              <tr>
                <td>
                  <span class="order-id">#{{ order.order_number }}</span>
                </td>
                <td>
                  <div class="customer-info">
                    <span class="customer-name">{{ order.user?.full_name || 'Guest' }}</span>
                    <span class="customer-email">{{ order.user?.email }}</span>
                  </div>
                </td>
                <td>
                  <span class="items-count">{{ order.items?.length || 0 }} items</span>
                </td>
                <td>
                  <span class="order-total">{{ order.total | currency:'INR':'symbol':'1.0-0' }}</span>
                </td>
                <td>
                  <span class="payment-badge" [class]="order.payment_status">
                    {{ order.payment_status }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [class]="order.status">
                    {{ order.status }}
                  </span>
                </td>
                <td>
                  @if (order.is_approved) {
                    <span class="approval-badge approved">Approved</span>
                  } @else {
                    <span class="approval-badge pending-approval">Pending</span>
                  }
                </td>
                <td>
                  <span class="order-date">{{ order.created_at | date:'MMM d, y' }}</span>
                </td>
                <td>
                  <div class="actions">
                    @if (!order.is_approved) {
                      <button class="action-btn approve-btn" (click)="approveOrder(order)" title="Approve Order">
                        <span class="material-icons">check_circle</span>
                      </button>
                      <button class="action-btn reject-btn" (click)="rejectOrder(order)" title="Reject Order">
                        <span class="material-icons">cancel</span>
                      </button>
                    }
                    <button class="action-btn" (click)="viewOrder(order)" title="View Details">
                      <span class="material-icons">visibility</span>
                    </button>
                    <button class="action-btn" (click)="updateStatus(order)" title="Update Status">
                      <span class="material-icons">edit</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (orders().length === 0) {
          <div class="empty-state">
            <span class="material-icons">receipt_long</span>
            <h3>No orders found</h3>
            <p>Orders will appear here when customers make purchases</p>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (total() > limit) {
        <div class="pagination">
          <button [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
            <span class="material-icons">chevron_left</span>
          </button>
          <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
          <button [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
      }

      <!-- Order Details Modal -->
      @if (selectedOrder()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Order #{{ selectedOrder()?.order_number }}</h3>
              <button class="close-btn" (click)="closeModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <!-- Order Info -->
              <div class="order-details-grid">
                <div class="detail-section">
                  <h4>Customer Information</h4>
                  <p><strong>Name:</strong> {{ selectedOrder()?.user?.full_name || 'Guest' }}</p>
                  <p><strong>Email:</strong> {{ selectedOrder()?.user?.email }}</p>
                  <p><strong>Phone:</strong> {{ selectedOrder()?.user?.phone || 'N/A' }}</p>
                </div>
                <div class="detail-section">
                  <h4>Shipping Address</h4>
                  <p>{{ selectedOrder()?.shipping_full_name }}</p>
                  <p>{{ selectedOrder()?.shipping_city }}, {{ selectedOrder()?.shipping_state }} {{ selectedOrder()?.shipping_postal_code }}</p>
                  <p>Phone: {{ selectedOrder()?.shipping_phone }}</p>
                </div>
                <div class="detail-section">
                  <h4>Order Status</h4>
                  <p><span class="status-badge" [class]="selectedOrder()?.status">{{ selectedOrder()?.status }}</span></p>
                  <p><strong>Payment:</strong> <span class="payment-badge" [class]="selectedOrder()?.payment_status">{{ selectedOrder()?.payment_status }}</span></p>
                  <p><strong>Method:</strong> {{ selectedOrder()?.payment_method }}</p>
                </div>
                <div class="detail-section">
                  <h4>Order Summary</h4>
                  <p><strong>Subtotal:</strong> {{ selectedOrder()?.subtotal | currency:'INR':'symbol':'1.0-0' }}</p>
                  <p><strong>Shipping:</strong> {{ selectedOrder()?.shipping_cost | currency:'INR':'symbol':'1.0-0' }}</p>
                  @if (selectedOrder()?.discount_amount) {
                    <p><strong>Discount:</strong> -{{ selectedOrder()?.discount_amount | currency:'INR':'symbol':'1.0-0' }}</p>
                  }
                  <p class="total-line"><strong>Total:</strong> {{ selectedOrder()?.total | currency:'INR':'symbol':'1.0-0' }}</p>
                </div>
              </div>

              <!-- Order Items -->
              <div class="items-section">
                <h4>Order Items</h4>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Variant</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of selectedOrder()?.items; track item.id) {
                      <tr>
                        <td>{{ item.product_name }}</td>
                        <td>{{ item.variant_size }} / {{ item.variant_color }}</td>
                        <td>{{ item.price | currency:'INR':'symbol':'1.0-0' }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>{{ item.total | currency:'INR':'symbol':'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              @if (selectedOrder()?.tracking_number) {
                <div class="tracking-section">
                  <h4>Tracking Information</h4>
                  <p><strong>Tracking Number:</strong> {{ selectedOrder()?.tracking_number }}</p>
                  @if (selectedOrder()?.carrier) {
                    <p><strong>Carrier:</strong> {{ selectedOrder()?.carrier }}</p>
                  }
                  @if (selectedOrder()?.estimated_delivery) {
                    <p><strong>Est. Delivery:</strong> {{ selectedOrder()?.estimated_delivery | date:'MMM d, y' }}</p>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Update Status Modal -->
      @if (showStatusModal()) {
        <div class="modal-overlay" (click)="closeStatusModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Update Order Status</h3>
              <button class="close-btn" (click)="closeStatusModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Order Status</label>
                <select [(ngModel)]="statusForm.status">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div class="form-group">
                <label>Payment Status</label>
                <select [(ngModel)]="statusForm.payment_status">
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tracking Number</label>
                <input type="text" [(ngModel)]="statusForm.tracking_number" placeholder="Enter tracking number">
              </div>
              <div class="form-group">
                <label>Carrier</label>
                <input type="text" [(ngModel)]="statusForm.carrier" placeholder="e.g. FedEx, Delhivery, BlueDart">
              </div>
              <div class="form-group">
                <label>Estimated Delivery</label>
                <input type="date" [(ngModel)]="statusForm.estimated_delivery">
              </div>
              <div class="form-group">
                <label>Notes</label>
                <textarea rows="3" [(ngModel)]="statusForm.notes" placeholder="Internal notes"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeStatusModal()">Cancel</button>
              <button class="btn btn-primary" (click)="saveStatus()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Update Status' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .total-count {
      background: #f3f4f6;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      color: #6b7280;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .stat-card {
      background: #fff;
      padding: 1.25rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      border-left: 4px solid;

      &.pending { border-left-color: #f59e0b; }
      &.processing { border-left-color: #3b82f6; }
      &.shipped { border-left-color: #8b5cf6; }
      &.delivered { border-left-color: #10b981; }

      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
      }

      .stat-label {
        font-size: 0.85rem;
        color: #6b7280;
      }
    }

    /* Filters */
    .filters-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #fff;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 200px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f9fafb;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      .material-icons { color: #9ca3af; }

      input {
        flex: 1;
        border: none;
        background: none;
        font-size: 0.9rem;
        outline: none;
      }
    }

    .filter-group {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;

      select, input[type="date"] {
        padding: 0.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;
        background: #fff;
        cursor: pointer;

        &:focus {
          outline: none;
          border-color: #6366f1;
        }
      }
    }

    /* Table */
    .table-container {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      overflow: hidden;

      table {
        width: 100%;
        border-collapse: collapse;

        th, td { padding: 1rem; text-align: left; }

        th {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        td { border-bottom: 1px solid #f3f4f6; }
        tbody tr:hover { background: #f9fafb; }
      }
    }

    .order-id {
      font-weight: 600;
      color: #6366f1;
    }

    .customer-info {
      display: flex;
      flex-direction: column;
    }

    .customer-name {
      font-weight: 500;
      color: #1f2937;
    }

    .customer-email {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .items-count {
      color: #6b7280;
    }

    .order-total {
      font-weight: 600;
      color: #1f2937;
    }

    .status-badge, .payment-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .status-badge {
      &.pending { background: #fef3c7; color: #92400e; }
      &.confirmed { background: #dbeafe; color: #1e40af; }
      &.processing { background: #e0e7ff; color: #4338ca; }
      &.shipped { background: #ede9fe; color: #6d28d9; }
      &.delivered { background: #d1fae5; color: #065f46; }
      &.cancelled { background: #fee2e2; color: #991b1b; }
    }

    .payment-badge {
      &.paid { background: #d1fae5; color: #065f46; }
      &.pending { background: #fef3c7; color: #92400e; }
      &.failed { background: #fee2e2; color: #991b1b; }
      &.refunded { background: #e5e7eb; color: #374151; }
    }

    .approval-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;

      &.approved { background: #d1fae5; color: #065f46; }
      &.pending-approval { background: #fef3c7; color: #92400e; }
    }

    .order-date {
      font-size: 0.9rem;
      color: #6b7280;
    }

    .actions {
      display: flex;
      gap: 0.375rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f3f4f6;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      .material-icons { font-size: 1.1rem; color: #6b7280; }
      &:hover { background: #e5e7eb; }

      &.approve-btn {
        background: #d1fae5;
        .material-icons { color: #065f46; }
        &:hover { background: #a7f3d0; }
      }

      &.reject-btn {
        background: #fee2e2;
        .material-icons { color: #991b1b; }
        &:hover { background: #fecaca; }
      }
    }

    .empty-state {
      padding: 4rem 2rem;
      text-align: center;

      .material-icons { font-size: 4rem; color: #d1d5db; margin-bottom: 1rem; }
      h3 { margin: 0 0 0.5rem; color: #374151; }
      p { color: #9ca3af; margin: 0; }
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem;

      button {
        width: 36px;
        height: 36px;
        border: 1px solid #e5e7eb;
        background: #fff;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover:not(:disabled) { background: #f3f4f6; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }

      .page-info { font-size: 0.9rem; color: #6b7280; }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }

    .modal-content {
      background: #fff;
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      &.large { max-width: 800px; }
    }

    .modal-header {
      padding: 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }

      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #6b7280;
        &:hover { color: #1f2937; }
      }
    }

    .modal-body {
      padding: 1.25rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 1.25rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: #6366f1;
      color: #fff;
      &:hover { background: #4f46e5; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;
      &:hover { background: #e5e7eb; }
    }

    /* Order Details */
    .order-details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .detail-section {
      h4 {
        font-size: 0.9rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e5e7eb;
      }

      p {
        margin: 0.375rem 0;
        font-size: 0.9rem;
        color: #4b5563;
      }

      .total-line {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin-top: 0.75rem;
        padding-top: 0.5rem;
        border-top: 1px solid #e5e7eb;
      }
    }

    .items-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;

      h4 {
        margin: 0 0 1rem;
        font-size: 0.9rem;
        font-weight: 600;
      }
    }

    .items-table {
      width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      border-collapse: collapse;
      overflow: hidden;

      th, td { padding: 0.75rem; text-align: left; font-size: 0.85rem; }
      th { background: #f9fafb; font-weight: 600; color: #374151; }
      td { border-top: 1px solid #e5e7eb; }
    }

    .tracking-section {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;

      h4 { margin: 0 0 0.75rem; font-size: 0.9rem; }
      p { margin: 0.25rem 0; font-size: 0.9rem; color: #4b5563; }
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.375rem;
      }

      input, select, textarea {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;

        &:focus { outline: none; border-color: #6366f1; }
      }
    }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .filters-bar { flex-direction: column; align-items: stretch; }
      .order-details-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  private adminService = inject(AdminService);

  orders = signal<AdminOrder[]>([]);
  total = signal(0);
  currentPage = signal(1);
  limit = 20;
  
  selectedOrder = signal<AdminOrder | null>(null);
  showStatusModal = signal(false);
  statusOrder = signal<AdminOrder | null>(null);
  saving = signal(false);

  searchQuery = '';
  filterStatus = '';
  filterPayment = '';
  filterApproval = '';
  filterFromDate = '';
  filterToDate = '';
  private searchTimeout: any;

  orderCounts = signal({ pending: 0, processing: 0, shipped: 0, delivered: 0 });

  statusForm = {
    status: '',
    payment_status: '',
    tracking_number: '',
    carrier: '',
    estimated_delivery: '',
    notes: ''
  };

  ngOnInit(): void {
    this.loadOrders();
    this.loadOrderCounts();
  }

  loadOrders(): void {
    const params: any = {
      skip: (this.currentPage() - 1) * this.limit,
      limit: this.limit
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterPayment) params.payment_status = this.filterPayment;
    if (this.filterApproval === 'approved') params.is_approved = true;
    if (this.filterApproval === 'pending') params.is_approved = false;
    if (this.filterFromDate) params.from_date = this.filterFromDate;
    if (this.filterToDate) params.to_date = this.filterToDate;

    this.adminService.getOrders(params).subscribe({
      next: (res) => {
        this.orders.set(res.items);
        this.total.set(res.total);
      },
      error: (err) => console.error('Error loading orders:', err)
    });
  }

  loadOrderCounts(): void {
    // Get counts by status
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    const counts: any = { pending: 0, processing: 0, shipped: 0, delivered: 0 };
    
    statuses.forEach(status => {
      this.adminService.getOrders({ status, limit: 1 }).subscribe({
        next: (res) => {
          counts[status] = res.total;
          this.orderCounts.set({ ...counts });
        }
      });
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadOrders();
    }, 300);
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadOrders();
  }

  totalPages(): number {
    return Math.ceil(this.total() / this.limit);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadOrders();
  }

  viewOrder(order: AdminOrder): void {
    this.selectedOrder.set(order);
  }

  closeModal(): void {
    this.selectedOrder.set(null);
  }

  updateStatus(order: AdminOrder): void {
    this.statusOrder.set(order);
    this.statusForm = {
      status: order.status,
      payment_status: order.payment_status,
      tracking_number: order.tracking_number || '',
      carrier: order.carrier || '',
      estimated_delivery: order.estimated_delivery || '',
      notes: ''
    };
    this.showStatusModal.set(true);
  }

  closeStatusModal(): void {
    this.showStatusModal.set(false);
    this.statusOrder.set(null);
  }

  saveStatus(): void {
    const order = this.statusOrder();
    if (!order) return;

    this.saving.set(true);
    
    // Update order status with tracking info
    const statusData: any = {
      status: this.statusForm.status
    };
    if (this.statusForm.tracking_number) statusData.tracking_number = this.statusForm.tracking_number;
    if (this.statusForm.carrier) statusData.carrier = this.statusForm.carrier;
    if (this.statusForm.notes) statusData.admin_notes = this.statusForm.notes;

    this.adminService.updateOrderStatus(order.id, statusData).subscribe({
      next: () => {
        // If payment status changed, update it separately
        if (this.statusForm.payment_status !== order.payment_status) {
          this.adminService.updatePaymentStatus(order.id, this.statusForm.payment_status).subscribe({
            next: () => {
              this.closeStatusModal();
              this.loadOrders();
              this.loadOrderCounts();
              this.saving.set(false);
              alert('Order updated successfully!');
            },
            error: (err) => {
              console.error('Error updating payment status:', err);
              alert(err.error?.detail || 'Error updating payment status');
              this.saving.set(false);
            }
          });
        } else {
          this.closeStatusModal();
          this.loadOrders();
          this.loadOrderCounts();
          this.saving.set(false);
          alert('Order updated successfully!');
        }
      },
      error: (err) => {
        console.error('Error updating order:', err);
        alert(err.error?.detail || 'Error updating order');
        this.saving.set(false);
      }
    });
  }

  approveOrder(order: AdminOrder): void {
    if (confirm(`Are you sure you want to approve order #${order.order_number}? The customer will be able to see this order.`)) {
      this.adminService.approveOrder(order.id).subscribe({
        next: () => {
          this.loadOrders();
          alert('Order approved successfully!');
        },
        error: (err) => {
          console.error('Error approving order:', err);
          alert(err.error?.detail || 'Error approving order');
        }
      });
    }
  }

  rejectOrder(order: AdminOrder): void {
    if (confirm(`Are you sure you want to reject order #${order.order_number}? This will cancel the order and restore the stock.`)) {
      this.adminService.rejectOrder(order.id).subscribe({
        next: () => {
          this.loadOrders();
          alert('Order rejected and cancelled.');
        },
        error: (err) => {
          console.error('Error rejecting order:', err);
          alert(err.error?.detail || 'Error rejecting order');
        }
      });
    }
  }
}
