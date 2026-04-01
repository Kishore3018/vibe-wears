import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton" [ngStyle]="{ width: width, height: height, borderRadius: radius }">
      <div class="shimmer"></div>
    </div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%);
      position: relative;
      overflow: hidden;
    }

    .shimmer {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.08),
        transparent
      );
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `]
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '20px';
  @Input() radius = '8px';
}

@Component({
  selector: 'app-product-card-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="product-skeleton">
      <app-skeleton height="280px" radius="12px"></app-skeleton>
      <div class="content">
        <app-skeleton height="14px" width="60%"></app-skeleton>
        <app-skeleton height="18px" width="85%"></app-skeleton>
        <div class="price-row">
          <app-skeleton height="22px" width="30%"></app-skeleton>
          <app-skeleton height="16px" width="25%"></app-skeleton>
        </div>
        <app-skeleton height="12px" width="45%"></app-skeleton>
      </div>
    </div>
  `,
  styles: [`
    .product-skeleton {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 16px;
      overflow: hidden;
      padding-bottom: 1rem;
    }

    .content {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .price-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `]
})
export class ProductCardSkeletonComponent {}

@Component({
  selector: 'app-product-grid-skeleton',
  standalone: true,
  imports: [CommonModule, ProductCardSkeletonComponent],
  template: `
    <div class="grid">
      @for (i of items; track i) {
        <app-product-card-skeleton></app-product-card-skeleton>
      }
    </div>
  `,
  styles: [`
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
  `]
})
export class ProductGridSkeletonComponent {
  @Input() count = 8;
  
  get items() {
    return Array(this.count).fill(0).map((_, i) => i);
  }
}
