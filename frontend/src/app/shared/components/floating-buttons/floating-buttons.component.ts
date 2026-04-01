import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-floating-buttons',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideIn', [
      state('void', style({ transform: 'translateX(100px)', opacity: 0 })),
      state('*', style({ transform: 'translateX(0)', opacity: 1 })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ])
  ],
  template: `
    <div class="floating-buttons" [@slideIn]>
      <!-- WhatsApp Support -->
      <div class="fab-wrapper">
        @if (showWhatsAppMenu()) {
          <div class="whatsapp-menu">
            <div class="menu-header">
              <span class="material-icons">support_agent</span>
              <div>
                <strong>Need Help?</strong>
                <span>We typically reply within minutes</span>
              </div>
            </div>
            <a 
              href="https://wa.me/919876543210?text=Hi! I need help with my order on Vibe Wears" 
              target="_blank"
              class="whatsapp-chat-btn"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Start Chat
            </a>
            <div class="quick-options">
              <a href="https://wa.me/919876543210?text=Track my order" target="_blank">Track Order</a>
              <a href="https://wa.me/919876543210?text=Size inquiry" target="_blank">Size Help</a>
              <a href="https://wa.me/919876543210?text=Return request" target="_blank">Returns</a>
            </div>
          </div>
        }
        <button 
          class="fab whatsapp-fab"
          (click)="toggleWhatsApp()"
          [class.active]="showWhatsAppMenu()"
        >
          @if (showWhatsAppMenu()) {
            <span class="material-icons">close</span>
          } @else {
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span class="notification-dot"></span>
          }
        </button>
      </div>

      <!-- Back to Top -->
      @if (showBackToTop()) {
        <button 
          class="fab back-to-top"
          (click)="scrollToTop()"
          [@slideIn]
        >
          <span class="material-icons">keyboard_arrow_up</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .floating-buttons {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
      z-index: 9999;
    }

    .fab-wrapper {
      position: relative;
    }

    .fab {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      position: relative;

      &:hover {
        transform: scale(1.1);
      }
    }

    .whatsapp-fab {
      background: linear-gradient(135deg, #25D366, #128C7E);
      color: white;

      &.active {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        
        .material-icons {
          color: white;
        }
      }
    }

    .notification-dot {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 12px;
      height: 12px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid #128C7E;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .back-to-top {
      background: linear-gradient(135deg, #c9a962, #a08347);
      color: #0a0a0f;
      width: 50px;
      height: 50px;

      .material-icons {
        font-size: 28px;
      }
    }

    .whatsapp-menu {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 300px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .menu-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .material-icons {
        font-size: 32px;
        color: #25D366;
      }

      strong {
        display: block;
        color: white;
        font-size: 1rem;
      }

      span {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .whatsapp-chat-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #25D366, #128C7E);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;

      &:hover {
        filter: brightness(1.1);
        transform: translateY(-2px);
      }
    }

    .quick-options {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;

      a {
        flex: 1;
        padding: 0.5rem;
        text-align: center;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.7);
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        text-decoration: none;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
      }
    }

    @media (max-width: 480px) {
      .floating-buttons {
        bottom: 16px;
        right: 16px;
      }

      .fab {
        width: 54px;
        height: 54px;
      }

      .back-to-top {
        width: 46px;
        height: 46px;
      }

      .whatsapp-menu {
        width: 280px;
        right: -10px;
      }

    }
  `]
})
export class FloatingButtonsComponent implements OnInit, OnDestroy {
  showBackToTop = signal(false);
  showWhatsAppMenu = signal(false);

  constructor() {}
  
  @HostListener('window:scroll')
  onScroll() {
    this.showBackToTop.set(window.scrollY > 400);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.fab-wrapper') && this.showWhatsAppMenu()) {
      this.showWhatsAppMenu.set(false);
    }
  }

  ngOnInit() {
    this.onScroll();
  }

  ngOnDestroy() {}

  toggleWhatsApp() {
    this.showWhatsAppMenu.update(v => !v);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
