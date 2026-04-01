import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService, ProductListItem, Category } from '@core/services/product.service';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <span class="hero-badge">Exclusive Collection 2026</span>
        <h1>Elevate Your<br/><span class="text-gold">Elegance</span></h1>
        <p>Discover timeless men's fashion pieces crafted for the distinguished gentleman. Where luxury meets contemporary style.</p>
        <div class="hero-buttons">
          <a routerLink="/products" class="btn btn-secondary">Explore Collection</a>
          <a routerLink="/products" [queryParams]="{is_new_arrival: true}" class="btn btn-outline-light">New Arrivals</a>
        </div>
        <div class="hero-features">
          <div class="hero-feature">
            <span class="material-icons-outlined">verified</span>
            <span>Premium Quality</span>
          </div>
          <div class="hero-feature">
            <span class="material-icons-outlined">local_shipping</span>
            <span>Free Shipping</span>
          </div>
          <div class="hero-feature">
            <span class="material-icons-outlined">support_agent</span>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
      <div class="hero-image">
        <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1200&q=80" alt="Men's Fashion">
        <div class="hero-image-overlay"></div>
      </div>
      <div class="scroll-indicator">
        <span>Scroll</span>
        <div class="scroll-line"></div>
      </div>
    </section>

    <!-- Brand Marquee -->
    <section class="brand-marquee">
      <div class="marquee-track">
        <span>Premium Men's Fashion</span>
        <span class="divider">✦</span>
        <span>Timeless Elegance</span>
        <span class="divider">✦</span>
        <span>Exclusive Men's Designs</span>
        <span class="divider">✦</span>
        <span>Luxury Experience</span>
        <span class="divider">✦</span>
        <span>Premium Men's Fashion</span>
        <span class="divider">✦</span>
        <span>Timeless Elegance</span>
        <span class="divider">✦</span>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="categories section">
      <div class="container">
        <div class="section-header">
          <span class="section-subtitle">Curated For Him</span>
          <h2>Shop by Category</h2>
          <p>Explore our carefully curated men's collections designed for every occasion</p>
        </div>
        <div class="category-grid">
          @for (category of categories(); track category.id; let i = $index) {
            <a [routerLink]="['/category', category.slug]" class="category-card" [style.animation-delay]="i * 0.1 + 's'">
              <div class="category-image">
                <img [src]="category.image_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80'" [alt]="category.name">
              </div>
              <div class="category-overlay"></div>
              <div class="category-info">
                <span class="category-number">0{{ i + 1 }}</span>
                <h3>{{ category.name }}</h3>
                <span class="category-link">Discover <span class="material-icons">east</span></span>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="products-section section bg-secondary">
      <div class="container">
        <div class="section-header">
          <span class="section-subtitle">Hand Selected</span>
          <h2>Featured Products</h2>
          <p>Discover our most coveted pieces, chosen for their exceptional quality and design</p>
        </div>
        <div class="products-grid">
          @if (loadingFeatured()) {
            @for (i of [1,2,3,4]; track i) {
              <div class="product-skeleton"></div>
            }
          } @else {
            @for (product of featuredProducts(); track product.id) {
              <app-product-card [product]="product"></app-product-card>
            }
          }
        </div>
        <div class="section-footer">
          <a routerLink="/products" [queryParams]="{is_featured: true}" class="view-all-link">
            View All Featured
            <span class="link-arrow">
              <span class="material-icons">arrow_forward</span>
            </span>
          </a>
        </div>
      </div>
    </section>

    <!-- Luxury Banner Section -->
    <section class="luxury-banner">
      <div class="container">
        <div class="banner-grid">
          <div class="banner-card main-banner">
            <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80" alt="Summer Collection">
            <div class="banner-overlay">
              <span class="banner-tag">Limited Edition</span>
              <h3>Summer<br/>Collection</h3>
              <p>Up to 40% Off Selected Items</p>
              <a routerLink="/products" class="btn btn-secondary">Shop Now</a>
            </div>
          </div>
          <div class="banner-side">
            <div class="banner-card">
              <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80" alt="Topwear Collection">
              <div class="banner-overlay">
                <h4>Topwear</h4>
                <a routerLink="/products" [queryParams]="{category: 'topwear'}" class="banner-link">Explore <span class="material-icons">east</span></a>
              </div>
            </div>
            <div class="banner-card">
              <img src="https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=600&q=80" alt="Ethnic Wear Collection">
              <div class="banner-overlay">
                <h4>Ethnic Wear</h4>
                <a routerLink="/products" [queryParams]="{category: 'ethnic-wear'}" class="banner-link">Explore <span class="material-icons">east</span></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- New Arrivals -->
    <section class="products-section section">
      <div class="container">
        <div class="section-header">
          <span class="section-subtitle">Just Landed</span>
          <h2>New Arrivals</h2>
          <p>Fresh styles straight from our latest collection</p>
        </div>
        <div class="products-grid">
          @if (loadingNewArrivals()) {
            @for (i of [1,2,3,4]; track i) {
              <div class="product-skeleton"></div>
            }
          } @else {
            @for (product of newArrivals(); track product.id) {
              <app-product-card [product]="product"></app-product-card>
            }
          }
        </div>
        <div class="section-footer">
          <a routerLink="/products" [queryParams]="{is_new_arrival: true}" class="view-all-link">
            View All New Arrivals
            <span class="link-arrow">
              <span class="material-icons">arrow_forward</span>
            </span>
          </a>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features section-dark section">
      <div class="container">
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">
              <span class="material-icons-outlined">local_shipping</span>
            </div>
            <h4>Complimentary Shipping</h4>
            <p>Free shipping on all orders over ₹999</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <span class="material-icons-outlined">autorenew</span>
            </div>
            <h4>Easy Returns</h4>
            <p>30-day hassle-free return policy</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <span class="material-icons-outlined">shield</span>
            </div>
            <h4>Secure Payment</h4>
            <p>100% secure checkout experience</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <span class="material-icons-outlined">headset_mic</span>
            </div>
            <h4>Premium Support</h4>
            <p>Dedicated 24/7 customer care</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Best Sellers -->
    <section class="products-section section bg-secondary">
      <div class="container">
        <div class="section-header">
          <span class="section-subtitle">Most Loved</span>
          <h2>Best Sellers</h2>
          <p>Our customers' favorites, loved for their quality and style</p>
        </div>
        <div class="products-grid">
          @if (loadingBestSellers()) {
            @for (i of [1,2,3,4]; track i) {
              <div class="product-skeleton"></div>
            }
          } @else {
            @for (product of bestSellers(); track product.id) {
              <app-product-card [product]="product"></app-product-card>
            }
          }
        </div>
        <div class="section-footer">
          <a routerLink="/products" [queryParams]="{sort_by: 'popular'}" class="view-all-link">
            View All Best Sellers
            <span class="link-arrow">
              <span class="material-icons">arrow_forward</span>
            </span>
          </a>
        </div>
      </div>
    </section>

    <!-- Newsletter Section -->
    <section class="newsletter section">
      <div class="newsletter-bg"></div>
      <div class="container">
        <div class="newsletter-content">
          <span class="section-subtitle">Stay Connected</span>
          <h2>Join Our <span class="text-gold">Exclusive</span> Circle</h2>
          <p>Subscribe to receive early access to new collections, exclusive offers, and style inspiration.</p>
          <form class="newsletter-form" (submit)="onSubscribe($event)">
            <div class="input-wrapper">
              <input type="email" placeholder="Enter your email address" required>
              <button type="submit" class="btn btn-secondary">Subscribe</button>
            </div>
          </form>
          <span class="newsletter-note">By subscribing, you agree to our Privacy Policy</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    /* Hero Section */
    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
      background: var(--primary-color);
      position: relative;
      overflow: hidden;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 30% 50%, rgba(201, 169, 98, 0.08) 0%, transparent 50%);
      pointer-events: none;
    }

    .hero-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 4rem 6rem;
      animation: fadeInUp 1s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      z-index: 2;
    }

    .hero-badge {
      display: inline-block;
      padding: 0.6rem 1.5rem;
      background: transparent;
      border: 1px solid var(--accent-color);
      color: var(--accent-color);
      font-family: 'Montserrat', sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 2rem;
      width: fit-content;
    }

    .hero-content h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 5rem;
      font-weight: 400;
      line-height: 1.1;
      color: var(--text-light);
      margin-bottom: 2rem;
    }

    .text-gold {
      color: var(--accent-color);
    }

    .hero-content p {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.7);
      max-width: 450px;
      margin-bottom: 2.5rem;
      line-height: 1.8;
    }

    .hero-buttons {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .hero-features {
      display: flex;
      gap: 2.5rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .hero-feature {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.5px;

      .material-icons-outlined {
        font-size: 1.25rem;
        color: var(--accent-color);
      }
    }

    .hero-image {
      position: relative;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        animation: scaleIn 1.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }

    .hero-image-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to right, var(--primary-color) 0%, transparent 30%);
    }

    .scroll-indicator {
      position: absolute;
      bottom: 3rem;
      left: 6rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.7rem;
      letter-spacing: 2px;
      text-transform: uppercase;

      .scroll-line {
        width: 1px;
        height: 40px;
        background: linear-gradient(to bottom, var(--accent-color), transparent);
        animation: pulse 2s infinite;
      }
    }

    /* Brand Marquee */
    .brand-marquee {
      background: var(--bg-secondary);
      padding: 1.5rem 0;
      overflow: hidden;
    }

    .marquee-track {
      display: flex;
      align-items: center;
      gap: 3rem;
      animation: marquee 20s linear infinite;
      white-space: nowrap;

      span {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--text-secondary);
        letter-spacing: 2px;
      }

      .divider {
        color: var(--accent-color);
        font-size: 0.75rem;
      }
    }

    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* Section Styles */
    .section {
      padding: 7rem 0;
    }

    .section-header {
      text-align: center;
      margin-bottom: 4rem;

      .section-subtitle {
        display: inline-block;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 4px;
        color: var(--accent-color);
        margin-bottom: 1rem;
        position: relative;
        padding: 0 2.5rem;

        &::before,
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 30px;
          height: 1px;
          background: var(--accent-color);
        }

        &::before { right: 100%; }
        &::after { left: 100%; }
      }

      h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 3rem;
        font-weight: 500;
        margin-bottom: 1rem;
        color: var(--text-primary);
      }

      p {
        font-size: 1rem;
        color: var(--text-secondary);
        max-width: 550px;
        margin: 0 auto;
        line-height: 1.8;
      }
    }

    .section-footer {
      text-align: center;
      margin-top: 3.5rem;
    }

    .view-all-link {
      display: inline-flex;
      align-items: center;
      gap: 1rem;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-primary);
      transition: var(--transition);

      .link-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: 1px solid var(--border-color);
        transition: var(--transition);

        .material-icons {
          font-size: 1.25rem;
          transition: var(--transition);
        }
      }

      &:hover {
        color: var(--accent-color);

        .link-arrow {
          background: var(--accent-color);
          border-color: var(--accent-color);

          .material-icons {
            color: var(--primary-color);
            transform: translateX(3px);
          }
        }
      }
    }

    /* Categories */
    .category-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
    }

    .category-card {
      position: relative;
      overflow: hidden;
      aspect-ratio: 3/4;
      animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) backwards;

      &:hover {
        .category-image img {
          transform: scale(1.1);
        }

        .category-overlay {
          background: rgba(10, 10, 15, 0.4);
        }

        .category-link .material-icons {
          transform: translateX(5px);
        }
      }
    }

    .category-image {
      position: absolute;
      inset: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }

    .category-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(10, 10, 15, 0.8) 0%, rgba(10, 10, 15, 0.2) 50%, transparent 100%);
      transition: var(--transition);
    }

    .category-info {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 2rem;
      color: var(--text-light);

      .category-number {
        display: block;
        font-family: 'Cormorant Garamond', serif;
        font-size: 3rem;
        font-weight: 300;
        color: var(--accent-color);
        opacity: 0.6;
        line-height: 1;
        margin-bottom: 0.5rem;
      }

      h3 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.5rem;
        font-weight: 500;
        margin-bottom: 0.75rem;
        letter-spacing: 1px;
      }
    }

    .category-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--accent-color);

      .material-icons {
        font-size: 1rem;
        transition: transform 0.4s ease;
      }
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
    }

    .product-skeleton {
      aspect-ratio: 3/4;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Luxury Banner Section */
    .luxury-banner {
      padding: 5rem 0;
      background: var(--bg-primary);
    }

    .banner-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 2rem;
      min-height: 600px;
    }

    .banner-side {
      display: grid;
      gap: 2rem;
    }

    .banner-card {
      position: relative;
      overflow: hidden;
      height: 100%;

      &.main-banner {
        min-height: 600px;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }

      &:hover img {
        transform: scale(1.05);
      }
    }

    .banner-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 3rem;
      background: linear-gradient(to top, rgba(10, 10, 15, 0.85) 0%, rgba(10, 10, 15, 0.3) 50%, transparent 100%);
      color: var(--text-light);

      h3 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 3rem;
        font-weight: 400;
        margin-bottom: 0.5rem;
        line-height: 1.1;
      }

      h4 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.75rem;
        font-weight: 400;
        margin-bottom: 0.5rem;
      }

      p {
        font-size: 1rem;
        margin-bottom: 1.5rem;
        opacity: 0.8;
      }
    }

    .banner-tag {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: var(--accent-color);
      color: var(--primary-color);
      font-family: 'Montserrat', sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 1rem;
      width: fit-content;
    }

    .banner-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--accent-color);
      font-family: 'Montserrat', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;

      .material-icons {
        font-size: 1rem;
        transition: transform 0.4s ease;
      }

      &:hover .material-icons {
        transform: translateX(5px);
      }
    }

    /* Features */
    .section-dark {
      background: var(--primary-color);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3rem;
    }

    .feature-item {
      text-align: center;
      padding: 2.5rem 1.5rem;

      .feature-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        border: 1px solid var(--accent-color);
        margin-bottom: 1.5rem;
        transition: var(--transition);

        .material-icons-outlined {
          font-size: 2rem;
          color: var(--accent-color);
        }
      }

      &:hover .feature-icon {
        background: var(--accent-color);

        .material-icons-outlined {
          color: var(--primary-color);
        }
      }

      h4 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.25rem;
        color: var(--text-light);
        margin-bottom: 0.75rem;
      }

      p {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
      }
    }

    /* Newsletter */
    .newsletter {
      background: var(--primary-color);
      position: relative;
      overflow: hidden;
    }

    .newsletter-bg {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 70% 50%, rgba(201, 169, 98, 0.1) 0%, transparent 50%);
    }

    .newsletter-content {
      text-align: center;
      max-width: 650px;
      margin: 0 auto;
      position: relative;
      z-index: 1;

      .section-subtitle {
        color: var(--accent-color);
        display: block;
        margin-bottom: 1rem;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 4px;
      }

      h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 3rem;
        color: var(--text-light);
        margin-bottom: 1rem;
      }

      p {
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 2.5rem;
        font-size: 1rem;
        line-height: 1.8;
      }
    }

    .newsletter-form {
      .input-wrapper {
        display: flex;
        gap: 0;
        max-width: 500px;
        margin: 0 auto;
      }

      input {
        flex: 1;
        padding: 1.25rem 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-right: none;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-light);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;

        &::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        &:focus {
          outline: none;
          border-color: var(--accent-color);
        }
      }

      .btn {
        border: 1px solid var(--accent-color);
      }
    }

    .newsletter-note {
      display: block;
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.5px;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .products-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .hero-content h1 {
        font-size: 4rem;
      }
    }

    @media (max-width: 992px) {
      .hero {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .hero-content {
        padding: 8rem 2rem 4rem;
        text-align: center;
        align-items: center;
        order: 2;
      }

      .hero-content h1 {
        font-size: 3rem;
      }

      .hero-image {
        height: 50vh;
        order: 1;
      }

      .hero-image-overlay {
        background: linear-gradient(to top, var(--primary-color) 0%, transparent 50%);
      }

      .scroll-indicator {
        display: none;
      }

      .hero-features {
        flex-wrap: wrap;
        justify-content: center;
      }

      .category-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .banner-grid {
        grid-template-columns: 1fr;
      }

      .banner-card.main-banner {
        min-height: 400px;
      }

      .features-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .hero-content h1 {
        font-size: 2.5rem;
      }

      .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .hero-buttons {
        flex-direction: column;
        width: 100%;
        max-width: 280px;
      }

      .section-header h2 {
        font-size: 2.25rem;
      }
    }

    @media (max-width: 576px) {
      .hero-content {
        padding: 6rem 1.5rem 3rem;
      }

      .hero-content h1 {
        font-size: 2rem;
      }

      .category-grid {
        grid-template-columns: 1fr;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }

      .newsletter-form .input-wrapper {
        flex-direction: column;

        input {
          border-right: 1px solid rgba(255, 255, 255, 0.2);
          border-bottom: none;
        }
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  categories = signal<Category[]>([]);
  featuredProducts = signal<ProductListItem[]>([]);
  newArrivals = signal<ProductListItem[]>([]);
  bestSellers = signal<ProductListItem[]>([]);
  
  loadingFeatured = signal(true);
  loadingNewArrivals = signal(true);
  loadingBestSellers = signal(true);

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    // Load categories (filter out women and kids for men's only store)
    this.productService.getCategories().subscribe(categories => {
      const mensCategories = categories.filter(cat => 
        !['women', 'kids'].includes(cat.slug.toLowerCase())
      );
      this.categories.set(mensCategories.slice(0, 4));
    });

    // Load featured products
    this.productService.getFeaturedProducts(4).subscribe({
      next: products => {
        this.featuredProducts.set(products);
        this.loadingFeatured.set(false);
      },
      error: () => this.loadingFeatured.set(false)
    });

    // Load new arrivals
    this.productService.getNewArrivals(4).subscribe({
      next: products => {
        this.newArrivals.set(products);
        this.loadingNewArrivals.set(false);
      },
      error: () => this.loadingNewArrivals.set(false)
    });

    // Load best sellers
    this.productService.getBestSellers(4).subscribe({
      next: products => {
        this.bestSellers.set(products);
        this.loadingBestSellers.set(false);
      },
      error: () => this.loadingBestSellers.set(false)
    });
  }

  onSubscribe(event: Event): void {
    event.preventDefault();
    // TODO: Implement newsletter subscription
    alert('Thank you for subscribing!');
  }
}
