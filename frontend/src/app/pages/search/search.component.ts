import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, ProductListItem } from '@core/services/product.service';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent],
  template: `
    <div class="search-page">
      <div class="container">
        <!-- Search Header -->
        <div class="search-header">
          <div class="search-input-wrapper">
            <span class="material-icons">search</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              (keyup.enter)="performSearch()"
              placeholder="Search for products..."
              autofocus
            >
            @if (searchQuery) {
              <button class="clear-btn" (click)="clearSearch()">
                <span class="material-icons">close</span>
              </button>
            }
          </div>
        </div>

        @if (searchQuery) {
          <p class="results-info">
            @if (loading()) {
              Searching for "{{ searchQuery }}"...
            } @else {
              {{ total() }} results for "{{ searchQuery }}"
            }
          </p>
        }

        @if (!searchQuery && !loading()) {
          <!-- Recent & Popular Searches -->
          <div class="search-suggestions">
            @if (recentSearches().length > 0) {
              <div class="suggestion-section">
                <h3>Recent Searches</h3>
                <div class="suggestion-tags">
                  @for (term of recentSearches(); track term) {
                    <button class="suggestion-tag" (click)="searchFor(term)">
                      <span class="material-icons">history</span>
                      {{ term }}
                    </button>
                  }
                </div>
              </div>
            }

            <div class="suggestion-section">
              <h3>Popular Searches</h3>
              <div class="suggestion-tags">
                @for (term of popularSearches; track term) {
                  <button class="suggestion-tag" (click)="searchFor(term)">
                    <span class="material-icons">trending_up</span>
                    {{ term }}
                  </button>
                }
              </div>
            </div>

            <div class="suggestion-section">
              <h3>Browse Categories</h3>
              <div class="category-links">
                <a routerLink="/products" [queryParams]="{category: 'topwear'}" class="category-link">
                  <span class="material-icons-outlined">checkroom</span>
                  Topwear
                </a>
                <a routerLink="/products" [queryParams]="{category: 'ethnic-wear'}" class="category-link">
                  <span class="material-icons-outlined">business_center</span>
                  Ethnic Wear
                </a>
                <a routerLink="/category/accessories" class="category-link">
                  <span class="material-icons-outlined">watch</span>
                  Accessories
                </a>
                <a routerLink="/products" [queryParams]="{is_new_arrival: true}" class="category-link">
                  <span class="material-icons-outlined">new_releases</span>
                  New Arrivals
                </a>
              </div>
            </div>
          </div>
        }

        @if (searchQuery && loading()) {
          <div class="products-grid">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="product-skeleton"></div>
            }
          </div>
        }

        @if (searchQuery && !loading()) {
          @if (results().length === 0) {
            <div class="no-results">
              <span class="material-icons-outlined">search_off</span>
              <h3>No results found</h3>
              <p>We couldn't find any products matching "{{ searchQuery }}"</p>
              <div class="suggestions">
                <p>Suggestions:</p>
                <ul>
                  <li>Check your spelling</li>
                  <li>Try more general terms</li>
                  <li>Try different keywords</li>
                </ul>
              </div>
              <button class="btn btn-outline" (click)="clearSearch()">Clear Search</button>
            </div>
          } @else {
            <div class="products-grid">
              @for (product of results(); track product.id) {
                <app-product-card [product]="product"></app-product-card>
              }
            </div>

            @if (total() > results().length) {
              <div class="load-more">
                <button class="btn btn-outline" (click)="loadMore()" [disabled]="loadingMore()">
                  @if (loadingMore()) {
                    Loading...
                  } @else {
                    Load More Products
                  }
                </button>
              </div>
            }
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .search-page {
      padding: 2rem 0 4rem;
      min-height: calc(100vh - 200px);
    }

    .search-header {
      max-width: 700px;
      margin: 0 auto 2rem;
    }

    .search-input-wrapper {
      display: flex;
      align-items: center;
      background-color: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 50px;
      padding: 0 1.5rem;
      transition: var(--transition);

      &:focus-within {
        border-color: var(--accent-color);
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
      }

      .material-icons {
        color: var(--text-secondary);
        font-size: 1.5rem;
      }

      input {
        flex: 1;
        padding: 1rem;
        border: none;
        background: transparent;
        font-size: 1.1rem;

        &:focus {
          outline: none;
        }

        &::placeholder {
          color: var(--text-secondary);
        }
      }

      .clear-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
        display: flex;
        align-items: center;

        &:hover {
          color: var(--text-primary);
        }
      }
    }

    .results-info {
      text-align: center;
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }

    /* Search Suggestions */
    .search-suggestions {
      max-width: 800px;
      margin: 0 auto;
    }

    .suggestion-section {
      margin-bottom: 2rem;

      h3 {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .suggestion-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .suggestion-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 50px;
      cursor: pointer;
      transition: var(--transition);

      .material-icons {
        font-size: 1rem;
        color: var(--text-secondary);
      }

      &:hover {
        border-color: var(--accent-color);
        color: var(--accent-color);

        .material-icons {
          color: var(--accent-color);
        }
      }
    }

    .category-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .category-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius-lg);
      transition: var(--transition);

      .material-icons-outlined {
        font-size: 2rem;
        color: var(--accent-color);
      }

      &:hover {
        background-color: var(--accent-color);
        color: white;

        .material-icons-outlined {
          color: white;
        }
      }
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
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

    /* No Results */
    .no-results {
      text-align: center;
      padding: 4rem 2rem;

      .material-icons-outlined {
        font-size: 5rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }

      h3 {
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--text-secondary);
      }

      .suggestions {
        margin: 2rem 0;
        text-align: left;
        max-width: 300px;
        margin-left: auto;
        margin-right: auto;

        p {
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        ul {
          color: var(--text-secondary);
          padding-left: 1.5rem;

          li {
            margin-bottom: 0.25rem;
          }
        }
      }
    }

    .load-more {
      text-align: center;
      margin-top: 3rem;
    }

    /* Responsive */
    @media (max-width: 992px) {
      .products-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .products-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 576px) {
      .search-input-wrapper {
        padding: 0 1rem;

        input {
          font-size: 1rem;
        }
      }

      .products-grid {
        gap: 1rem;
      }
    }
  `]
})
export class SearchComponent implements OnInit {
  searchQuery = '';
  results = signal<ProductListItem[]>([]);
  total = signal(0);
  loading = signal(false);
  loadingMore = signal(false);
  
  recentSearches = signal<string[]>(['jeans', 'summer dress', 'sneakers']);
  popularSearches = ['T-shirts', 'Dresses', 'Jeans', 'Jackets', 'Hoodies', 'Sneakers'];
  
  private page = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchQuery = params['q'];
        this.performSearch();
      }
    });
  }

  searchFor(term: string): void {
    this.searchQuery = term;
    this.performSearch();
  }

  performSearch(): void {
    if (!this.searchQuery.trim()) return;

    this.loading.set(true);
    this.page = 1;

    // Update URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.searchQuery },
      queryParamsHandling: 'merge'
    });

    // Add to recent searches
    this.addToRecentSearches(this.searchQuery);

    this.productService.getProducts({ search: this.searchQuery, page: this.page, per_page: 12 }).subscribe({
      next: response => {
        this.results.set(response.items);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.page++;

    this.productService.getProducts({ search: this.searchQuery, page: this.page, per_page: 12 }).subscribe({
      next: response => {
        this.results.update(current => [...current, ...response.items]);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.results.set([]);
    this.total.set(0);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge'
    });
  }

  private addToRecentSearches(term: string): void {
    this.recentSearches.update(searches => {
      const filtered = searches.filter(s => s.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, 5);
    });
  }
}
