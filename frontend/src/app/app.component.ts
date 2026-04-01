import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { WebsocketService } from './core/services/websocket.service';
import { AuthService } from './core/services/auth.service';
import { WishlistService } from './core/services/wishlist.service';
import { Subscription } from 'rxjs';

// Premium Components
import { ToastComponent } from './shared/components/toast/toast.component';
import { NewsletterPopupComponent } from './shared/components/newsletter-popup/newsletter-popup.component';
import { FloatingButtonsComponent } from './shared/components/floating-buttons/floating-buttons.component';
import { PromoBannerComponent } from './shared/components/promo-banner/promo-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    HeaderComponent, 
    FooterComponent,
    ToastComponent,
    NewsletterPopupComponent,
    FloatingButtonsComponent,
    PromoBannerComponent
  ],
  template: `
    <div class="app-wrapper">
      <!-- Premium Promotional Banner -->
      <app-promo-banner></app-promo-banner>
      
      <app-header></app-header>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      
      <!-- Premium Toast Notifications -->
      <app-toast></app-toast>
      
      <!-- Premium Newsletter Popup (First-time visitors) -->
      <app-newsletter-popup></app-newsletter-popup>
      
      <!-- Premium Floating Buttons (WhatsApp + Back to Top) -->
      <app-floating-buttons></app-floating-buttons>
      
      <!-- Legacy Toast (Keep for backward compatibility) -->
      @if (toastMessage()) {
        <div class="global-toast" [class.success]="toastType() === 'success'" [class.error]="toastType() === 'error'">
          <span class="material-icons">{{ toastType() === 'success' ? 'check_circle' : 'error' }}</span>
          <span>{{ toastMessage() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .app-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      padding-top: 130px; /* Header height + Promo banner */
    }
    
    .global-toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-radius: 4px;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      z-index: 10000;
      animation: slideUp 0.3s ease-out;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);

      &.success {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 1px solid var(--accent-color);
        color: var(--accent-color);
      }

      &.error {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 1px solid #ff6b6b;
        color: #ff6b6b;
      }

      .material-icons {
        font-size: 1.25rem;
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');
  
  private wishlistSubscription?: Subscription;

  constructor(
    private wsService: WebsocketService,
    private authService: AuthService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    // Connect to WebSocket for real-time updates
    this.wsService.connect();
    
    // Load wishlist if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.wishlistService.loadWishlist().subscribe();
    }
    
    // Subscribe to wishlist events for global toast notifications
    this.wishlistSubscription = this.wishlistService.wishlistEvent$.subscribe(event => {
      if (event.action === 'added') {
        this.showToast(`${event.productName || 'Product'} added to wishlist!`, 'success');
      } else {
        this.showToast(`${event.productName || 'Product'} removed from wishlist`, 'success');
      }
    });
  }
  
  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(''), 3000);
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
    this.wishlistSubscription?.unsubscribe();
  }
}
