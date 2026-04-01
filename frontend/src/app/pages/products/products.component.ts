import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, ProductListItem, ProductFilters, Category } from '@core/services/product.service';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent],
  template: `
    <div class="products-page">
      <div class="container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a routerLink="/">Home</a>
          <span>/</span>
          @if (currentCategory()) {
            <span>{{ currentCategory()!.name }}</span>
          } @else {
            <span>All Products</span>
          }
        </nav>

        <div class="page-layout">
          <!-- Sidebar Filters -->
          <aside class="filters-sidebar" [class.open]="filterSidebarOpen()">
            <div class="filters-header">
              <h3>Filters</h3>
              <button class="close-btn" (click)="toggleFilterSidebar()">
                <span class="material-icons">close</span>
              </button>
            </div>

            <!-- Categories -->
            <div class="filter-group">
              <h4>Categories</h4>
              <ul class="filter-list">
                <li>
                  <a routerLink="/products" [class.active]="!filters.category">All Products</a>
                </li>
                @for (cat of categories(); track cat.id) {
                  <li>
                    <a [routerLink]="['/category', cat.slug]" [class.active]="filters.category === cat.slug">{{ cat.name }}</a>
                  </li>
                }
              </ul>
            </div>

            <!-- Price Range -->
            <div class="filter-group">
              <h4>Price Range</h4>
              <div class="price-inputs">
                <input type="number" placeholder="Min" [(ngModel)]="filters.min_price" (change)="applyFilters()">
                <span>to</span>
                <input type="number" placeholder="Max" [(ngModel)]="filters.max_price" (change)="applyFilters()">
              </div>
            </div>

            <!-- Reset Filters -->
            <button class="btn btn-outline" (click)="resetFilters()">Reset Filters</button>
          </aside>

          <!-- Products Grid -->
          <main class="products-main">
            <!-- Toolbar -->
            <div class="products-toolbar">
              <div class="toolbar-left">
                <button class="filter-toggle" (click)="toggleFilterSidebar()">
                  <span class="material-icons">filter_list</span>
                  Filters
                </button>
                <span class="results-count">{{ total() }} products found</span>
              </div>
              <div class="toolbar-right">
                <select [(ngModel)]="filters.sort_by" (change)="applyFilters()">
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            <!-- Products Grid -->
            @if (loading()) {
              <div class="products-grid">
                @for (i of [1,2,3,4,5,6,7,8]; track i) {
                  <div class="product-skeleton"></div>
                }
              </div>
            } @else if (products().length === 0) {
              <div class="empty-state">
                <span class="material-icons-outlined">inventory_2</span>
                <h3>No Products Found</h3>
                <p>Try adjusting your filters or search criteria</p>
                <button class="btn btn-primary" (click)="resetFilters()">Clear Filters</button>
              </div>
            } @else {
              <div class="products-grid">
                @for (product of products(); track product.id) {
                  <app-product-card [product]="product"></app-product-card>
                }
              </div>
            }

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="pagination">
                <button 
                  class="page-btn" 
                  [disabled]="currentPage() === 1"
                  (click)="goToPage(currentPage() - 1)"
                >
                  <span class="material-icons">chevron_left</span>
                </button>
                
                @for (page of getPageNumbers(); track page) {
                  <button 
                    class="page-btn" 
                    [class.active]="page === currentPage()"
                    (click)="goToPage(page)"
                  >
                    {{ page }}
                  </button>
                }
                
                <button 
                  class="page-btn" 
                  [disabled]="currentPage() === totalPages()"
                  (click)="goToPage(currentPage() + 1)"
                >
                  <span class="material-icons">chevron_right</span>
                </button>
              </div>
            }
          </main>
        </div>
      </div>
    </div>

    <!-- Mobile Filter Overlay -->
    @if (filterSidebarOpen()) {
      <div class="filter-overlay" (click)="toggleFilterSidebar()"></div>
    }
  `,
  styles: [`
    .products-page {
      padding: 2rem 0 4rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;

      a {
        color: var(--text-secondary);

        &:hover {
          color: var(--accent-color);
        }
      }

      span {
        color: var(--text-secondary);
      }
    }

    .page-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
    }

    /* Filters Sidebar */
    .filters-sidebar {
      background-color: var(--bg-primary);
      padding: 1.5rem;
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-sm);
      height: fit-content;
      position: sticky;
      top: 100px;
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      h3 {
        margin: 0;
        font-size: 1.25rem;
      }

      .close-btn {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
      }
    }

    .filter-group {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);

      h4 {
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 1rem;
      }
    }

    .filter-list {
      list-style: none;

      li {
        margin-bottom: 0.5rem;
      }

      a {
        display: block;
        padding: 0.5rem 0;
        color: var(--text-secondary);
        transition: var(--transition);

        &:hover, &.active {
          color: var(--accent-color);
          padding-left: 0.5rem;
        }

        &.active {
          font-weight: 500;
        }
      }
    }

    .price-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);

        &:focus {
          outline: none;
          border-color: var(--accent-color);
        }
      }

      span {
        color: var(--text-secondary);
      }
    }

    /* Products Main */
    .products-main {
      min-height: 60vh;
    }

    .products-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius);
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .filter-toggle {
      display: none;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      cursor: pointer;
      font-weight: 500;

      &:hover {
        border-color: var(--text-primary);
      }
    }

    .results-count {
      color: var(--text-secondary);
    }

    .toolbar-right select {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background-color: var(--bg-primary);
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: var(--accent-color);
      }
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .product-skeleton {
      aspect-ratio: 3/4;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--border-radius-lg);
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;

      .material-icons-outlined {
        font-size: 4rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }

      h3 {
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--text-secondary);
        margin-bottom: 1.5rem;
      }
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-top: 3rem;
    }

    .page-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      height: 40px;
      padding: 0 0.75rem;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: var(--transition);

      &:hover:not(:disabled) {
        border-color: var(--accent-color);
        color: var(--accent-color);
      }

      &.active {
        background-color: var(--accent-color);
        border-color: var(--accent-color);
        color: var(--text-light);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    /* Filter Overlay */
    .filter-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .products-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 992px) {
      .page-layout {
        grid-template-columns: 1fr;
      }

      .filters-sidebar {
        position: fixed;
        top: 0;
        left: -320px;
        width: 300px;
        height: 100vh;
        z-index: 1000;
        border-radius: 0;
        overflow-y: auto;
        transition: left 0.3s ease;

        &.open {
          left: 0;
        }
      }

      .filters-header .close-btn {
        display: block;
      }

      .filter-toggle {
        display: flex;
      }

      .filter-overlay {
        display: block;
      }
    }

    @media (max-width: 576px) {
      .products-toolbar {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .toolbar-left {
        justify-content: space-between;
      }

      .toolbar-right select {
        width: 100%;
      }

      .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }
    }
  `]
})
export class ProductsComponent implements OnInit {
  products = signal<ProductListItem[]>([]);
  categories = signal<Category[]>([]);
  currentCategory = signal<Category | null>(null);
  loading = signal(true);
  filterSidebarOpen = signal(false);
  
  total = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);
  
  filters: ProductFilters = {
    page: 1,
    per_page: 12,
    sort_by: 'newest'
  };

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load categories (filter out women and kids for men's only store)
    this.productService.getCategories().subscribe(categories => {
      const mensCategories = categories.filter(cat => 
        !['women', 'kids'].includes(cat.slug.toLowerCase())
      );
      this.categories.set(mensCategories);
    });

    // Watch for route changes
    this.route.params.subscribe(params => {
      if (params['slug']) {
        this.filters.category = params['slug'];
        this.loadCategoryInfo(params['slug']);
      } else {
        this.filters.category = undefined;
        this.currentCategory.set(null);
      }
      this.loadProducts();
    });

    // Watch for query params
    this.route.queryParams.subscribe(params => {
      if (params['is_featured']) this.filters.is_featured = params['is_featured'] === 'true';
      if (params['is_new_arrival']) this.filters.is_new_arrival = params['is_new_arrival'] === 'true';
      if (params['sort_by']) this.filters.sort_by = params['sort_by'];
      if (params['search']) this.filters.search = params['search'];
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts(this.filters).subscribe({
      next: response => {
        this.products.set(response.items);
        this.total.set(response.total);
        this.currentPage.set(response.page);
        this.totalPages.set(response.total_pages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadCategoryInfo(slug: string): void {
    this.productService.getCategory(slug).subscribe({
      next: category => {
        this.currentCategory.set(category);
      },
      error: () => {
        this.currentCategory.set(null);
      }
    });
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadProducts();
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      per_page: 12,
      sort_by: 'newest',
      category: this.filters.category
    };
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.filters.page = page;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const current = this.currentPage();
    const total = this.totalPages();
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(5, total);
      } else {
        start = Math.max(1, total - 4);
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  toggleFilterSidebar(): void {
    this.filterSidebarOpen.update(v => !v);
  }
}
