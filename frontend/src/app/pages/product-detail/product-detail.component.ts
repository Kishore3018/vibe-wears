import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, ProductFilters, ProductImage, Review } from '@core/services/product.service';
import { CartService } from '@core/services/cart.service';
import { AuthService } from '@core/services/auth.service';
import { WishlistService } from '@core/services/wishlist.service';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent],
  template: `
    <div class="product-detail-page">
      @if (loading()) {
        <div class="container">
          <div class="product-skeleton">
            <div class="skeleton-gallery"></div>
            <div class="skeleton-info">
              <div class="skeleton-line w-60"></div>
              <div class="skeleton-line w-40"></div>
              <div class="skeleton-line w-30"></div>
              <div class="skeleton-block"></div>
            </div>
          </div>
        </div>
      } @else if (product()) {
        <div class="container">
          <!-- Breadcrumb -->
          <nav class="breadcrumb">
            <a routerLink="/">Home</a>
            <span>/</span>
            <a routerLink="/products">Products</a>
            <span>/</span>
            @if (product()?.categories?.[0]) {
              <a [routerLink]="['/category', product()!.categories![0].slug]">{{ product()!.categories![0].name }}</a>
              <span>/</span>
            }
            <span>{{ product()!.name }}</span>
          </nav>

          <div class="product-grid">
            <!-- Image Gallery -->
            <div class="product-gallery">
              <div class="main-image">
                <img [src]="selectedImage()" [alt]="product()!.name">
                @if (product() && product()!.compare_price && product()!.compare_price! > product()!.price) {
                  <span class="badge sale">Sale</span>
                }
              </div>
              <div class="thumbnail-list">
                @for (image of productImages(); track image) {
                  <button 
                    class="thumbnail" 
                    [class.active]="selectedImage() === image"
                    (click)="selectImage(image)"
                  >
                    <img [src]="image" [alt]="product()!.name">
                  </button>
                }
              </div>
            </div>

            <!-- Product Info -->
            <div class="product-info">
              <h1 class="product-title">{{ product()!.name }}</h1>
              
              <!-- Rating -->
              <div class="rating-row">
                <div class="stars">
                  @for (star of [1,2,3,4,5]; track star) {
                    <span class="material-icons" [class.filled]="star <= (product()!.average_rating || 0)">
                      {{ star <= (product()!.average_rating || 0) ? 'star' : 'star_border' }}
                    </span>
                  }
                </div>
                <span class="rating-count">({{ reviews().length }} reviews)</span>
              </div>

              <!-- Price -->
              <div class="price-section">
                @if (product() && product()!.compare_price && product()!.compare_price! > calculatedPrice()) {
                  <span class="original-price">{{ product()!.compare_price! + (selectedVariant()?.price_modifier || 0) | currency:'INR':'symbol':'1.0-0' }}</span>
                  <span class="current-price sale">{{ calculatedPrice() | currency:'INR':'symbol':'1.0-0' }}</span>
                } @else {
                  <span class="current-price">{{ calculatedPrice() | currency:'INR':'symbol':'1.0-0' }}</span>
                }
                @if (selectedVariant() && selectedVariant()!.price_modifier !== 0) {
                  <span class="size-price-note">(Price varies by size)</span>
                }
              </div>

              <!-- Description -->
              <p class="product-description">{{ product()!.short_description || product()!.description }}</p>

              <!-- Stock Status -->
              <div class="stock-status" [class.in-stock]="product()!.quantity > 0" [class.out-of-stock]="product()!.quantity === 0">
                @if (product()!.quantity > 0) {
                  <span class="material-icons">check_circle</span>
                  <span>In Stock ({{ product()!.quantity }} available)</span>
                } @else {
                  <span class="material-icons">cancel</span>
                  <span>Out of Stock</span>
                }
              </div>

              <!-- Variants -->
              @if (product()!.variants && product()!.variants!.length > 0) {
                <div class="variants-section">
                  <!-- Size -->
                  @if (availableSizes().length > 0) {
                    <div class="variant-group">
                      <label>Size: <strong>{{ selectedSize() }}</strong></label>
                      <div class="size-options">
                        @for (size of availableSizes(); track size) {
                          <button 
                            class="size-btn"
                            [class.active]="selectedSize() === size"
                            (click)="selectSize(size)"
                          >
                            {{ size }}
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Quantity -->
              <div class="quantity-section">
                <label>Quantity:</label>
                <div class="quantity-selector">
                  <button (click)="decreaseQuantity()" [disabled]="quantity() <= 1">
                    <span class="material-icons">remove</span>
                  </button>
                  <input type="number" [(ngModel)]="quantityValue" min="1" [max]="product()!.quantity">
                  <button (click)="increaseQuantity()" [disabled]="quantity() >= product()!.quantity">
                    <span class="material-icons">add</span>
                  </button>
                </div>
              </div>

              <!-- Actions -->
              <div class="action-buttons">
                <button 
                  class="btn btn-primary btn-lg add-to-cart"
                  [disabled]="product()!.quantity === 0"
                  (click)="addToCart()"
                >
                  <span class="material-icons">shopping_bag</span>
                  Add to Cart
                </button>
                <button 
                  class="btn btn-outline btn-lg wishlist" 
                  [class.in-wishlist]="isInWishlist()"
                  (click)="toggleWishlist()"
                >
                  <span class="material-icons">{{ isInWishlist() ? 'favorite' : 'favorite_border' }}</span>
                </button>
              </div>

              <!-- Features -->
              <div class="product-features">
                <div class="feature">
                  <span class="material-icons-outlined">local_shipping</span>
                  <span>Free shipping over ₹100</span>
                </div>
                <div class="feature">
                  <span class="material-icons-outlined">replay</span>
                  <span>30-day returns</span>
                </div>
                <div class="feature">
                  <span class="material-icons-outlined">verified_user</span>
                  <span>2-year warranty</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="product-tabs">
            <div class="tab-buttons">
              <button 
                [class.active]="activeTab() === 'description'"
                (click)="setActiveTab('description')"
              >
                Description
              </button>
              <button 
                [class.active]="activeTab() === 'reviews'"
                (click)="setActiveTab('reviews')"
              >
                Reviews ({{ reviews().length }})
              </button>
            </div>

            <div class="tab-content">
              @if (activeTab() === 'description') {
                <div class="description-content">
                  <p>{{ product()!.description }}</p>
                </div>
              }

              @if (activeTab() === 'reviews') {
                <div class="reviews-content">
                  @if (reviews() && reviews().length > 0) {
                    @for (review of reviews(); track review.id) {
                      <div class="review-item">
                        <div class="review-header">
                          <div class="reviewer-info">
                            <div class="avatar">{{ review.user_name?.charAt(0) || 'U' }}</div>
                            <div>
                              <strong>{{ review.user_name || 'Anonymous' }}</strong>
                              <div class="stars small">
                                @for (star of [1,2,3,4,5]; track star) {
                                  <span class="material-icons" [class.filled]="star <= review.rating">
                                    {{ star <= review.rating ? 'star' : 'star_border' }}
                                  </span>
                                }
                              </div>
                            </div>
                          </div>
                          <span class="review-date">{{ review.created_at | date:'mediumDate' }}</span>
                        </div>
                        <p class="review-comment">{{ review.comment }}</p>
                      </div>
                    }
                  } @else {
                    <div class="no-reviews">
                      <span class="material-icons-outlined">rate_review</span>
                      <p>No reviews yet. Be the first to review this product!</p>
                    </div>
                  }

                  <!-- Write Review Button & Form -->
                  @if (authService.isAuthenticated()) {
                    @if (!showReviewForm()) {
                      <button class="btn btn-secondary write-review-btn" (click)="showReviewForm.set(true)">
                        <span class="material-icons">edit</span>
                        Write a Review
                      </button>
                    } @else {
                      <div class="review-form">
                        <h3>Write Your Review</h3>
                        <form (ngSubmit)="submitReview()">
                          <div class="form-group">
                            <label>Your Rating *</label>
                            <div class="rating-input">
                              @for (star of [1,2,3,4,5]; track star) {
                                <button 
                                  type="button" 
                                  class="star-btn"
                                  [class.filled]="star <= reviewRating()"
                                  (click)="reviewRating.set(star)"
                                  (mouseenter)="hoverRating = star"
                                  (mouseleave)="hoverRating = 0"
                                >
                                  <span class="material-icons">
                                    {{ star <= (hoverRating || reviewRating()) ? 'star' : 'star_border' }}
                                  </span>
                                </button>
                              }
                              <span class="rating-text">{{ getRatingText(reviewRating()) }}</span>
                            </div>
                          </div>
                          <div class="form-group">
                            <label for="reviewTitle">Review Title (Optional)</label>
                            <input 
                              type="text" 
                              id="reviewTitle" 
                              class="form-control"
                              [value]="reviewTitle()"
                              (input)="reviewTitle.set($any($event.target).value)"
                              placeholder="Summarize your experience"
                            >
                          </div>
                          <div class="form-group">
                            <label for="reviewComment">Your Review *</label>
                            <textarea 
                              id="reviewComment" 
                              class="form-control"
                              rows="4"
                              [value]="reviewComment()"
                              (input)="reviewComment.set($any($event.target).value)"
                              placeholder="Tell us what you liked or disliked about this product..."
                              required
                            ></textarea>
                          </div>
                          <div class="form-actions">
                            <button 
                              type="button" 
                              class="btn btn-outline" 
                              (click)="cancelReview()"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              class="btn btn-primary"
                              [disabled]="reviewRating() === 0 || !reviewComment() || submittingReview()"
                            >
                              @if (submittingReview()) {
                                <span class="spinner"></span>
                                Submitting...
                              } @else {
                                Submit Review
                              }
                            </button>
                          </div>
                        </form>
                      </div>
                    }
                  } @else {
                    <div class="login-prompt">
                      <p>Please <a routerLink="/auth/login">log in</a> to write a review.</p>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Related Products -->
          @if (relatedProducts().length > 0) {
            <section class="related-products">
              <h2>You May Also Like</h2>
              <div class="products-grid">
                @for (product of relatedProducts(); track product.id) {
                  <app-product-card [product]="product"></app-product-card>
                }
              </div>
            </section>
          }
        </div>
      } @else {
        <div class="container">
          <div class="not-found">
            <span class="material-icons-outlined">search_off</span>
            <h2>Product Not Found</h2>
            <p>The product you're looking for doesn't exist or has been removed.</p>
            <a routerLink="/products" class="btn btn-primary">Browse Products</a>
          </div>
        </div>
      }

      <!-- Toast Notification -->
      @if (toastMessage()) {
        <div class="toast-notification" [class.success]="toastType() === 'success'" [class.error]="toastType() === 'error'">
          <span class="material-icons">{{ toastType() === 'success' ? 'check_circle' : 'error' }}</span>
          <span>{{ toastMessage() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-detail-page {
      padding: 2rem 0 4rem;
    }

    .toast-notification {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      background: var(--secondary-color);
      border: 1px solid var(--accent-color);
      color: var(--text-light);
      font-weight: 500;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;

      &.success {
        border-color: #4ade80;
        .material-icons { color: #4ade80; }
      }

      &.error {
        border-color: #f87171;
        .material-icons { color: #f87171; }
      }

      .material-icons {
        font-size: 1.25rem;
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
      flex-wrap: wrap;

      a {
        color: var(--text-secondary);
        &:hover { color: var(--accent-color); }
      }
      span { color: var(--text-secondary); }
    }

    /* Skeleton Loading */
    .product-skeleton {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
    }

    .skeleton-gallery {
      aspect-ratio: 1;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--border-radius-lg);
    }

    .skeleton-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-line {
      height: 24px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--border-radius);
      
      &.w-60 { width: 60%; }
      &.w-40 { width: 40%; }
      &.w-30 { width: 30%; }
    }

    .skeleton-block {
      height: 200px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--border-radius);
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Product Grid */
    .product-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      margin-bottom: 4rem;
    }

    /* Gallery */
    .product-gallery {
      position: sticky;
      top: 100px;
    }

    .main-image {
      position: relative;
      aspect-ratio: 1;
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      margin-bottom: 1rem;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .badge {
        position: absolute;
        top: 1rem;
        left: 1rem;
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius);
        font-weight: 600;
        font-size: 0.85rem;

        &.sale {
          background-color: var(--error-color);
          color: white;
        }
      }
    }

    .thumbnail-list {
      display: flex;
      gap: 0.75rem;
    }

    .thumbnail {
      width: 80px;
      height: 80px;
      border: 2px solid transparent;
      border-radius: var(--border-radius);
      overflow: hidden;
      cursor: pointer;
      transition: var(--transition);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &:hover { border-color: var(--text-secondary); }
      &.active { border-color: var(--accent-color); }
    }

    /* Product Info */
    .product-info {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .product-title {
      font-size: 2rem;
      font-weight: 600;
      line-height: 1.3;
    }

    .rating-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .stars {
      display: flex;
      gap: 2px;

      .material-icons {
        font-size: 1.25rem;
        color: var(--border-color);

        &.filled { color: var(--warning-color); }
      }

      &.small .material-icons {
        font-size: 1rem;
      }
    }

    .rating-count {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .price-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .original-price {
      font-size: 1.25rem;
      color: var(--text-secondary);
      text-decoration: line-through;
    }

    .current-price {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);

      &.sale { color: var(--error-color); }
    }

    .product-description {
      color: var(--text-secondary);
      line-height: 1.7;
    }

    .stock-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;

      &.in-stock {
        color: var(--success-color);
      }

      &.out-of-stock {
        color: var(--error-color);
      }

      .material-icons {
        font-size: 1.25rem;
      }
    }

    /* Variants */
    .variants-section {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .variant-group {
      label {
        display: block;
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
      }
    }

    .size-options {
      display: flex;
      gap: 0.5rem;
    }

    .size-btn {
      min-width: 44px;
      height: 44px;
      padding: 0 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background: none;
      cursor: pointer;
      font-weight: 500;
      transition: var(--transition);

      &:hover { border-color: var(--text-primary); }
      &.active {
        background-color: var(--text-primary);
        border-color: var(--text-primary);
        color: var(--text-light);
      }
    }

    .color-options {
      display: flex;
      gap: 0.5rem;
    }

    .color-btn {
      width: 36px;
      height: 36px;
      border: 2px solid var(--border-color);
      border-radius: 50%;
      cursor: pointer;
      transition: var(--transition);

      &:hover { transform: scale(1.1); }
      &.active { border-color: var(--text-primary); box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--text-primary); }
    }

    /* Quantity */
    .quantity-section {
      label {
        display: block;
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
      }
    }

    .quantity-selector {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);

      button {
        width: 44px;
        height: 44px;
        border: none;
        background: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover:not(:disabled) { background-color: var(--bg-secondary); }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }

      input {
        width: 60px;
        height: 44px;
        border: none;
        border-left: 1px solid var(--border-color);
        border-right: 1px solid var(--border-color);
        text-align: center;
        font-weight: 500;

        &:focus { outline: none; }
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      }
    }

    /* Actions */
    .action-buttons {
      display: flex;
      gap: 1rem;
    }

    .add-to-cart {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .wishlist {
      width: 56px;
      padding: 0;
      
      &.in-wishlist {
        background: var(--accent-color);
        border-color: var(--accent-color);
        color: var(--primary-color);
        
        .material-icons {
          color: var(--primary-color);
        }
      }
    }

    /* Features */
    .product-features {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-secondary);

      .material-icons-outlined {
        font-size: 1.25rem;
      }
    }

    .virtual-tryon {
      margin-top: 0.25rem;
      padding: 1.2rem;
      border: 1px solid var(--surface-card-border, var(--border-color));
      background: var(--surface-card, var(--bg-primary));
      border-radius: var(--border-radius-lg);
    }

    .tryon-head {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      margin-bottom: 1rem;

      .material-icons-outlined {
        color: var(--accent-color);
        font-size: 1.4rem;
      }

      h3 {
        margin: 0;
        font-size: 1rem;
      }

      p {
        margin: 0.2rem 0 0;
        color: var(--text-secondary);
        font-size: 0.86rem;
      }
    }

    .tryon-actions {
      display: flex;
      gap: 0.6rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 0.9rem;
    }

    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border: 1px solid var(--accent-color);
      border-radius: var(--border-radius);
      padding: 0.65rem 0.95rem;
      color: var(--accent-color);
      font-weight: 600;
      font-size: 0.82rem;
      cursor: pointer;

      .material-icons {
        font-size: 1rem;
      }
    }

    .tryon-preview-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.7rem;
      margin-bottom: 0.9rem;
    }

    .preview-card {
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 0.55rem;

      h4 {
        margin: 0 0 0.45rem;
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      img {
        width: 100%;
        aspect-ratio: 4 / 5;
        object-fit: cover;
        border-radius: var(--border-radius);
      }
    }

    .tryon-result {
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 0.65rem;

      h4 {
        margin: 0 0 0.55rem;
        font-size: 0.82rem;
        color: var(--text-secondary);
      }

      img {
        width: 100%;
        border-radius: var(--border-radius);
        display: block;
      }
    }

    /* Tabs */
    .product-tabs {
      margin-bottom: 4rem;
    }

    .tab-buttons {
      display: flex;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 2rem;

      button {
        padding: 1rem 2rem;
        border: none;
        background: none;
        font-weight: 500;
        cursor: pointer;
        position: relative;
        color: var(--text-secondary);
        transition: var(--transition);

        &:hover { color: var(--text-primary); }

        &.active {
          color: var(--accent-color);

          &::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background-color: var(--accent-color);
          }
        }
      }
    }

    .tab-content {
      min-height: 200px;
    }

    .description-content p {
      color: var(--text-secondary);
      line-height: 1.8;
      max-width: 800px;
    }

    /* Reviews */
    .review-item {
      padding: 1.5rem 0;
      border-bottom: 1px solid var(--border-color);

      &:first-child { padding-top: 0; }
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .reviewer-info {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: var(--accent-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.25rem;
    }

    .review-date {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    .review-comment {
      color: var(--text-secondary);
      line-height: 1.7;
    }

    .no-reviews {
      text-align: center;
      padding: 3rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 2rem;
      color: var(--text-secondary);

      .material-icons-outlined {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
    }

    /* Write Review Button */
    .write-review-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
      
      .material-icons {
        font-size: 1.25rem;
      }
    }

    /* Review Form */
    .review-form {
      background: var(--bg-secondary);
      border-radius: var(--border-radius);
      padding: 2rem;
      margin-top: 2rem;
      border: 1px solid var(--border-color);

      h3 {
        margin: 0 0 1.5rem;
        font-size: 1.25rem;
        color: var(--text-primary);
      }

      .form-group {
        margin-bottom: 1.25rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .form-control {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          font-size: 1rem;
          font-family: inherit;
          transition: var(--transition);
          background: var(--bg-primary);

          &:focus {
            outline: none;
            border-color: var(--accent-color);
            box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.1);
          }

          &::placeholder {
            color: var(--text-muted);
          }
        }

        textarea.form-control {
          resize: vertical;
          min-height: 120px;
        }
      }

      .rating-input {
        display: flex;
        align-items: center;
        gap: 0.25rem;

        .star-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: transform 0.2s;

          &:hover {
            transform: scale(1.2);
          }

          .material-icons {
            font-size: 2rem;
            color: #ddd;
            transition: color 0.2s;
          }

          &.filled .material-icons,
          &:hover .material-icons {
            color: #ffc107;
          }
        }

        .rating-text {
          margin-left: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
        }
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;

        .btn {
          padding: 0.875rem 1.5rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 0.5rem;
          display: inline-block;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      }
    }

    /* Login Prompt */
    .login-prompt {
      text-align: center;
      padding: 1.5rem;
      background: var(--bg-secondary);
      border-radius: var(--border-radius);
      margin-top: 2rem;

      p {
        margin: 0;
        color: var(--text-secondary);
      }

      a {
        color: var(--accent-color);
        font-weight: 600;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    /* Related Products */
    .related-products {
      h2 {
        font-size: 1.75rem;
        margin-bottom: 2rem;
      }

      .products-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
      }
    }

    /* Not Found */
    .not-found {
      text-align: center;
      padding: 4rem 2rem;

      .material-icons-outlined {
        font-size: 4rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }

      h2 { margin-bottom: 0.5rem; }
      p { color: var(--text-secondary); margin-bottom: 2rem; }
    }

    /* Responsive */
    @media (max-width: 992px) {
      .product-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      .product-gallery {
        position: static;
      }

      .related-products .products-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 576px) {
      .product-title { font-size: 1.5rem; }
      .current-price { font-size: 1.5rem; }

      .action-buttons {
        flex-direction: column;
      }

      .wishlist { width: 100%; }

      .tab-buttons button {
        padding: 1rem;
        font-size: 0.9rem;
      }

      .related-products .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  relatedProducts = signal<any[]>([]);
  reviews = signal<Review[]>([]);
  loading = signal(true);
  
  selectedImage = signal('');
  activeTab = signal<'description' | 'reviews'>('description');
  
  selectedSize = signal('');
  selectedColor = signal('');
  quantityValue = 1;
  
  availableSizes = signal<string[]>([]);
  availableColors = signal<string[]>([]);
  
  // Computed signal for selected variant based on size and color
  selectedVariant = computed(() => {
    const prod = this.product();
    const size = this.selectedSize();
    const color = this.selectedColor();
    
    if (!prod || !prod.variants || prod.variants.length === 0) return null;
    
    // Find variant matching selected size and color
    let variant = prod.variants.find(v => 
      v.size === size && (color === '' || v.color === color)
    );
    
    // Fallback to just size match if no exact match
    if (!variant) {
      variant = prod.variants.find(v => v.size === size);
    }
    
    return variant || null;
  });
  
  // Computed price based on selected variant
  calculatedPrice = computed(() => {
    const prod = this.product();
    const variant = this.selectedVariant();
    
    if (!prod) return 0;
    
    const basePrice = prod.price;
    const modifier = variant?.price_modifier || 0;
    
    return basePrice + modifier;
  });
  
  // Toast notification (local - kept for cart errors)
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');

  personTryOnFile = signal<File | null>(null);
  personPreviewUrl = signal<string | null>(null);
  generatingTryOn = signal(false);
  tryOnResultUrl = signal<string | null>(null);
  
  // Review form
  showReviewForm = signal(false);
  reviewRating = signal(0);
  reviewTitle = signal('');
  reviewComment = signal('');
  submittingReview = signal(false);
  
  // Computed signal to check if product is in wishlist
  isInWishlist = computed(() => {
    const prod = this.product();
    return prod ? this.wishlistService.wishlistIds().has(prod.id) : false;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    public authService: AuthService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['slug']) {
        this.loadProduct(params['slug']);
      }
    });
  }

  loadProduct(slug: string): void {
    this.loading.set(true);
    this.productService.getProduct(slug).subscribe({
      next: (product: Product) => {
        this.product.set(product);
        const primaryImage = product.images?.find((img: ProductImage) => img.is_primary)?.image_url || product.images?.[0]?.image_url;
        this.selectedImage.set(primaryImage || '/assets/images/placeholder.jpg');
        
        // Extract unique sizes and colors from variants
        if (product.variants) {
          const sizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))] as string[];
          const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))] as string[];
          
          this.availableSizes.set(sizes);
          this.availableColors.set(colors);
          
          if (sizes.length > 0) this.selectedSize.set(sizes[0]);
          if (colors.length > 0) this.selectedColor.set(colors[0]);
        }
        
        this.loading.set(false);
        this.loadRelatedProducts(product.categories?.[0]?.slug);
        this.loadReviews(product.id);
      },
      error: () => {
        this.product.set(null);
        this.loading.set(false);
      }
    });
  }

  loadRelatedProducts(categorySlug?: string): void {
    if (!categorySlug) return;
    
    this.productService.getProducts({ category: categorySlug, per_page: 4 }).subscribe({
      next: response => {
        const filtered = response.items.filter(p => p.id !== this.product()?.id).slice(0, 4);
        this.relatedProducts.set(filtered);
      }
    });
  }

  loadReviews(productId: number): void {
    this.productService.getProductReviews(productId).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
      },
      error: () => {
        this.reviews.set([]);
      }
    });
  }

  // Review form
  hoverRating = 0;

  getRatingText(rating: number): string {
    const texts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return texts[rating] || '';
  }

  cancelReview(): void {
    this.showReviewForm.set(false);
    this.reviewRating.set(0);
    this.reviewTitle.set('');
    this.reviewComment.set('');
  }

  submitReview(): void {
    const product = this.product();
    if (!product || this.reviewRating() === 0 || !this.reviewComment()) {
      this.showToast('Please provide a rating and comment', 'error');
      return;
    }

    this.submittingReview.set(true);
    
    this.productService.createReview(
      product.id,
      this.reviewRating(),
      this.reviewTitle() || undefined,
      this.reviewComment()
    ).subscribe({
      next: () => {
        this.showToast('Thank you! Your review has been submitted for approval.', 'success');
        this.cancelReview();
        // Reload reviews to show the new one (if auto-approved)
        this.loadReviews(product.id);
      },
      error: (err) => {
        const errorMsg = err.error?.detail || 'Failed to submit review';
        this.showToast(errorMsg, 'error');
      },
      complete: () => {
        this.submittingReview.set(false);
      }
    });
  }

  productImages(): string[] {
    const product = this.product();
    if (!product) return [];
    
    const images: string[] = [];
    if (product.images) {
      images.push(...product.images.map((img: ProductImage) => img.image_url));
    }
    
    return images.length > 0 ? images : ['/assets/images/placeholder.jpg'];
  }

  selectImage(image: string): void {
    this.selectedImage.set(image);
  }

  selectSize(size: string): void {
    this.selectedSize.set(size);
  }

  selectColor(color: string): void {
    this.selectedColor.set(color);
  }

  quantity(): number {
    return this.quantityValue;
  }

  increaseQuantity(): void {
    const maxStock = this.product()?.quantity || 1;
    if (this.quantityValue < maxStock) {
      this.quantityValue++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantityValue > 1) {
      this.quantityValue--;
    }
  }

  setActiveTab(tab: 'description' | 'reviews'): void {
    this.activeTab.set(tab);
  }

  addToCart(): void {
    const product = this.product();
    if (!product) {
      alert('Product not loaded');
      return;
    }
    
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Get selected variant ID
    const variant = this.selectedVariant();
    const variantId = variant?.id;
    
    this.cartService.addToCart(product.id, this.quantityValue, variantId).subscribe({
      next: () => {
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        console.error('Failed to add to cart:', err);
        this.showToast('Failed to add to cart: ' + (err.error?.detail || err.message || 'Unknown error'), 'error');
      }
    });
  }

  addToWishlist(): void {
    const product = this.product();
    if (!product) return;
    
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.wishlistService.toggleWishlist(product.id, product.name).subscribe({
      error: (err) => {
        console.error('Failed to update wishlist:', err);
        this.showToast('Failed to update wishlist: ' + (err.error?.detail || err.message || 'Unknown error'), 'error');
      }
    });
  }
  
  toggleWishlist(): void {
    this.addToWishlist();
  }

  onTryOnPersonSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please upload a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.personTryOnFile.set(file);
      this.personPreviewUrl.set(reader.result as string);
      this.tryOnResultUrl.set(null);
    };
    reader.readAsDataURL(file);
  }

  clearTryOnPerson(): void {
    this.personTryOnFile.set(null);
    this.personPreviewUrl.set(null);
    this.tryOnResultUrl.set(null);
  }

  generateVirtualTryOn(): void {
    const personFile = this.personTryOnFile();
    const productImage = this.selectedImage();
    const productName = this.product()?.name;

    if (!personFile) {
      this.showToast('Upload your photo first', 'error');
      return;
    }

    if (!productImage) {
      this.showToast('Product image is missing', 'error');
      return;
    }

    this.generatingTryOn.set(true);
    this.productService.generateVirtualTryOn(personFile, productImage, productName).subscribe({
      next: (response) => {
        if (!response?.result_url) {
          this.showToast('AI did not return an image', 'error');
          return;
        }

        this.tryOnResultUrl.set(response.result_url);
        this.showToast('Virtual try-on generated', 'success');
      },
      error: (err) => {
        const detail = err?.error?.detail || 'Failed to generate virtual try-on';
        this.showToast(detail, 'error');
      },
      complete: () => {
        this.generatingTryOn.set(false);
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.toastMessage.set('');
    }, 3000);
  }
}
