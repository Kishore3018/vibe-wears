import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Review {
  id: number;
  product_name: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_approved: boolean;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-reviews">
      <div class="page-header">
        <h1>Reviews Management</h1>
        <p class="subtitle">Manage customer reviews and ratings</p>
      </div>

      <div class="filters-bar">
        <div class="search-box">
          <span class="material-icons">search</span>
          <input 
            type="text" 
            placeholder="Search reviews..."
            [(ngModel)]="searchTerm"
            (input)="filterReviews()"
          >
        </div>
        <select [(ngModel)]="statusFilter" (change)="filterReviews()">
          <option value="all">All Reviews</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
        <select [(ngModel)]="ratingFilter" (change)="filterReviews()">
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      <div class="reviews-list">
        @if (loading()) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading reviews...</p>
          </div>
        } @else if (filteredReviews().length === 0) {
          <div class="empty-state">
            <span class="material-icons">rate_review</span>
            <h3>No Reviews Found</h3>
            <p>No reviews match your current filters</p>
          </div>
        } @else {
          @for (review of filteredReviews(); track review.id) {
            <div class="review-card" [class.pending]="!review.is_approved">
              <div class="review-header">
                <div class="product-info">
                  <h3>{{ review.product_name }}</h3>
                  <span class="user">by {{ review.user_name }}</span>
                </div>
                <div class="rating">
                  @for (star of [1,2,3,4,5]; track star) {
                    <span class="material-icons" [class.filled]="star <= review.rating">
                      {{ star <= review.rating ? 'star' : 'star_border' }}
                    </span>
                  }
                </div>
              </div>
              <p class="review-comment">{{ review.comment }}</p>
              <div class="review-footer">
                <span class="date">{{ review.created_at | date:'medium' }}</span>
                <div class="actions">
                  @if (!review.is_approved) {
                    <button class="btn btn-success btn-sm" (click)="approveReview(review)">
                      <span class="material-icons">check</span>
                      Approve
                    </button>
                  }
                  <button class="btn btn-danger btn-sm" (click)="deleteReview(review)">
                    <span class="material-icons">delete</span>
                    Delete
                  </button>
                </div>
              </div>
              @if (!review.is_approved) {
                <span class="pending-badge">Pending Approval</span>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-reviews {
      padding: 1.5rem;
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        font-size: 1.75rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .subtitle {
        color: #64748b;
      }
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;

      .search-box {
        flex: 1;
        min-width: 250px;
        display: flex;
        align-items: center;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0 1rem;

        .material-icons {
          color: #94a3b8;
        }

        input {
          flex: 1;
          border: none;
          padding: 0.75rem;
          outline: none;
        }
      }

      select {
        padding: 0.75rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        cursor: pointer;
      }
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .review-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      position: relative;

      &.pending {
        border-left: 4px solid #f59e0b;
      }
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;

      .product-info {
        h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .user {
          color: #64748b;
          font-size: 0.875rem;
        }
      }

      .rating {
        display: flex;
        gap: 2px;

        .material-icons {
          font-size: 1.25rem;
          color: #e2e8f0;

          &.filled {
            color: #fbbf24;
          }
        }
      }
    }

    .review-comment {
      color: #475569;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .review-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;

      .date {
        color: #94a3b8;
        font-size: 0.875rem;
      }

      .actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      .material-icons {
        font-size: 1rem;
      }

      &.btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.8rem;
      }

      &.btn-success {
        background: #10b981;
        color: white;

        &:hover {
          background: #059669;
        }
      }

      &.btn-danger {
        background: #ef4444;
        color: white;

        &:hover {
          background: #dc2626;
        }
      }
    }

    .pending-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: #fef3c7;
      color: #92400e;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;

      .material-icons {
        font-size: 4rem;
        color: #cbd5e1;
        margin-bottom: 1rem;
      }

      h3 {
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
      }

      p {
        color: #64748b;
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AdminReviewsComponent implements OnInit {
  reviews = signal<Review[]>([]);
  filteredReviews = signal<Review[]>([]);
  loading = signal(true);
  
  searchTerm = '';
  statusFilter = 'all';
  ratingFilter = 'all';

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    // Mock data for now - will connect to API later
    setTimeout(() => {
      const mockReviews: Review[] = [
        {
          id: 1,
          product_name: 'Classic White Oxford Shirt',
          user_name: 'John Doe',
          rating: 5,
          comment: 'Excellent quality! The fit is perfect and the fabric feels premium. Highly recommended for anyone looking for a classic shirt.',
          created_at: '2026-02-25T10:30:00',
          is_approved: true
        },
        {
          id: 2,
          product_name: 'Navy Blue Blazer',
          user_name: 'Jane Smith',
          rating: 4,
          comment: 'Great blazer, fits well. Would have given 5 stars but delivery was a bit slow.',
          created_at: '2026-02-24T15:45:00',
          is_approved: true
        },
        {
          id: 3,
          product_name: 'Slim Fit Chinos',
          user_name: 'Mike Johnson',
          rating: 3,
          comment: 'Decent quality but sizing runs a bit large. Consider ordering a size down.',
          created_at: '2026-02-23T09:15:00',
          is_approved: false
        }
      ];
      this.reviews.set(mockReviews);
      this.filteredReviews.set(mockReviews);
      this.loading.set(false);
    }, 500);
  }

  filterReviews() {
    let filtered = this.reviews();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.product_name.toLowerCase().includes(term) ||
        r.user_name.toLowerCase().includes(term) ||
        r.comment.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(r => 
        this.statusFilter === 'approved' ? r.is_approved : !r.is_approved
      );
    }

    if (this.ratingFilter !== 'all') {
      filtered = filtered.filter(r => r.rating === parseInt(this.ratingFilter));
    }

    this.filteredReviews.set(filtered);
  }

  approveReview(review: Review) {
    review.is_approved = true;
    this.filterReviews();
  }

  deleteReview(review: Review) {
    if (confirm('Are you sure you want to delete this review?')) {
      this.reviews.update(reviews => reviews.filter(r => r.id !== review.id));
      this.filterReviews();
    }
  }
}
