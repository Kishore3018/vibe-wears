import { Component, OnInit, OnDestroy, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface Promo {
  id: number;
  text: string;
  highlight?: string;
  link?: string;
  linkText?: string;
  icon?: string;
}

@Component({
  selector: 'app-promo-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  animations: [
    trigger('slideDown', [
      state('void', style({ height: 0, opacity: 0 })),
      state('*', style({ height: '*', opacity: 1 })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ])
  ],
  template: `
    @if (isVisible()) {
      <div class="promo-banner" [@slideDown] [class]="'theme-' + theme">
        <div class="banner-content">
          <div class="promo-slider">
            <div class="promo-item" [class.active]="currentIndex() === i" *ngFor="let promo of promos; let i = index">
              @if (currentIndex() === i) {
                <div class="promo-inner">
                  @if (promo.icon) {
                    <span class="material-icons">{{ promo.icon }}</span>
                  }
                  <span class="promo-text">
                    {{ promo.text }}
                    @if (promo.highlight) {
                      <strong>{{ promo.highlight }}</strong>
                    }
                  </span>
                  @if (promo.link) {
                    <a [routerLink]="promo.link" class="promo-link">
                      {{ promo.linkText || 'Shop Now' }}
                      <span class="material-icons">arrow_forward</span>
                    </a>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Flash Sale Timer -->
          @if (showTimer) {
            <div class="flash-timer">
              <span class="timer-label">Ends in:</span>
              <div class="timer-units">
                <span class="unit">{{ hours() }}h</span>
                <span class="separator">:</span>
                <span class="unit">{{ minutes() }}m</span>
                <span class="separator">:</span>
                <span class="unit">{{ seconds() }}s</span>
              </div>
            </div>
          }
        </div>

        <button class="close-btn" (click)="closeBanner()">
          <span class="material-icons">close</span>
        </button>

        <!-- Progress dots -->
        @if (promos.length > 1) {
          <div class="progress-dots">
            @for (promo of promos; track promo.id; let i = $index) {
              <button 
                class="dot" 
                [class.active]="currentIndex() === i"
                (click)="goToSlide(i)"
              ></button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .promo-banner {
      position: relative;
      padding: 0.75rem 3rem;
      text-align: center;
      overflow: hidden;

      &.theme-gold {
        background: linear-gradient(90deg, #c9a962, #d4b878, #c9a962);
        background-size: 200% 100%;
        animation: shimmer 3s infinite;
        color: #0a0a0f;
      }

      &.theme-dark {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: white;
        border-bottom: 1px solid rgba(201, 169, 98, 0.2);
      }

      &.theme-festive {
        background: linear-gradient(90deg, #dc2626, #ef4444, #dc2626);
        background-size: 200% 100%;
        animation: shimmer 3s infinite;
        color: white;
      }

      &.theme-green {
        background: linear-gradient(90deg, #059669, #10b981, #059669);
        background-size: 200% 100%;
        animation: shimmer 3s infinite;
        color: white;
      }
    }

    @keyframes shimmer {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .banner-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .promo-slider {
      position: relative;
      min-height: 24px;
    }

    .promo-item {
      display: none;
      
      &.active {
        display: block;
        animation: fadeIn 0.5s ease;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .promo-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      font-size: 0.9rem;
    }

    .promo-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      strong {
        font-weight: 700;
      }
    }

    .theme-gold .promo-text strong {
      color: #7c2d12;
    }

    .theme-dark .promo-text strong {
      color: #c9a962;
    }

    .promo-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;

      .material-icons {
        font-size: 16px;
        transition: transform 0.3s ease;
      }

      &:hover .material-icons {
        transform: translateX(4px);
      }
    }

    .theme-gold .promo-link {
      color: #7c2d12;
      
      &:hover {
        color: #0a0a0f;
      }
    }

    .theme-dark .promo-link {
      color: #c9a962;
    }

    .theme-festive .promo-link,
    .theme-green .promo-link {
      color: white;
      text-decoration: underline;
    }

    .material-icons {
      font-size: 18px;
    }

    .flash-timer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 6px;
      font-size: 0.85rem;
    }

    .timer-label {
      opacity: 0.8;
    }

    .timer-units {
      display: flex;
      align-items: center;
      font-weight: 700;
      font-family: 'Courier New', monospace;
    }

    .separator {
      margin: 0 2px;
      opacity: 0.6;
    }

    .close-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.3s ease;
      color: inherit;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        opacity: 1;
      }

      .material-icons {
        font-size: 18px;
      }
    }

    .progress-dots {
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 4px;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 0;
    }

    .theme-gold .dot {
      background: rgba(0, 0, 0, 0.2);
      
      &.active {
        background: #7c2d12;
        width: 16px;
        border-radius: 3px;
      }
    }

    .theme-dark .dot,
    .theme-festive .dot,
    .theme-green .dot {
      background: rgba(255, 255, 255, 0.3);
      
      &.active {
        background: white;
        width: 16px;
        border-radius: 3px;
      }
    }

    @media (max-width: 768px) {
      .promo-banner {
        padding: 0.6rem 2.5rem;
      }

      .banner-content {
        flex-direction: column;
        gap: 0.5rem;
      }

      .promo-inner {
        flex-wrap: wrap;
        font-size: 0.8rem;
      }

      .flash-timer {
        font-size: 0.75rem;
      }
    }
  `]
})
export class PromoBannerComponent implements OnInit, OnDestroy {
  @Input() theme: 'gold' | 'dark' | 'festive' | 'green' = 'gold';
  @Input() showTimer = false;
  @Input() endTime?: Date;

  isVisible = signal(true);
  currentIndex = signal(0);
  
  hours = signal(0);
  minutes = signal(0);
  seconds = signal(0);

  promos: Promo[] = [
    {
      id: 1,
      text: '🎉 New Year Sale!',
      highlight: 'Up to 50% OFF',
      link: '/products',
      linkText: 'Shop Now',
      icon: 'local_offer'
    },
    {
      id: 2,
      text: '✨ Free Shipping on orders above',
      highlight: '₹999',
      link: '/products',
      linkText: 'Explore'
    },
    {
      id: 3,
      text: '🎁 Use code',
      highlight: 'WELCOME15',
      link: '/products',
      linkText: 'Get 15% Off'
    },
    {
      id: 4,
      text: '🔄 Easy 7 days free return',
      highlight: 'No questions asked',
      link: '/help',
      linkText: 'Learn More'
    }
  ];

  private slideInterval?: ReturnType<typeof setInterval>;
  private timerInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    // Check if banner was closed
    const closedUntil = localStorage.getItem('vw_promo_closed');
    if (closedUntil && new Date(closedUntil) > new Date()) {
      this.isVisible.set(false);
      return;
    }

    // Auto-rotate promos
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);

    // Timer for flash sales
    if (this.showTimer) {
      this.endTime = this.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      this.updateTimer();
      this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
  }

  ngOnDestroy() {
    if (this.slideInterval) clearInterval(this.slideInterval);
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  nextSlide() {
    this.currentIndex.update(i => (i + 1) % this.promos.length);
  }

  goToSlide(index: number) {
    this.currentIndex.set(index);
  }

  closeBanner() {
    this.isVisible.set(false);
    // Don't show for 24 hours
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    localStorage.setItem('vw_promo_closed', tomorrow.toISOString());
  }

  private updateTimer() {
    if (!this.endTime) return;
    
    const diff = this.endTime.getTime() - Date.now();
    if (diff <= 0) {
      this.hours.set(0);
      this.minutes.set(0);
      this.seconds.set(0);
      return;
    }

    this.hours.set(Math.floor(diff / (1000 * 60 * 60)));
    this.minutes.set(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
    this.seconds.set(Math.floor((diff % (1000 * 60)) / 1000));
  }
}
