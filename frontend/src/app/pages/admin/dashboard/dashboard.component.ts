import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, DashboardStats, RevenueData, TopProduct, RecentOrder } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="premium-dashboard">
      <!-- Welcome Section -->
      <section class="welcome-section">
        <div class="welcome-content">
          <div class="welcome-text">
            <span class="greeting">{{ getGreeting() }}</span>
            <h1>Welcome back, <span class="highlight">{{ authService.user()?.first_name || 'Admin' }}</span></h1>
            <p>Here's what's happening with your store today.</p>
          </div>
          <div class="welcome-date">
            <span class="material-icons">calendar_today</span>
            <span>{{ currentDate | date:'fullDate' }}</span>
          </div>
        </div>
        <div class="welcome-illustration">
          <div class="floating-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="quick-actions">
        <a routerLink="/admin/products" class="quick-action-btn">
          <span class="material-icons">add_circle</span>
          <span>Add Product</span>
        </a>
        <a routerLink="/admin/orders" class="quick-action-btn">
          <span class="material-icons">shopping_bag</span>
          <span>View Orders</span>
        </a>
        <a routerLink="/admin/users" class="quick-action-btn">
          <span class="material-icons">person_add</span>
          <span>Manage Users</span>
        </a>
        <a routerLink="/admin/coupons" class="quick-action-btn">
          <span class="material-icons">local_offer</span>
          <span>Create Coupon</span>
        </a>
      </section>

      <!-- Main Stats Cards -->
      <section class="stats-section">
        <div class="stat-card premium revenue">
          <div class="stat-background">
            <div class="stat-pattern"></div>
          </div>
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon-wrapper">
                <span class="material-icons">account_balance_wallet</span>
              </div>
              <div class="stat-trend positive">
                <span class="material-icons">trending_up</span>
                <span>+12.5%</span>
              </div>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ stats()?.total_revenue | currency:'INR':'symbol':'1.0-0' }}</span>
              <span class="stat-label">Total Revenue</span>
            </div>
            <div class="stat-footer">
              <span class="stat-subtitle">Lifetime earnings</span>
            </div>
          </div>
        </div>

        <div class="stat-card premium orders">
          <div class="stat-background">
            <div class="stat-pattern"></div>
          </div>
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon-wrapper">
                <span class="material-icons">shopping_cart</span>
              </div>
              <div class="stat-trend positive">
                <span class="material-icons">trending_up</span>
                <span>+8.3%</span>
              </div>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ stats()?.total_orders }}</span>
              <span class="stat-label">Total Orders</span>
            </div>
            <div class="stat-footer">
              <span class="stat-subtitle">All time orders</span>
            </div>
          </div>
        </div>

        <div class="stat-card premium products">
          <div class="stat-background">
            <div class="stat-pattern"></div>
          </div>
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon-wrapper">
                <span class="material-icons">inventory_2</span>
              </div>
              <div class="stat-badge">
                <span>{{ stats()?.low_stock_products }} low stock</span>
              </div>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ stats()?.total_products }}</span>
              <span class="stat-label">Total Products</span>
            </div>
            <div class="stat-footer">
              <span class="stat-subtitle">In your catalog</span>
            </div>
          </div>
        </div>

        <div class="stat-card premium users">
          <div class="stat-background">
            <div class="stat-pattern"></div>
          </div>
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon-wrapper">
                <span class="material-icons">groups</span>
              </div>
              <div class="stat-trend positive">
                <span class="material-icons">trending_up</span>
                <span>+5.2%</span>
              </div>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ stats()?.total_users }}</span>
              <span class="stat-label">Total Users</span>
            </div>
            <div class="stat-footer">
              <span class="stat-subtitle">Registered customers</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Today's Metrics -->
      <section class="today-metrics">
        <h2 class="section-title">
          <span class="material-icons">today</span>
          Today's Performance
        </h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon blue">
              <span class="material-icons">receipt_long</span>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ stats()?.today_orders }}</span>
              <span class="metric-label">Orders Today</span>
            </div>
            <div class="metric-sparkline blue"></div>
          </div>

          <div class="metric-card">
            <div class="metric-icon green">
              <span class="material-icons">payments</span>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ stats()?.today_revenue | currency:'INR':'symbol':'1.0-0' }}</span>
              <span class="metric-label">Revenue Today</span>
            </div>
            <div class="metric-sparkline green"></div>
          </div>

          <div class="metric-card">
            <div class="metric-icon orange">
              <span class="material-icons">pending_actions</span>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ stats()?.pending_orders }}</span>
              <span class="metric-label">Pending Orders</span>
            </div>
            <div class="metric-sparkline orange"></div>
          </div>

          <div class="metric-card highlight">
            <div class="metric-icon purple">
              <span class="material-icons">insights</span>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ stats()?.monthly_orders }}</span>
              <span class="metric-label">Monthly Orders</span>
            </div>
            <div class="metric-sparkline purple"></div>
          </div>
        </div>
      </section>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Revenue Chart -->
        <section class="card chart-card glass-effect">
          <div class="card-header">
            <div class="header-left">
              <h3>
                <span class="material-icons">bar_chart</span>
                Revenue Analytics
              </h3>
              <p class="header-subtitle">Track your earnings over time</p>
            </div>
            <div class="chart-controls">
              <button 
                [class.active]="chartDays() === 7" 
                (click)="loadRevenueChart(7)"
                class="period-btn"
              >7D</button>
              <button 
                [class.active]="chartDays() === 30" 
                (click)="loadRevenueChart(30)"
                class="period-btn"
              >30D</button>
              <button 
                [class.active]="chartDays() === 90" 
                (click)="loadRevenueChart(90)"
                class="period-btn"
              >90D</button>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-wrapper">
              <div class="chart-grid">
                @for (line of [100, 75, 50, 25, 0]; track line) {
                  <div class="grid-line">
                    <span class="grid-label">{{ (maxRevenue() * line / 100) | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                }
              </div>
              <div class="chart-bars">
                @for (data of revenueData(); track data.date; let i = $index) {
                  <div 
                    class="bar-wrapper" 
                    [title]="data.date + ': ' + (data.revenue | currency:'INR')"
                    [style.animation-delay]="i * 50 + 'ms'"
                  >
                    <div 
                      class="bar" 
                      [style.height.%]="getBarHeight(data.revenue)"
                      [class.highlighted]="i === revenueData().length - 1"
                    >
                      <div class="bar-tooltip">
                        <span class="tooltip-value">{{ data.revenue | currency:'INR':'symbol':'1.0-0' }}</span>
                        <span class="tooltip-date">{{ formatDate(data.date) }}</span>
                      </div>
                    </div>
                    <span class="bar-label">{{ formatShortDate(data.date) }}</span>
                  </div>
                }
              </div>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-dot total"></span>
                <div class="legend-info">
                  <span class="legend-label">Monthly Revenue</span>
                  <span class="legend-value">{{ stats()?.monthly_revenue | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
              </div>
              <div class="legend-item">
                <span class="legend-dot today"></span>
                <div class="legend-info">
                  <span class="legend-label">Today's Revenue</span>
                  <span class="legend-value">{{ stats()?.today_revenue | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Order Status Distribution -->
        <section class="card order-status-card glass-effect">
          <div class="card-header">
            <div class="header-left">
              <h3>
                <span class="material-icons">donut_large</span>
                Order Status
              </h3>
              <p class="header-subtitle">Distribution of orders</p>
            </div>
            <a routerLink="/admin/orders" class="view-all-btn">
              <span>View All</span>
              <span class="material-icons">arrow_forward</span>
            </a>
          </div>
          <div class="card-body">
            <div class="status-donut">
              <svg viewBox="0 0 100 100" class="donut-chart">
                <circle class="donut-ring" cx="50" cy="50" r="40"/>
                @for (segment of getDonutSegments(); track segment.key; let i = $index) {
                  <circle 
                    class="donut-segment"
                    [class]="segment.key"
                    cx="50" cy="50" r="40"
                    [style.stroke-dasharray]="segment.dashArray"
                    [style.stroke-dashoffset]="segment.dashOffset"
                    [style.animation-delay]="i * 100 + 'ms'"
                  />
                }
              </svg>
              <div class="donut-center">
                <span class="donut-total">{{ getTotalOrders() }}</span>
                <span class="donut-label">Total Orders</span>
              </div>
            </div>
            <div class="status-legend">
              @for (status of orderStatuses; track status.key) {
                <div class="status-item" [class]="status.key">
                  <div class="status-indicator">
                    <span class="status-dot"></span>
                    <span class="status-name">{{ status.label }}</span>
                  </div>
                  <div class="status-value">
                    <span class="status-count">{{ orderStats()[status.key] || 0 }}</span>
                    <span class="status-percent">{{ getStatusPercent(status.key) }}%</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Top Products -->
        <section class="card top-products-card glass-effect">
          <div class="card-header">
            <div class="header-left">
              <h3>
                <span class="material-icons">emoji_events</span>
                Top Selling Products
              </h3>
              <p class="header-subtitle">Best performers this month</p>
            </div>
            <a routerLink="/admin/products" class="view-all-btn">
              <span>View All</span>
              <span class="material-icons">arrow_forward</span>
            </a>
          </div>
          <div class="card-body">
            <div class="products-list">
              @for (product of topProducts(); track product.id; let i = $index) {
                <div class="product-item" [style.animation-delay]="i * 80 + 'ms'">
                  <div class="product-rank" [class]="getRankClass(i)">
                    @if (i < 3) {
                      <span class="material-icons">{{ i === 0 ? 'workspace_premium' : 'stars' }}</span>
                    } @else {
                      <span class="rank-number">{{ i + 1 }}</span>
                    }
                  </div>
                  <div class="product-image">
                    <img [src]="product.image_url || 'https://placehold.co/60x60/f3f4f6/9ca3af?text=No+Image'" [alt]="product.name">
                  </div>
                  <div class="product-details">
                    <span class="product-name">{{ product.name }}</span>
                    <div class="product-stats">
                      <span class="sold-badge">
                        <span class="material-icons">local_shipping</span>
                        {{ product.total_sold }} sold
                      </span>
                    </div>
                  </div>
                  <div class="product-revenue">
                    <span class="revenue-value">{{ product.revenue | currency:'INR':'symbol':'1.0-0' }}</span>
                    <span class="revenue-label">Revenue</span>
                  </div>
                </div>
              }
              @if (topProducts().length === 0) {
                <div class="empty-state">
                  <span class="material-icons">inventory_2</span>
                  <p>No products sold yet</p>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Recent Orders -->
        <section class="card recent-orders-card glass-effect">
          <div class="card-header">
            <div class="header-left">
              <h3>
                <span class="material-icons">receipt_long</span>
                Recent Orders
              </h3>
              <p class="header-subtitle">Latest customer orders</p>
            </div>
            <a routerLink="/admin/orders" class="view-all-btn">
              <span>View All</span>
              <span class="material-icons">arrow_forward</span>
            </a>
          </div>
          <div class="card-body">
            <div class="orders-table-wrapper">
              <table class="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of recentOrders(); track order.id; let i = $index) {
                    <tr [style.animation-delay]="i * 60 + 'ms'">
                      <td class="order-id">
                        <span class="id-badge">#{{ order.order_number.slice(-8) }}</span>
                      </td>
                      <td class="customer">
                        <div class="customer-avatar">
                          {{ getInitials(order.customer_name) }}
                        </div>
                        <span class="customer-name">{{ order.customer_name }}</span>
                      </td>
                      <td class="amount">{{ order.total_amount | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>
                        <span class="status-pill" [class]="order.status">
                          <span class="status-dot"></span>
                          {{ order.status }}
                        </span>
                      </td>
                      <td class="date">{{ order.created_at | date:'MMM d, y' }}</td>
                      <td class="actions">
                        <button class="action-btn" title="View Details">
                          <span class="material-icons">visibility</span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              @if (recentOrders().length === 0) {
                <div class="empty-state">
                  <span class="material-icons">shopping_bag</span>
                  <p>No orders yet</p>
                </div>
              }
            </div>
          </div>
        </section>
      </div>

      <!-- Activity & Insights -->
      <section class="insights-section">
        <div class="insight-card performance">
          <div class="insight-icon">
            <span class="material-icons">speed</span>
          </div>
          <div class="insight-content">
            <h4>Store Performance</h4>
            <p>Your store is performing <strong>12% better</strong> than last month. Keep up the great work!</p>
          </div>
          <div class="insight-graphic"></div>
        </div>

        <div class="insight-card inventory">
          <div class="insight-icon">
            <span class="material-icons">inventory</span>
          </div>
          <div class="insight-content">
            <h4>Inventory Alert</h4>
            <p><strong>{{ stats()?.low_stock_products }}</strong> products are running low on stock. Consider restocking soon.</p>
          </div>
          <a routerLink="/admin/products" class="insight-action">
            View Products
            <span class="material-icons">arrow_forward</span>
          </a>
        </div>

        <div class="insight-card pending">
          <div class="insight-icon">
            <span class="material-icons">hourglass_top</span>
          </div>
          <div class="insight-content">
            <h4>Pending Actions</h4>
            <p><strong>{{ stats()?.pending_orders }}</strong> orders awaiting processing. Review and update status.</p>
          </div>
          <a routerLink="/admin/orders" class="insight-action">
            View Orders
            <span class="material-icons">arrow_forward</span>
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .premium-dashboard {
      padding: 0.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Welcome Section */
    .welcome-section {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      border-radius: 24px;
      padding: 2rem 2.5rem;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(26, 26, 46, 0.3);
    }

    .welcome-content {
      position: relative;
      z-index: 2;
    }

    .greeting {
      display: inline-block;
      background: linear-gradient(135deg, #c9a962 0%, #ffd700 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 0.5rem;
    }

    .welcome-text h1 {
      color: #fff;
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      font-family: 'Montserrat', sans-serif;

      .highlight {
        background: linear-gradient(135deg, #c9a962 0%, #ffd700 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .welcome-text p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 1rem;
      margin: 0;
    }

    .welcome-date {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      backdrop-filter: blur(10px);
      margin-top: 1rem;

      .material-icons {
        font-size: 1.1rem;
        color: #c9a962;
      }
    }

    .welcome-illustration {
      position: absolute;
      right: 2rem;
      top: 50%;
      transform: translateY(-50%);
      width: 200px;
      height: 200px;
    }

    .floating-shapes {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      animation: float 6s ease-in-out infinite;
    }

    .shape-1 {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, rgba(201, 169, 98, 0.3), rgba(201, 169, 98, 0.1));
      top: 20%;
      right: 10%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(99, 102, 241, 0.1));
      top: 60%;
      right: 40%;
      animation-delay: 2s;
    }

    .shape-3 {
      width: 30px;
      height: 30px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(16, 185, 129, 0.1));
      top: 30%;
      right: 60%;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(10deg); }
    }

    /* Quick Actions */
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .quick-action-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: #fff;
      border-radius: 14px;
      text-decoration: none;
      color: #374151;
      font-weight: 500;
      font-size: 0.95rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;

      .material-icons {
        font-size: 1.5rem;
        color: #6366f1;
        transition: transform 0.3s;
      }

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.2);

        .material-icons {
          transform: scale(1.1);
        }
      }
    }

    /* Stats Section */
    .stats-section {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .stat-card.premium {
      position: relative;
      border-radius: 20px;
      padding: 1.5rem;
      overflow: hidden;
      min-height: 160px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: default;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      }

      &.revenue {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }

      &.orders {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      }

      &.products {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }

      &.users {
        background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
      }
    }

    .stat-background {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    .stat-pattern {
      position: absolute;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      top: -50px;
      right: -50px;
      animation: pulse-bg 3s ease-in-out infinite;
    }

    @keyframes pulse-bg {
      0%, 100% { transform: scale(1); opacity: 0.1; }
      50% { transform: scale(1.1); opacity: 0.15; }
    }

    .stat-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);

      .material-icons {
        font-size: 1.5rem;
        color: #fff;
      }
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.35rem 0.75rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #fff;

      .material-icons {
        font-size: 1rem;
      }

      &.positive {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    .stat-badge {
      padding: 0.35rem 0.75rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      color: #fff;
    }

    .stat-body {
      flex: 1;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.2;
    }

    .stat-label {
      display: block;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 500;
      margin-top: 0.25rem;
    }

    .stat-footer {
      margin-top: auto;
    }

    .stat-subtitle {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
    }

    /* Today's Metrics */
    .today-metrics {
      margin-bottom: 1.5rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1rem;

      .material-icons {
        font-size: 1.4rem;
        color: #6366f1;
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .metric-card {
      background: #fff;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;
      transition: all 0.3s;
      border: 1px solid rgba(0, 0, 0, 0.04);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
      }

      &.highlight {
        background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
        border-color: rgba(139, 92, 246, 0.2);
      }
    }

    .metric-icon {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      .material-icons {
        font-size: 1.5rem;
        color: #fff;
      }

      &.blue { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
      &.green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
      &.orange { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
      &.purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
    }

    .metric-info {
      flex: 1;
    }

    .metric-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
    }

    .metric-label {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .metric-sparkline {
      width: 60px;
      height: 30px;
      border-radius: 4px;

      &.blue { background: linear-gradient(180deg, rgba(59, 130, 246, 0.2) 0%, transparent 100%); }
      &.green { background: linear-gradient(180deg, rgba(16, 185, 129, 0.2) 0%, transparent 100%); }
      &.orange { background: linear-gradient(180deg, rgba(245, 158, 11, 0.2) 0%, transparent 100%); }
      &.purple { background: linear-gradient(180deg, rgba(139, 92, 246, 0.2) 0%, transparent 100%); }
    }

    /* Glass Effect Cards */
    .glass-effect {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    }

    /* Dashboard Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .card {
      border-radius: 20px;
      overflow: hidden;
    }

    .card-header {
      padding: 1.5rem 1.5rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      h3 {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;

        .material-icons {
          font-size: 1.3rem;
          color: #6366f1;
        }
      }
    }

    .header-subtitle {
      font-size: 0.85rem;
      color: #6b7280;
      margin: 0.25rem 0 0 2rem;
    }

    .view-all-btn {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      border-radius: 10px;
      color: #6366f1;
      font-size: 0.85rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.3s;

      .material-icons {
        font-size: 1rem;
        transition: transform 0.3s;
      }

      &:hover {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: #fff;

        .material-icons {
          transform: translateX(3px);
        }
      }
    }

    .card-body {
      padding: 0 1.5rem 1.5rem;
    }

    /* Chart Card */
    .chart-card {
      grid-row: span 1;
    }

    .chart-controls {
      display: flex;
      gap: 0.5rem;
    }

    .period-btn {
      padding: 0.5rem 1rem;
      background: #f3f4f6;
      border: none;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: #e5e7eb;
        color: #374151;
      }

      &.active {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: #fff;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }
    }

    .chart-wrapper {
      position: relative;
      padding: 1rem 0;
    }

    .chart-grid {
      position: absolute;
      inset: 1rem 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .grid-line {
      border-bottom: 1px dashed #e5e7eb;
      height: 0;
      position: relative;
    }

    .grid-label {
      position: absolute;
      left: 0;
      top: -10px;
      font-size: 0.7rem;
      color: #9ca3af;
    }

    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 220px;
      padding: 0 0 0 3.5rem;
      position: relative;
      z-index: 2;
    }

    .bar-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      animation: fadeInUp 0.5s ease forwards;
      opacity: 0;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .bar {
      width: 100%;
      max-width: 28px;
      background: linear-gradient(180deg, #818cf8 0%, #6366f1 100%);
      border-radius: 6px 6px 2px 2px;
      min-height: 4px;
      transition: all 0.4s ease;
      position: relative;
      cursor: pointer;

      &:hover {
        background: linear-gradient(180deg, #a5b4fc 0%, #818cf8 100%);
        transform: scaleY(1.02);

        .bar-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(-8px);
          visibility: visible;
        }
      }

      &.highlighted {
        background: linear-gradient(180deg, #c9a962 0%, #b8942f 100%);
      }
    }

    .bar-tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      background: #1f2937;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;

      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: #1f2937;
      }
    }

    .tooltip-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: #fff;
    }

    .tooltip-date {
      font-size: 0.7rem;
      color: #9ca3af;
    }

    .bar-label {
      font-size: 0.65rem;
      color: #9ca3af;
      margin-top: 0.5rem;
      white-space: nowrap;
    }

    .chart-legend {
      display: flex;
      gap: 2rem;
      padding-top: 1.25rem;
      margin-top: 1rem;
      border-top: 1px solid #f3f4f6;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 4px;

      &.total {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      }

      &.today {
        background: linear-gradient(135deg, #c9a962 0%, #b8942f 100%);
      }
    }

    .legend-info {
      display: flex;
      flex-direction: column;
    }

    .legend-label {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .legend-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1f2937;
    }

    /* Order Status Card */
    .order-status-card {
      .card-body {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
    }

    .status-donut {
      position: relative;
      width: 180px;
      height: 180px;
      margin: 0 auto;
    }

    .donut-chart {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .donut-ring {
      fill: none;
      stroke: #f3f4f6;
      stroke-width: 12;
    }

    .donut-segment {
      fill: none;
      stroke-width: 12;
      stroke-linecap: round;
      animation: donutDraw 1s ease forwards;
      transform-origin: center;

      &.pending { stroke: #f59e0b; }
      &.confirmed { stroke: #3b82f6; }
      &.processing { stroke: #8b5cf6; }
      &.shipped { stroke: #06b6d4; }
      &.delivered { stroke: #10b981; }
      &.cancelled { stroke: #ef4444; }
    }

    @keyframes donutDraw {
      from { stroke-dasharray: 0 251.2; }
    }

    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .donut-total {
      display: block;
      font-size: 2rem;
      font-weight: 800;
      color: #1f2937;
    }

    .donut-label {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .status-legend {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.625rem 0.875rem;
      border-radius: 10px;
      transition: background 0.2s;

      &:hover {
        background: #f9fafb;
      }
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .status-item {
      &.pending .status-dot { background: #f59e0b; }
      &.confirmed .status-dot { background: #3b82f6; }
      &.processing .status-dot { background: #8b5cf6; }
      &.shipped .status-dot { background: #06b6d4; }
      &.delivered .status-dot { background: #10b981; }
      &.cancelled .status-dot { background: #ef4444; }
    }

    .status-name {
      font-size: 0.9rem;
      color: #374151;
      font-weight: 500;
    }

    .status-value {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .status-count {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1f2937;
      min-width: 24px;
      text-align: right;
    }

    .status-percent {
      font-size: 0.75rem;
      color: #9ca3af;
      background: #f3f4f6;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      min-width: 40px;
      text-align: center;
    }

    /* Top Products Card */
    .top-products-card {
      grid-column: span 1;
    }

    .products-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .product-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.875rem;
      background: #fafafa;
      border-radius: 14px;
      transition: all 0.3s;
      animation: fadeInUp 0.5s ease forwards;
      opacity: 0;

      &:hover {
        background: #f3f4f6;
        transform: translateX(5px);
      }
    }

    .product-rank {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;

      &.gold {
        background: linear-gradient(135deg, #ffd700 0%, #c9a962 100%);
        color: #fff;
        box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
      }

      &.silver {
        background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
        color: #fff;
      }

      &.bronze {
        background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
        color: #fff;
      }

      &.default {
        background: #e5e7eb;
        color: #6b7280;
      }

      .material-icons {
        font-size: 1.2rem;
      }
    }

    .product-image {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .product-details {
      flex: 1;
      min-width: 0;
    }

    .product-name {
      display: block;
      font-size: 0.95rem;
      font-weight: 600;
      color: #1f2937;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.25rem;
    }

    .product-stats {
      display: flex;
      gap: 0.5rem;
    }

    .sold-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #6b7280;
      background: #fff;
      padding: 0.25rem 0.625rem;
      border-radius: 6px;

      .material-icons {
        font-size: 0.9rem;
      }
    }

    .product-revenue {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .revenue-value {
      font-size: 1rem;
      font-weight: 700;
      color: #10b981;
    }

    .revenue-label {
      font-size: 0.7rem;
      color: #9ca3af;
    }

    /* Recent Orders Card */
    .recent-orders-card {
      grid-column: span 2;
    }

    .orders-table-wrapper {
      overflow-x: auto;
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 1rem;
        text-align: left;
        white-space: nowrap;
      }

      th {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: #f9fafb;
        border-radius: 10px 10px 0 0;
      }

      tbody tr {
        animation: fadeInUp 0.5s ease forwards;
        opacity: 0;
        transition: background 0.2s;

        &:hover {
          background: #f9fafb;
        }
      }

      td {
        border-bottom: 1px solid #f3f4f6;
      }
    }

    .order-id {
      .id-badge {
        display: inline-block;
        padding: 0.35rem 0.75rem;
        background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
        border-radius: 8px;
        color: #6366f1;
        font-weight: 600;
        font-size: 0.85rem;
      }
    }

    .customer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .customer-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #c9a962 0%, #b8942f 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .customer-name {
      font-weight: 500;
      color: #1f2937;
    }

    .amount {
      font-weight: 700;
      color: #1f2937;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      &.pending {
        background: #fef3c7;
        color: #92400e;
        .status-dot { background: #f59e0b; }
      }

      &.confirmed {
        background: #dbeafe;
        color: #1e40af;
        .status-dot { background: #3b82f6; }
      }

      &.processing {
        background: #ede9fe;
        color: #5b21b6;
        .status-dot { background: #8b5cf6; }
      }

      &.shipped {
        background: #cffafe;
        color: #0e7490;
        .status-dot { background: #06b6d4; }
      }

      &.delivered {
        background: #d1fae5;
        color: #065f46;
        .status-dot { background: #10b981; }
      }

      &.cancelled {
        background: #fee2e2;
        color: #991b1b;
        .status-dot { background: #ef4444; }
      }
    }

    .date {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .actions {
      .action-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: #f3f4f6;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        color: #6b7280;

        &:hover {
          background: #6366f1;
          color: #fff;
        }

        .material-icons {
          font-size: 1.1rem;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #9ca3af;

      .material-icons {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      p {
        font-size: 0.95rem;
        margin: 0;
      }
    }

    /* Insights Section */
    .insights-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }

    .insight-card {
      background: #fff;
      border-radius: 18px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      border: 1px solid transparent;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      }

      &.performance {
        border-color: rgba(16, 185, 129, 0.2);
        background: linear-gradient(135deg, #fff 0%, #ecfdf5 100%);

        .insight-icon { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
      }

      &.inventory {
        border-color: rgba(245, 158, 11, 0.2);
        background: linear-gradient(135deg, #fff 0%, #fffbeb 100%);

        .insight-icon { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
      }

      &.pending {
        border-color: rgba(99, 102, 241, 0.2);
        background: linear-gradient(135deg, #fff 0%, #f5f3ff 100%);

        .insight-icon { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
      }
    }

    .insight-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      .material-icons {
        font-size: 1.5rem;
        color: #fff;
      }
    }

    .insight-content {
      h4 {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
      }

      p {
        font-size: 0.9rem;
        color: #6b7280;
        line-height: 1.5;
        margin: 0;

        strong {
          color: #1f2937;
        }
      }
    }

    .insight-action {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: #6366f1;
      text-decoration: none;
      margin-top: auto;
      transition: gap 0.3s;

      &:hover {
        gap: 0.6rem;
      }

      .material-icons {
        font-size: 1rem;
      }
    }

    /* Responsive */
    @media (max-width: 1400px) {
      .stats-section {
        grid-template-columns: repeat(2, 1fr);
      }

      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }

      .recent-orders-card {
        grid-column: span 1;
      }
    }

    @media (max-width: 1024px) {
      .quick-actions {
        grid-template-columns: repeat(2, 1fr);
      }

      .insights-section {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .welcome-section {
        padding: 1.5rem;
        flex-direction: column;
        text-align: center;
      }

      .welcome-text h1 {
        font-size: 1.5rem;
      }

      .welcome-illustration {
        display: none;
      }

      .stats-section {
        grid-template-columns: 1fr;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .quick-actions {
        grid-template-columns: 1fr;
      }

      .chart-bars {
        padding-left: 0;
        height: 160px;
      }

      .grid-label {
        display: none;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  authService = inject(AuthService);

  stats = signal<DashboardStats | null>(null);
  revenueData = signal<RevenueData[]>([]);
  topProducts = signal<TopProduct[]>([]);
  recentOrders = signal<RecentOrder[]>([]);
  orderStats = signal<Record<string, number>>({});
  chartDays = signal(30);
  currentDate = new Date();

  maxRevenue = computed(() => Math.max(...this.revenueData().map(d => d.revenue), 1));

  orderStatuses = [
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  loadDashboardData(): void {
    forkJoin({
      stats: this.adminService.getDashboardStats(),
      revenue: this.adminService.getRevenueChart(this.chartDays()),
      topProducts: this.adminService.getTopProducts(5),
      recentOrders: this.adminService.getRecentOrders(6),
      orderStats: this.adminService.getOrderStats()
    }).subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.revenueData.set(data.revenue);
        this.topProducts.set(data.topProducts);
        this.recentOrders.set(data.recentOrders);
        this.orderStats.set(data.orderStats);
      },
      error: (err) => console.error('Error loading dashboard:', err)
    });
  }

  loadRevenueChart(days: number): void {
    this.chartDays.set(days);
    this.adminService.getRevenueChart(days).subscribe({
      next: (data) => this.revenueData.set(data),
      error: (err) => console.error('Error loading revenue chart:', err)
    });
  }

  getBarHeight(revenue: number): number {
    return (revenue / this.maxRevenue()) * 100;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric' });
  }

  getTotalOrders(): number {
    const stats = this.orderStats();
    return Object.values(stats).reduce((sum, val) => sum + val, 0);
  }

  getStatusPercent(key: string): number {
    const total = this.getTotalOrders();
    if (total === 0) return 0;
    return Math.round((this.orderStats()[key] || 0) / total * 100);
  }

  getDonutSegments(): Array<{key: string, dashArray: string, dashOffset: string}> {
    const total = this.getTotalOrders();
    if (total === 0) return [];

    const circumference = 251.2; // 2 * PI * 40
    let currentOffset = 0;
    const segments: Array<{key: string, dashArray: string, dashOffset: string}> = [];

    for (const status of this.orderStatuses) {
      const count = this.orderStats()[status.key] || 0;
      const percent = count / total;
      const dashLength = circumference * percent;

      if (dashLength > 0) {
        segments.push({
          key: status.key,
          dashArray: `${dashLength} ${circumference - dashLength}`,
          dashOffset: `${-currentOffset}`
        });
        currentOffset += dashLength;
      }
    }

    return segments;
  }

  getRankClass(index: number): string {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return 'default';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
