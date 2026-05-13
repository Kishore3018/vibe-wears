import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { ProductService, Category } from '@core/services/product.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <!-- Top bar -->
    <div class="top-bar">
      <div class="container">
        <div class="top-bar-content">
          <span>{{ labels().topBar }}</span>
          <div class="top-bar-links">
            <a routerLink="/track-order">{{ labels().trackOrder }}</a>
            <a routerLink="/help">{{ labels().help }}</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Header -->
    <header class="header" [class.scrolled]="isScrolled()">
      <div class="container">
        <div class="header-content">
          <!-- Logo -->
          <a routerLink="/" class="logo">
            <h1>VIBE WEARS</h1>
          </a>

          <!-- Navigation -->
          <nav class="main-nav" [class.active]="mobileMenuOpen()">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">{{ labels().home }}</a>
            <div class="nav-dropdown">
              <a routerLink="/products" routerLinkActive="active">{{ labels().shop }}</a>
              <div class="dropdown-menu">
                @for (category of categories(); track category.id) {
                  <a [routerLink]="['/category', category.slug]">{{ category.name }}</a>
                }
              </div>
            </div>
            <a routerLink="/products" [queryParams]="{is_new_arrival: true}" routerLinkActive="active">{{ labels().newArrivals }}</a>
            <a routerLink="/products" [queryParams]="{is_featured: true}" routerLinkActive="active">{{ labels().featured }}</a>
          </nav>

          <!-- Header Actions -->
          <div class="header-actions">
            <!-- Search -->
            <div class="search-wrapper" [class.active]="searchOpen()">
              <input 
                type="text" 
                [placeholder]="labels().search" 
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
              >
              <button class="search-btn" (click)="toggleSearch()">
                <span class="material-icons">{{ searchOpen() ? 'close' : 'search' }}</span>
              </button>
            </div>

            <!-- User -->
            @if (authService.isLoggedIn()) {
              <div class="user-dropdown">
                <button class="icon-btn">
                  <span class="material-icons-outlined">person</span>
                </button>
                <div class="dropdown-menu">
                  <div class="user-info">
                    <span>{{ labels().hello }} {{ authService.fullName() }}</span>
                  </div>
                  @if (authService.isAdmin()) {
                    <a routerLink="/admin" class="admin-link">
                      <span class="material-icons">admin_panel_settings</span>
                      {{ labels().admin }}
                    </a>
                  }
                  <a routerLink="/account/profile">{{ labels().profile }}</a>
                  <a routerLink="/account/orders">{{ labels().orders }}</a>
                  <a routerLink="/account/wishlist">{{ labels().wishlist }}</a>
                  <a (click)="authService.logout()">{{ labels().logout }}</a>
                </div>
              </div>
            } @else {
              <a routerLink="/login" class="icon-btn">
                <span class="material-icons-outlined">person</span>
              </a>
            }

            <!-- Wishlist -->
            @if (authService.isLoggedIn()) {
              <a routerLink="/account/wishlist" class="icon-btn wishlist-btn">
                <span class="material-icons-outlined">favorite_border</span>
                @if (wishlistService.count() > 0) {
                  <span class="wishlist-count">{{ wishlistService.count() }}</span>
                }
              </a>
            }

            <!-- Cart -->
            <a routerLink="/cart" class="icon-btn cart-btn">
              <span class="material-icons-outlined">shopping_bag</span>
              @if (cartService.itemCount() > 0) {
                <span class="cart-count">{{ cartService.itemCount() }}</span>
              }
            </a>

            <!-- Mobile Menu Toggle -->
            <button class="mobile-menu-btn" (click)="toggleMobileMenu()">
              <span class="material-icons">{{ mobileMenuOpen() ? 'close' : 'menu' }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Menu Overlay -->
    @if (mobileMenuOpen()) {
      <div class="mobile-overlay" (click)="toggleMobileMenu()"></div>
    }
  `,
  styles: [`
    /* Top Bar */
    .top-bar {
      background: linear-gradient(90deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      color: var(--text-light);
      padding: 0.6rem 0;
      font-size: 0.75rem;
      letter-spacing: 1px;
      font-family: 'Montserrat', sans-serif;
    }

    .top-bar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .top-bar-links {
      display: flex;
      gap: 2rem;

      a {
        color: var(--text-light);
        opacity: 0.7;
        text-transform: uppercase;
        font-size: 0.7rem;
        letter-spacing: 1.5px;
        transition: var(--transition);
        
        &:hover {
          opacity: 1;
          color: var(--accent-color);
        }
      }
    }

    /* Header */
    .header {
      position: fixed;
      top: 32px;
      left: 0;
      right: 0;
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 1000;
      transition: var(--transition);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);

      &.scrolled {
        top: 0;
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
      }
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 0;
    }

    /* Logo */
    .logo {
      h1 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.75rem;
        font-weight: 600;
        letter-spacing: 4px;
        color: var(--primary-color);
        margin: 0;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 30px;
          height: 2px;
          background: var(--accent-color);
        }
      }
    }

    /* Navigation */
    .main-nav {
      display: flex;
      align-items: center;
      gap: 3rem;

      a {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: var(--text-primary);
        position: relative;
        padding: 0.5rem 0;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 1px;
          background: var(--accent-color);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(-50%);
        }

        &:hover::after,
        &.active::after {
          width: 100%;
        }

        &:hover,
        &.active {
          color: var(--accent-color);
        }
      }
    }

    /* Dropdown */
    .nav-dropdown {
      position: relative;

      &:hover .dropdown-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: -20px;
      min-width: 220px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-lg);
      padding: 1rem 0;
      opacity: 0;
      visibility: hidden;
      transform: translateY(15px);
      transition: var(--transition);
      z-index: 100;

      a {
        display: block;
        padding: 0.75rem 1.5rem;
        font-size: 0.8rem;
        letter-spacing: 1px;
        color: var(--text-primary);

        &:hover {
          background: var(--bg-secondary);
          color: var(--accent-color);
          padding-left: 2rem;
        }

        &::after {
          display: none;
        }
      }
    }

    .user-dropdown {
      position: relative;

      &:hover .dropdown-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .dropdown-menu {
        right: 0;
        left: auto;
      }

      .user-info {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--border-color);
        font-weight: 500;
        font-size: 0.85rem;
        color: var(--accent-color);
      }

      .admin-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff !important;
        font-weight: 500;
        border-bottom: 1px solid var(--border-color);

        .material-icons {
          font-size: 1.1rem;
        }

        &:hover {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
        }
      }
    }

    /* Header Actions */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 0;
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      transition: var(--transition);
      color: var(--text-primary);

      &:hover {
        background: var(--bg-secondary);
        border-color: var(--border-color);
        color: var(--accent-color);
      }
    }

    .cart-btn {
      position: relative;
    }

    .cart-count {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--accent-color);
      color: var(--primary-color);
      font-size: 0.65rem;
      font-weight: 700;
      border-radius: 0;
      padding: 0 4px;
    }
    
    .wishlist-btn {
      position: relative;
    }

    .wishlist-count {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--accent-color);
      color: var(--primary-color);
      font-size: 0.65rem;
      font-weight: 700;
      border-radius: 0;
      padding: 0 4px;
    }

    /* Search */
    .search-wrapper {
      display: flex;
      align-items: center;
      position: relative;

      input {
        width: 0;
        padding: 0;
        border: 1px solid transparent;
        background: var(--bg-secondary);
        border-radius: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;

        &:focus {
          outline: none;
          border-color: var(--accent-color);
        }
      }

      &.active input {
        width: 220px;
        padding: 0.6rem 1rem;
        opacity: 1;
      }
    }

    .search-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: var(--transition);

      &:hover {
        background-color: var(--bg-secondary);
        border-radius: 50%;
      }
    }

    /* Mobile Menu */
    .mobile-menu-btn {
      display: none;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      cursor: pointer;
    }

    .mobile-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }

    /* Responsive */
    @media (max-width: 992px) {
      .main-nav {
        position: fixed;
        top: 0;
        right: -300px;
        width: 300px;
        height: 100vh;
        flex-direction: column;
        align-items: flex-start;
        background-color: var(--bg-primary);
        padding: 5rem 2rem 2rem;
        z-index: 1001;
        transition: right 0.3s ease;
        gap: 0;

        &.active {
          right: 0;
        }

        a {
          width: 100%;
          padding: 1rem 0;
          border-bottom: 1px solid var(--border-color);
        }
      }

      .nav-dropdown .dropdown-menu {
        position: static;
        box-shadow: none;
        opacity: 1;
        visibility: visible;
        transform: none;
        padding-left: 1rem;
      }

      .mobile-menu-btn {
        display: flex;
      }

      .mobile-overlay {
        display: block;
      }

      .search-wrapper.active input {
        width: 150px;
      }
    }

    @media (max-width: 576px) {
      .top-bar {
        display: none;
      }

      .header {
        top: 0;
      }

      .logo h1 {
        font-size: 1.25rem;
      }

      .search-wrapper.active input {
        width: 120px;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  searchQuery = '';
  categories = signal<Category[]>([]);
  isScrolled = signal(false);
  searchOpen = signal(false);
  mobileMenuOpen = signal(false);
  labels = computed(() => {
    const language = this.languageService.language();

    if (language === 'Tamil') {
      return {
        topBar: '₹999 க்கு மேல் உள்ள ஆர்டர்களுக்கு இலவச ஷிப்பிங்',
        trackOrder: 'ஆர்டரைத் தொடரவும்',
        help: 'உதவி',
        home: 'முகப்பு',
        shop: 'கடை',
        newArrivals: 'புதிய வருகைகள்',
        featured: 'சிறப்பு தேர்வுகள்',
        search: 'பொருட்களை தேடவும்...',
        hello: 'வணக்கம்,',
        admin: 'நிர்வாக குழு',
        profile: 'என் சுயவிவரம்',
        orders: 'என் ஆர்டர்கள்',
        wishlist: 'விருப்பப் பட்டியல்',
        logout: 'வெளியேறு'
      };
    }

    if (language === 'Hindi') {
      return {
        topBar: '₹999 से अधिक ऑर्डर पर मुफ्त शिपिंग',
        trackOrder: 'ऑर्डर ट्रैक करें',
        help: 'सहायता',
        home: 'होम',
        shop: 'शॉप',
        newArrivals: 'नई कलेक्शन',
        featured: 'फीचर्ड',
        search: 'प्रोडक्ट खोजें...',
        hello: 'नमस्ते,',
        admin: 'एडमिन पैनल',
        profile: 'मेरी प्रोफाइल',
        orders: 'मेरे ऑर्डर',
        wishlist: 'विशलिस्ट',
        logout: 'लॉगआउट'
      };
    }

    return {
      topBar: 'Free Shipping on orders over ₹999',
      trackOrder: 'Track Order',
      help: 'Help',
      home: 'Home',
      shop: 'Shop',
      newArrivals: 'New Arrivals',
      featured: 'Featured',
      search: 'Search products...',
      hello: 'Hello,',
      admin: 'Admin Panel',
      profile: 'My Profile',
      orders: 'My Orders',
      wishlist: 'Wishlist',
      logout: 'Logout'
    };
  });

  constructor(
    public authService: AuthService,
    public cartService: CartService,
    public wishlistService: WishlistService,
    private productService: ProductService,
    private router: Router,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // Load categories (filter out women and kids for men's only store)
    this.productService.getCategories().subscribe(categories => {
      const mensCategories = categories.filter(cat => 
        !['women', 'kids'].includes(cat.slug.toLowerCase())
      );
      this.categories.set(mensCategories);
    });

    // Load cart if logged in
    if (this.authService.isAuthenticated()) {
      this.cartService.loadCart().subscribe();
    }

    // Handle scroll
    window.addEventListener('scroll', () => {
      this.isScrolled.set(window.scrollY > 50);
    });
  }

  toggleSearch(): void {
    this.searchOpen.update(v => !v);
    if (!this.searchOpen()) {
      this.searchQuery = '';
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
      this.searchOpen.set(false);
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }
}
