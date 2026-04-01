import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-newsletter-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ]),
    trigger('slideUp', [
      state('void', style({ transform: 'translateY(50px) scale(0.95)', opacity: 0 })),
      state('*', style({ transform: 'translateY(0) scale(1)', opacity: 1 })),
      transition('void => *', animate('400ms ease-out')),
      transition('* => void', animate('300ms ease-in'))
    ])
  ],
  template: `
    @if (isVisible()) {
      <div class="popup-overlay" [@fadeIn] (click)="close()">
        <div class="popup-container" [@slideUp] (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="close()">
            <span class="material-icons">close</span>
          </button>
          
          <div class="popup-content">
            <div class="popup-image">
              <div class="discount-badge">
                <span class="discount-value">15%</span>
                <span class="discount-text">OFF</span>
              </div>
            </div>
            
            <div class="popup-form">
              <div class="brand-logo">VIBE WEARS</div>
              <h2>Get 15% Off Your First Order</h2>
              <p>Subscribe to our newsletter and receive exclusive offers, early access to new collections, and style tips delivered to your inbox.</p>
              
              @if (!submitted()) {
                <form (submit)="subscribe($event)">
                  <div class="input-group">
                    <input 
                      type="email" 
                      [(ngModel)]="email" 
                      name="email"
                      placeholder="Enter your email address"
                      required
                    >
                    <button type="submit" [disabled]="loading()">
                      @if (loading()) {
                        <span class="loader"></span>
                      } @else {
                        Subscribe
                      }
                    </button>
                  </div>
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="agreeTerms" name="terms">
                    <span>I agree to receive marketing emails</span>
                  </label>
                </form>
                
                <div class="social-proof">
                  <div class="avatars">
                    <span class="avatar">V</span>
                    <span class="avatar">K</span>
                    <span class="avatar">R</span>
                    <span class="avatar">+</span>
                  </div>
                  <span>Join 10,000+ fashion enthusiasts</span>
                </div>
              } @else {
                <div class="success-state">
                  <div class="success-icon">
                    <span class="material-icons">check_circle</span>
                  </div>
                  <h3>Welcome to Vibe Wears!</h3>
                  <p>Your discount code: <strong>WELCOME15</strong></p>
                  <p class="small">Check your inbox for exclusive offers</p>
                  <button class="shop-btn" (click)="close()">Start Shopping</button>
                </div>
              }
            </div>
          </div>
          
          <div class="popup-footer">
            <span class="material-icons">lock</span>
            <span>We respect your privacy. Unsubscribe anytime.</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .popup-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .popup-container {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 24px;
      max-width: 800px;
      width: 100%;
      position: relative;
      overflow: hidden;
      box-shadow: 0 25px 100px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(201, 169, 98, 0.2);
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.3s ease;
      z-index: 10;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        transform: rotate(90deg);
      }
    }

    .popup-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .popup-image {
      background: linear-gradient(135deg, #c9a962 0%, #a08347 100%);
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90" opacity="0.1">👔</text></svg>') center/cover;
      }
    }

    .discount-badge {
      text-align: center;
      position: relative;
      z-index: 1;
    }

    .discount-value {
      display: block;
      font-size: 5rem;
      font-weight: 800;
      color: white;
      line-height: 1;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .discount-text {
      display: block;
      font-size: 2rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      letter-spacing: 0.5em;
      margin-top: 0.5rem;
    }

    .popup-form {
      padding: 3rem;
    }

    .brand-logo {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.3em;
      color: #c9a962;
      margin-bottom: 1rem;
    }

    h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
      margin: 0 0 1rem 0;
      line-height: 1.2;
    }

    p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0 0 1.5rem 0;
    }

    form {
      margin-bottom: 1.5rem;
    }

    .input-group {
      display: flex;
      gap: 0;
      margin-bottom: 1rem;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: border-color 0.3s;

      &:focus-within {
        border-color: #c9a962;
      }

      input[type="email"] {
        flex: 1;
        padding: 1rem 1.25rem;
        border: none;
        background: rgba(255, 255, 255, 0.05);
        color: white;
        font-size: 1rem;
        outline: none;

        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
      }

      button {
        padding: 1rem 1.5rem;
        background: linear-gradient(135deg, #c9a962 0%, #a08347 100%);
        border: none;
        color: #0a0a0f;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;

        &:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85rem;

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #c9a962;
      }
    }

    .social-proof {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.85rem;
    }

    .avatars {
      display: flex;
      
      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, #c9a962 0%, #a08347 100%);
        border: 2px solid #1a1a2e;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 600;
        color: #0a0a0f;
        margin-left: -8px;

        &:first-child {
          margin-left: 0;
        }
      }
    }

    .success-state {
      text-align: center;
      padding: 2rem 0;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;

      .material-icons {
        font-size: 40px;
        color: white;
      }
    }

    .success-state h3 {
      font-size: 1.5rem;
      color: white;
      margin: 0 0 1rem 0;
    }

    .success-state p {
      margin: 0.5rem 0;
      
      strong {
        color: #c9a962;
        font-size: 1.2rem;
        letter-spacing: 0.1em;
      }
    }

    .success-state .small {
      font-size: 0.85rem;
      margin-top: 1rem;
    }

    .shop-btn {
      margin-top: 1.5rem;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #c9a962 0%, #a08347 100%);
      border: none;
      border-radius: 12px;
      color: #0a0a0f;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(201, 169, 98, 0.3);
      }
    }

    .popup-footer {
      padding: 1rem 2rem;
      background: rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.8rem;

      .material-icons {
        font-size: 14px;
      }
    }

    .loader {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(0, 0, 0, 0.2);
      border-top-color: #0a0a0f;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .popup-content {
        grid-template-columns: 1fr;
      }

      .popup-image {
        min-height: 150px;
        padding: 2rem;
      }

      .discount-value {
        font-size: 3rem;
      }

      .discount-text {
        font-size: 1.25rem;
      }

      .popup-form {
        padding: 2rem;
      }

      h2 {
        font-size: 1.5rem;
      }

      .input-group {
        flex-direction: column;
        
        button {
          padding: 1rem;
        }
      }
    }
  `]
})
export class NewsletterPopupComponent implements OnInit {
  isVisible = signal(false);
  submitted = signal(false);
  loading = signal(false);
  email = '';
  agreeTerms = false;

  ngOnInit() {
    // Show popup after 5 seconds for first-time visitors
    const hasSeenPopup = localStorage.getItem('vw_newsletter_seen');
    if (!hasSeenPopup) {
      setTimeout(() => {
        this.isVisible.set(true);
      }, 5000);
    }
  }

  close() {
    this.isVisible.set(false);
    localStorage.setItem('vw_newsletter_seen', 'true');
  }

  subscribe(event: Event) {
    event.preventDefault();
    if (!this.email || !this.agreeTerms) return;

    this.loading.set(true);

    // Simulate API call
    setTimeout(() => {
      this.loading.set(false);
      this.submitted.set(true);
      localStorage.setItem('vw_newsletter_email', this.email);
    }, 1500);
  }
}
