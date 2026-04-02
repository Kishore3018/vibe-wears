import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="users-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h2>Users</h2>
          <span class="total-count">{{ total() }} users</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <span class="material-icons">search</span>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
          >
        </div>
        <div class="filter-group">
          <select [(ngModel)]="filterRole" (change)="loadUsers()">
            <option value="">All Users</option>
            <option value="admin">Admins</option>
            <option value="user">Customers</option>
          </select>
          <select [(ngModel)]="filterStatus" (change)="loadUsers()">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <!-- Users Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Orders</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr>
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">
                      {{ getInitials(user) }}
                    </div>
                    <div class="user-info">
                      <span class="user-name">{{ getDisplayName(user) }}</span>
                      <span class="user-email">{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="role-badge" [class.admin]="user.is_admin">
                    {{ user.is_admin ? 'Admin' : 'Customer' }}
                  </span>
                </td>
                <td>
                  <span class="orders-count">{{ user.order_count || 0 }}</span>
                </td>
                <td>
                  <span class="join-date">{{ user.created_at | date:'MMM d, y' }}</span>
                </td>
                <td>
                  <span class="status-badge" [class.active]="user.is_active">
                    {{ user.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="action-btn" (click)="viewUser(user)" title="View Details">
                      <span class="material-icons">visibility</span>
                    </button>
                    <button class="action-btn" (click)="editUser(user)" title="Edit">
                      <span class="material-icons">edit</span>
                    </button>
                    <button class="action-btn" (click)="toggleStatus(user)" [title]="user.is_active ? 'Deactivate' : 'Activate'">
                      <span class="material-icons">{{ user.is_active ? 'block' : 'check_circle' }}</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (users().length === 0) {
          <div class="empty-state">
            <span class="material-icons">people</span>
            <h3>No users found</h3>
            <p>Try adjusting your search or filters</p>
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

      <!-- User Details Modal -->
      @if (selectedUser()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>User Details</h3>
              <button class="close-btn" (click)="closeModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="user-profile">
                <div class="profile-avatar large">
                  {{ getInitials(selectedUser()!) }}
                </div>
                <h3>{{ getDisplayName(selectedUser()) }}</h3>
                <p>{{ selectedUser()?.email }}</p>
              </div>

              <div class="user-stats">
                <div class="stat">
                  <span class="stat-label">Orders</span>
                  <span class="stat-value">{{ selectedUser()?.order_count || 0 }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Total Spent</span>
                  <span class="stat-value">₹{{ selectedUser()?.total_spent || 0 | number:'1.0-0' }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Wishlist</span>
                  <span class="stat-value">{{ selectedUser()?.wishlist_count || 0 }}</span>
                </div>
              </div>

              <div class="user-details">
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">{{ selectedUser()?.phone || 'Not provided' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Role</span>
                  <span class="detail-value">
                    <span class="role-badge" [class.admin]="selectedUser()?.is_admin">
                      {{ selectedUser()?.is_admin ? 'Admin' : 'Customer' }}
                    </span>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value">
                    <span class="status-badge" [class.active]="selectedUser()?.is_active">
                      {{ selectedUser()?.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Joined</span>
                  <span class="detail-value">{{ selectedUser()?.created_at | date:'MMMM d, y' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Last Login</span>
                  <span class="detail-value">{{ selectedUser()?.last_login | date:'MMM d, y h:mm a' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Edit User Modal -->
      @if (showEditModal()) {
        <div class="modal-overlay" (click)="closeEditModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Edit User</h3>
              <button class="close-btn" (click)="closeEditModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" [(ngModel)]="editForm.full_name">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="editForm.email">
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" [(ngModel)]="editForm.phone">
              </div>
              <div class="form-row checkboxes">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="editForm.is_admin">
                  Admin Access
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="editForm.is_active">
                  Active
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeEditModal()">Cancel</button>
              <button class="btn btn-primary" (click)="saveUser()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-page {
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

    /* Filters */
    .filters-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #fff;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .search-box {
      flex: 1;
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

      select {
        padding: 0.5rem 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;
        background: #fff;
        cursor: pointer;

        &:focus { outline: none; border-color: #6366f1; }
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

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .user-avatar, .profile-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;

      &.large {
        width: 80px;
        height: 80px;
        font-size: 1.5rem;
      }
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: #1f2937;
    }

    .user-email {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      background: #f3f4f6;
      color: #6b7280;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;

      &.admin {
        background: #fef3c7;
        color: #92400e;
      }
    }

    .orders-count {
      font-weight: 500;
      color: #1f2937;
    }

    .join-date {
      font-size: 0.9rem;
      color: #6b7280;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      background: #fee2e2;
      color: #991b1b;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;

      &.active {
        background: #d1fae5;
        color: #065f46;
      }
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
      max-width: 450px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
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

    .user-profile {
      text-align: center;
      margin-bottom: 1.5rem;

      .profile-avatar {
        margin: 0 auto 1rem;
      }

      h3 {
        margin: 0 0 0.25rem;
        font-size: 1.1rem;
      }

      p {
        margin: 0;
        color: #6b7280;
      }
    }

    .user-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 1.5rem;

      .stat {
        text-align: center;

        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }
      }
    }

    .user-details {
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f3f4f6;

        &:last-child { border-bottom: none; }

        .detail-label {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .detail-value {
          font-weight: 500;
          color: #1f2937;
        }
      }
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

      input {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;

        &:focus { outline: none; border-color: #6366f1; }
      }
    }

    .form-row.checkboxes {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
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

    @media (max-width: 768px) {
      .filters-bar { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  users = signal<AdminUser[]>([]);
  total = signal(0);
  currentPage = signal(1);
  limit = 20;

  selectedUser = signal<AdminUser | null>(null);
  showEditModal = signal(false);
  editingUser = signal<AdminUser | null>(null);
  saving = signal(false);

  searchQuery = '';
  filterRole = '';
  filterStatus = '';
  private searchTimeout: any;

  editForm = {
    full_name: '',
    email: '',
    phone: '',
    is_admin: false,
    is_active: true
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    const params: any = {
      skip: (this.currentPage() - 1) * this.limit,
      limit: this.limit
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterRole === 'admin') params.is_admin = true;
    if (this.filterRole === 'user') params.is_admin = false;
    if (this.filterStatus) params.is_active = this.filterStatus === 'true';

    this.adminService.getUsers(params).subscribe({
      next: (res) => {
        this.users.set(res.items);
        this.total.set(res.total);
      },
      error: (err) => console.error('Error loading users:', err)
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadUsers();
    }, 300);
  }

  totalPages(): number {
    return Math.ceil(this.total() / this.limit);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  getDisplayName(user: AdminUser | null | undefined): string {
    if (!user) return 'No name';

    const fullName = user.full_name?.trim();
    if (fullName) return fullName;

    const first = user.first_name?.trim() || '';
    const last = user.last_name?.trim() || '';
    const combined = `${first} ${last}`.trim();

    return combined || 'No name';
  }

  getInitials(user: AdminUser): string {
    const displayName = this.getDisplayName(user);
    if (displayName !== 'No name') {
      return displayName
        .split(' ')
        .filter(part => part.length > 0)
        .map(part => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  }

  viewUser(user: AdminUser): void {
    this.selectedUser.set(user);
  }

  closeModal(): void {
    this.selectedUser.set(null);
  }

  editUser(user: AdminUser): void {
    this.editingUser.set(user);
    this.editForm = {
      full_name: user.full_name || '',
      email: user.email,
      phone: user.phone || '',
      is_admin: user.is_admin,
      is_active: user.is_active
    };
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingUser.set(null);
  }

  saveUser(): void {
    const user = this.editingUser();
    if (!user) return;

    this.saving.set(true);

    this.adminService.updateUser(user.id, this.editForm).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadUsers();
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error updating user:', err);
        alert(err.error?.detail || 'Error updating user');
        this.saving.set(false);
      }
    });
  }

  toggleStatus(user: AdminUser): void {
    if (confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) {
      this.adminService.updateUser(user.id, { is_active: !user.is_active }).subscribe({
        next: () => this.loadUsers(),
        error: (err) => console.error('Error updating user:', err)
      });
    }
  }
}
