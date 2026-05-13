import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService, ProductListItem, Category } from '@core/services/product.service';
import { LanguageService } from '@core/services/language.service';
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
        <span class="hero-badge">{{ labels().heroBadge }}</span>
        <h1>{{ labels().heroTitleLine1 }}<br/><span class="text-gold">{{ labels().heroTitleLine2 }}</span></h1>
        <p>{{ labels().heroDescription }}</p>
        <div class="hero-buttons">
          <a routerLink="/products" class="btn btn-secondary">{{ labels().explore }}</a>
          <a routerLink="/products" [queryParams]="{is_new_arrival: true}" class="btn btn-outline-light">{{ labels().newArrivals }}</a>
        </div>
        <div class="hero-features">
          <div class="hero-feature">
            <span class="material-icons-outlined">verified</span>
            <span>{{ labels().premiumQuality }}</span>
          </div>
          <div class="hero-feature">
            <span class="material-icons-outlined">local_shipping</span>
            <span>{{ labels().freeShipping }}</span>
          </div>
          <div class="hero-feature">
            <span class="material-icons-outlined">support_agent</span>
            <span>{{ labels().support }}</span>
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
          <span class="section-subtitle">{{ labels().curatedForHim }}</span>
          <h2>{{ labels().shopByCategory }}</h2>
          <p>{{ labels().categoryDescription }}</p>
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
          <span class="section-subtitle">{{ labels().featuredTitle }}</span>
          <h2>{{ labels().featuredTitle }}</h2>
          <p>{{ labels().featuredDescription }}</p>
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
            {{ labels().viewAllFeatured }}
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
            <img src="https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRGfEMvelkRwmEt-O3dDIU2KI-aXVSpRuU32oBn2T9YKl9Kd_UAvMCaIMYATuB5tAFW5VlInenMLhZbtdNFROgKvxFiihiUybb96PmWPly4" alt="Summer Collection">
            <div class="banner-overlay">
              <span class="banner-tag">Limited Edition</span>
              <h3>{{ labels().summerCollection }}</h3>
              <p>Up to 40% Off Selected Items</p>
              <a routerLink="/products" class="btn btn-secondary">{{ labels().shopNow }}</a>
            </div>
          </div>
          <div class="banner-side">
            <div class="banner-card">
              <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80" alt="Topwear Collection">
              <div class="banner-overlay">
                <h4>{{ labels().topwear }}</h4>
                <a routerLink="/products" [queryParams]="{category: 'topwear'}" class="banner-link">Explore <span class="material-icons">east</span></a>
              </div>
            </div>
            <div class="banner-card">
              <img src="https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80" alt="Bottomwear Collection">
              <div class="banner-overlay">
                <h4>{{ labels().ethnicWear }}</h4>
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
          <span class="section-subtitle">{{ labels().justLanded }}</span>
          <h2>{{ labels().newArrivals }}</h2>
          <p>{{ labels().freshStyles }}</p>
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
            {{ labels().viewAllNewArrivals }}
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
            <h4>{{ labels().complimentaryShipping }}</h4>
            <p>{{ labels().complimentaryShippingText }}</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <span class="material-icons-outlined">autorenew</span>
            </div>
            <h4>{{ labels().easyReturns }}</h4>
            <p>{{ labels().easyReturnsText }}</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <span class="material-icons-outlined">shield</span>
            </div>
            <h4>{{ labels().securePayment }}</h4>
            <p>{{ labels().securePaymentText }}</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <span class="material-icons-outlined">headset_mic</span>
            </div>
            <h4>{{ labels().premiumSupport }}</h4>
            <p>{{ labels().premiumSupportText }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Best Sellers -->
    <section class="products-section section bg-secondary">
      <div class="container">
        <div class="section-header">
          <span class="section-subtitle">{{ labels().mostLoved }}</span>
          <h2>{{ labels().bestSellers }}</h2>
          <p>{{ labels().bestSellersDescription }}</p>
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
            {{ labels().viewAllBestSellers }}
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
          <span class="section-subtitle">{{ labels().stayConnected }}</span>
          <h2 [innerHTML]="labels().joinCircle"></h2>
          <p>{{ labels().newsletterDescription }}</p>
          <form class="newsletter-form" (submit)="onSubscribe($event)">
            <div class="input-wrapper">
              <input type="email" placeholder="Enter your email address" required>
              <button type="submit" class="btn btn-secondary">{{ labels().subscribe }}</button>
            </div>
          </form>
          <span class="newsletter-note">{{ labels().privacyNote }}</span>
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
  labels = computed(() => {
    const language = this.languageService.language();

    if (language === 'Tamil') {
      return {
        heroBadge: 'எக்ஸ்க்ளூசிவ் சேகரிப்பு 2026',
        heroTitleLine1: 'உங்கள்',
        heroTitleLine2: 'நயத்தை உயர்த்துங்கள்',
        heroDescription: 'மதிப்புமிக்க ஆண்களுக்காக உருவாக்கப்பட்ட காலமற்ற ஆடைகளை கண்டறியுங்கள். ஆடம்பரம் மற்றும் நவீன பாணி ஒன்றாக.',
        explore: 'சேகரிப்பை பாருங்கள்',
        newArrivals: 'புதிய வருகைகள்',
        premiumQuality: 'பிரீமியம் தரம்',
        freeShipping: 'இலவச ஷிப்பிங்',
        support: '24/7 உதவி',
        curatedForHim: 'அவருக்காக தேர்ந்தெடுக்கப்பட்டது',
        shopByCategory: 'வகைப்படி வாங்குங்கள்',
        categoryDescription: 'எல்லா நிகழ்வுகளுக்கும் எங்களின் கவனமாக தேர்ந்தெடுத்த ஆண்களுக்கான தொகுப்புகளை ஆராயுங்கள்',
        featuredTitle: 'சிறப்பு பொருட்கள்',
        featuredDescription: 'அதிக தரமும் வடிவமைப்பும் கொண்ட எங்கள் மிக விருப்பமான தயாரிப்புகளை கண்டறியுங்கள்',
        viewAllFeatured: 'அனைத்து சிறப்பு பொருட்களையும் பாருங்கள்',
        summerCollection: 'கோடை சேகரிப்பு',
        shopNow: 'இப்போதே வாங்குங்கள்',
        topwear: 'மேல் ஆடை',
        ethnicWear: 'பாரம்பரிய ஆடை',
        justLanded: 'இப்போது வந்தவை',
        freshStyles: 'எங்கள் சமீபத்திய சேகரிப்பிலிருந்து புதிய பாணிகள்',
        viewAllNewArrivals: 'அனைத்து புதிய வருகைகளையும் பாருங்கள்',
        complimentaryShipping: 'இலவச ஷிப்பிங்',
        complimentaryShippingText: '₹999 க்கும் மேற்பட்ட அனைத்து ஆர்டர்களுக்கும் இலவச ஷிப்பிங்',
        easyReturns: 'எளிதான ரிட்டர்ன்கள்',
        easyReturnsText: '30 நாட்கள் தொந்தரவு இல்லாத ரிட்டர்ன் கொள்கை',
        securePayment: 'பாதுகாப்பான பணப்பரிவர்த்தனை',
        securePaymentText: '100% பாதுகாப்பான செக் அவுட் அனுபவம்',
        premiumSupport: 'பிரீமியம் உதவி',
        premiumSupportText: '24/7 வாடிக்கையாளர் சேவை',
        mostLoved: 'அதிகம் விரும்பப்பட்டவை',
        bestSellers: 'அதிக விற்பனை',
        bestSellersDescription: 'தரமும் பாணியும் காரணமாக எங்கள் வாடிக்கையாளர்களின் விருப்பங்கள்',
        viewAllBestSellers: 'அனைத்து அதிக விற்பனையையும் பாருங்கள்',
        stayConnected: 'தொடர்ந்து இணையுங்கள்',
        joinCircle: 'எங்கள் <span class="text-gold">பிரத்தியேக</span> வட்டத்தில் சேருங்கள்',
        newsletterDescription: 'புதிய சேகரிப்புகள், சிறப்பு சலுகைகள், மற்றும் பாணி ஊக்கத்திற்கான முன்கூட்டிய அணுகலைப் பெற சந்தா இடுங்கள்.',
        subscribe: 'சந்தா',
        privacyNote: 'சந்தா செய்வதன் மூலம், எங்கள் தனியுரிமைக் கொள்கையை ஒப்புக்கொள்கிறீர்கள்'
      };
    }

    if (language === 'Hindi') {
      return {
        heroBadge: 'एक्सक्लूसिव कलेक्शन 2026',
        heroTitleLine1: 'अपनी',
        heroTitleLine2: 'एलिगेंस को बढ़ाएँ',
        heroDescription: 'समझदार पुरुषों के लिए बने कालातीत फैशन पीस खोजें। जहां लक्ज़री और आधुनिक शैली मिलती है।',
        explore: 'कलेक्शन देखें',
        newArrivals: 'नई कलेक्शन',
        premiumQuality: 'प्रीमियम क्वालिटी',
        freeShipping: 'फ्री शिपिंग',
        support: '24/7 सपोर्ट',
        curatedForHim: 'उनके लिए चुना गया',
        shopByCategory: 'कैटेगरी के अनुसार खरीदें',
        categoryDescription: 'हर अवसर के लिए हमारे सावधानी से चुने गए पुरुषों के कलेक्शन देखें',
        featuredTitle: 'फीचर्ड प्रोडक्ट्स',
        featuredDescription: 'अपनी असाधारण गुणवत्ता और डिज़ाइन के लिए चुने गए हमारे सबसे पसंदीदा पीस देखें',
        viewAllFeatured: 'सभी फीचर्ड देखें',
        summerCollection: 'समर कलेक्शन',
        shopNow: 'अभी खरीदें',
        topwear: 'टॉपवियर',
        ethnicWear: 'एथनिक वियर',
        justLanded: 'नई लॉन्च',
        freshStyles: 'हमारे नवीनतम कलेक्शन की नई स्टाइल्स',
        viewAllNewArrivals: 'सभी नई कलेक्शन देखें',
        complimentaryShipping: 'मुफ्त शिपिंग',
        complimentaryShippingText: '₹999 से ऊपर के सभी ऑर्डर पर मुफ्त शिपिंग',
        easyReturns: 'आसान रिटर्न',
        easyReturnsText: '30 दिन की आसान रिटर्न नीति',
        securePayment: 'सुरक्षित भुगतान',
        securePaymentText: '100% सुरक्षित चेकआउट अनुभव',
        premiumSupport: 'प्रीमियम सपोर्ट',
        premiumSupportText: '24/7 ग्राहक सहायता',
        mostLoved: 'सबसे पसंदीदा',
        bestSellers: 'बेस्ट सेलर्स',
        bestSellersDescription: 'गुणवत्ता और स्टाइल के लिए पसंद किए गए हमारे ग्राहकों के फेवरेट',
        viewAllBestSellers: 'सभी बेस्ट सेलर्स देखें',
        stayConnected: 'जुड़े रहें',
        joinCircle: 'हमारे <span class="text-gold">एक्सक्लूसिव</span> सर्कल में जुड़ें',
        newsletterDescription: 'नई कलेक्शन, एक्सक्लूसिव ऑफ़र और स्टाइल इंस्पिरेशन के लिए सब्सक्राइब करें।',
        subscribe: 'सब्सक्राइब',
        privacyNote: 'सब्सक्राइब करके, आप हमारी प्राइवेसी पॉलिसी से सहमत हैं'
      };
    }

    return {
      heroBadge: 'Exclusive Collection 2026',
      heroTitleLine1: 'Elevate Your',
      heroTitleLine2: 'Elegance',
      heroDescription: 'Discover timeless men\'s fashion pieces crafted for the distinguished gentleman. Where luxury meets contemporary style.',
      explore: 'Explore Collection',
      newArrivals: 'New Arrivals',
      premiumQuality: 'Premium Quality',
      freeShipping: 'Free Shipping',
      support: '24/7 Support',
      curatedForHim: 'Curated For Him',
      shopByCategory: 'Shop by Category',
      categoryDescription: 'Explore our carefully curated men\'s collections designed for every occasion',
      featuredTitle: 'Featured Products',
      featuredDescription: 'Discover our most coveted pieces, chosen for their exceptional quality and design',
      viewAllFeatured: 'View All Featured',
      summerCollection: 'Summer Collection',
      shopNow: 'Shop Now',
      topwear: 'Topwear',
      ethnicWear: 'Ethnic Wear',
      justLanded: 'Just Landed',
      freshStyles: 'Fresh styles straight from our latest collection',
      viewAllNewArrivals: 'View All New Arrivals',
      complimentaryShipping: 'Complimentary Shipping',
      complimentaryShippingText: 'Free shipping on all orders over ₹999',
      easyReturns: 'Easy Returns',
      easyReturnsText: '7 days free return',
      securePayment: 'Secure Payment',
      securePaymentText: '100% secure checkout experience',
      premiumSupport: 'Premium Support',
      premiumSupportText: 'Dedicated 24/7 customer care',
      mostLoved: 'Most Loved',
      bestSellers: 'Best Sellers',
      bestSellersDescription: 'Our customers\' favorites, loved for their quality and style',
      viewAllBestSellers: 'View All Best Sellers',
      stayConnected: 'Stay Connected',
      joinCircle: 'Join Our <span class="text-gold">Exclusive</span> Circle',
      newsletterDescription: 'Subscribe to receive early access to new collections, exclusive offers, and style inspiration.',
      subscribe: 'Subscribe',
      privacyNote: 'By subscribing, you agree to our Privacy Policy'
    };
  });

  constructor(private productService: ProductService, private languageService: LanguageService) {}

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
