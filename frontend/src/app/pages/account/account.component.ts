import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, User } from '@core/services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="account-page">
      <div class="container">
        <div class="account-layout">
          <!-- Sidebar -->
          <aside class="account-sidebar">
            <div class="user-card">
              <div class="user-avatar">
                {{ getInitials() }}
              </div>
              <div class="user-info">
                <h3>{{ user()?.first_name }} {{ user()?.last_name }}</h3>
                <p>{{ user()?.email }}</p>
              </div>
            </div>

            <nav class="account-nav">
              <a routerLink="/account/profile" routerLinkActive="active">
                <span class="material-icons-outlined">person</span>
                {{ t('profile') }}
              </a>
              <a routerLink="/account/orders" routerLinkActive="active">
                <span class="material-icons-outlined">inventory_2</span>
                {{ t('orders') }}
              </a>
              <a routerLink="/account/addresses" routerLinkActive="active">
                <span class="material-icons-outlined">location_on</span>
                {{ t('addresses') }}
              </a>
              <a routerLink="/account/wishlist" routerLinkActive="active">
                <span class="material-icons-outlined">favorite</span>
                {{ t('wishlist') }}
              </a>
              <a routerLink="/account/settings" routerLinkActive="active">
                <span class="material-icons-outlined">settings</span>
                {{ t('settings') }}
              </a>
              <button class="logout-btn" (click)="logout()">
                <span class="material-icons-outlined">logout</span>
                {{ t('logout') }}
              </button>
            </nav>
          </aside>

          <!-- Main Content -->
          <main class="account-content">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .account-page {
      padding: 2rem 0 4rem;
      background-color: #0a0a0f;
      min-height: calc(100vh - 200px);
    }

    .account-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
      align-items: start;
    }

    /* Sidebar */
    .account-sidebar {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      overflow: hidden;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: #f8f6f1;
      border-bottom: 1px solid #e6deca;
    }

    .user-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c9a962 0%, #a68b4b 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 600;
      color: #0a0a0f;
    }

    .user-info {
      h3 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.1rem;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }

      p {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        color: #4b5563;
      }
    }

    .account-nav {
      display: flex;
      flex-direction: column;
      padding: 1rem 0;

      a, button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1.5rem;
        color: rgba(255, 255, 255, 0.6);
        transition: all 0.3s ease;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        text-decoration: none;

        .material-icons-outlined {
          font-size: 1.25rem;
        }

        &:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }

        &.active {
          color: #c9a962;
          background: rgba(201, 169, 98, 0.1);
          border-left: 3px solid #c9a962;
        }
      }

      .logout-btn {
        color: #ef4444;
        margin-top: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 1rem;

        &:hover {
          background: rgba(239, 68, 68, 0.1);
        }
      }
    }

    /* Main Content */
    .account-content {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 2rem;
      min-height: 400px;
    }

    /* Responsive */
    @media (max-width: 992px) {
      .account-layout {
        grid-template-columns: 1fr;
      }

      .account-sidebar {
        position: sticky;
        top: 80px;
        z-index: 10;
      }

      .user-card {
        padding: 1rem;
      }

      .account-nav {
        flex-direction: row;
        overflow-x: auto;
        padding: 0.5rem;
        gap: 0.25rem;

        a, button {
          padding: 0.75rem 1rem;
          white-space: nowrap;
          border-radius: var(--border-radius);

          .material-icons-outlined {
            font-size: 1.125rem;
          }

          &.active {
            border-left: none;
          }
        }

        .logout-btn {
          border-top: none;
          margin-top: 0;
          padding-top: 0.75rem;
        }
      }
    }

    @media (max-width: 576px) {
      .account-nav {
        a span:not(.material-icons-outlined),
        button span:not(.material-icons-outlined) {
          display: none;
        }

        a, button {
          padding: 0.75rem;
          justify-content: center;
        }
      }
    }

    :host-context(body.vw-light-mode) .account-page {
      background-color: #f4f1ea;
    }

    :host-context(body.vw-light-mode) .account-sidebar,
    :host-context(body.vw-light-mode) .account-content {
      background: #ffffff;
      border-color: rgba(17, 24, 39, 0.12);
    }

    :host-context(body.vw-light-mode) .account-nav a,
    :host-context(body.vw-light-mode) .account-nav button {
      color: #374151;
    }

    :host-context(body.vw-light-mode) .account-nav a:hover,
    :host-context(body.vw-light-mode) .account-nav button:hover {
      color: #111827;
      background: rgba(17, 24, 39, 0.06);
    }

    :host-context(body.vw-light-mode) .account-nav a.active {
      color: #a68b4b;
      background: rgba(201, 169, 98, 0.16);
      border-left-color: #c9a962;
    }
  `]
})
export class AccountComponent implements OnInit {
  user = signal<User | null>(null);
  language = signal('English');

  private translations: Record<string, Record<string, string>> = {
    English: {
      profile: 'Profile',
      orders: 'Orders',
      addresses: 'Addresses',
      wishlist: 'Wishlist',
      settings: 'Settings',
      logout: 'Logout'
    },
    Tamil: {
      profile: 'சுயவிவரம்',
      orders: 'ஆர்டர்கள்',
      addresses: 'முகவரிகள்',
      wishlist: 'விருப்ப பட்டியல்',
      settings: 'அமைப்புகள்',
      logout: 'வெளியேறு'
    },
    Hindi: {
      profile: 'प्रोफाइल',
      orders: 'ऑर्डर',
      addresses: 'पते',
      wishlist: 'विशलिस्ट',
      settings: 'सेटिंग्स',
      logout: 'लॉगआउट'
    }
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user.set(this.authService.user());
    const raw = localStorage.getItem('vw_account_settings');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.language.set(parsed.language || 'English');
      } catch {
        this.language.set('English');
      }
    }
  }

  @HostListener('window:vw-language-changed', ['$event'])
  onLanguageChanged(event: CustomEvent<{ language: string }>): void {
    this.language.set(event.detail?.language || 'English');
  }

  t(key: string): string {
    const lang = this.language();
    return this.translations[lang]?.[key] || this.translations['English'][key] || key;
  }

  getInitials(): string {
    const firstName = this.user()?.first_name || '';
    const lastName = this.user()?.last_name || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
