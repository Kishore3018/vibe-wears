import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <a routerLink="/admin" class="logo">
            <span class="logo-icon">V</span>
            <span class="logo-text" *ngIf="!sidebarCollapsed()">Vibe Admin</span>
          </a>
          <button class="toggle-btn" (click)="toggleSidebar()">
            <span class="material-icons">{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <span class="material-icons">dashboard</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Dashboard</span>
          </a>
          <a routerLink="/admin/products" routerLinkActive="active" class="nav-item">
            <span class="material-icons">inventory_2</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Products</span>
          </a>
          <a routerLink="/admin/orders" routerLinkActive="active" class="nav-item">
            <span class="material-icons">shopping_bag</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Orders</span>
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
            <span class="material-icons">people</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Users</span>
          </a>
          <a routerLink="/admin/categories" routerLinkActive="active" class="nav-item">
            <span class="material-icons">category</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Categories</span>
          </a>
          <a routerLink="/admin/coupons" routerLinkActive="active" class="nav-item">
            <span class="material-icons">local_offer</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Coupons</span>
          </a>
          <a routerLink="/admin/reviews" routerLinkActive="active" class="nav-item">
            <span class="material-icons">rate_review</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Reviews</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/" class="nav-item">
            <span class="material-icons">storefront</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">View Store</span>
          </a>
          <button class="nav-item logout-btn" (click)="logout()">
            <span class="material-icons">logout</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="admin-header">
          <div class="header-left">
            <button class="mobile-menu-btn" (click)="toggleSidebar()">
              <span class="material-icons">menu</span>
            </button>
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>
          <div class="header-right">
            <div class="admin-user">
              <span class="material-icons">admin_panel_settings</span>
              <span class="user-name">{{ authService.user()?.first_name || 'Admin' }}</span>
            </div>
          </div>
        </header>
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: #f4f6f9;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 1000;
      transition: width 0.3s ease;
    }

    .sidebar-collapsed .sidebar {
      width: 70px;
    }

    .sidebar-header {
      padding: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #fff;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #c9a962 0%, #8b6914 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
    }

    .logo-text {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .toggle-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    .sidebar-collapsed .toggle-btn {
      display: none;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1.25rem;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      background: none;
      width: 100%;
      cursor: pointer;
      font-size: 0.9rem;

      .material-icons {
        font-size: 1.35rem;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
      }

      &.active {
        background: rgba(201, 169, 98, 0.2);
        color: #c9a962;
        border-left: 3px solid #c9a962;
      }
    }

    .sidebar-collapsed .nav-item {
      justify-content: center;
      padding: 1rem;

      .nav-text {
        display: none;
      }
    }

    .sidebar-footer {
      padding: 1rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logout-btn {
      color: #ef4444 !important;

      &:hover {
        background: rgba(239, 68, 68, 0.1) !important;
      }
    }

    /* Main Content */
    .main-content {
      flex: 1;
      margin-left: 260px;
      transition: margin-left 0.3s ease;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .sidebar-collapsed .main-content {
      margin-left: 70px;
    }

    .admin-header {
      background: #fff;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      color: #374151;
    }

    .page-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .admin-user {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f3f4f6;
      border-radius: 8px;
      color: #374151;

      .material-icons {
        color: #c9a962;
      }

      .user-name {
        font-weight: 500;
        font-size: 0.9rem;
      }
    }

    .content-area {
      flex: 1;
      padding: 1.5rem;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .admin-layout.sidebar-open .sidebar {
        transform: translateX(0);
      }

      .main-content {
        margin-left: 0;
      }

      .sidebar-collapsed .main-content {
        margin-left: 0;
      }

      .mobile-menu-btn {
        display: flex;
      }
    }

    @media (max-width: 640px) {
      .content-area {
        padding: 1rem;
      }

      .admin-header {
        padding: 1rem;
      }
    }
  `]
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);
  pageTitle = 'Dashboard';

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
