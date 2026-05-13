import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';

type PaymentMethod = {
  id: string;
  type: 'UPI' | 'CARD';
  label: string;
  isDefault: boolean;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="settings-page">
      <div class="settings-header">
        <h2>Account Settings</h2>
        <p>Manage your profile, preferences, security, and shopping controls.</p>
      </div>

      @if (generalMessage()) {
        <div class="alert alert-info">{{ generalMessage() }}</div>
      }

      @if (profileSaved()) {
        <div class="alert alert-success">{{ profileSaved() }}</div>
      }

      @if (profileError()) {
        <div class="alert alert-error">{{ profileError() }}</div>
      }

      @if (passwordSaved()) {
        <div class="alert alert-success">{{ passwordSaved() }}</div>
      }

      @if (passwordError()) {
        <div class="alert alert-error">{{ passwordError() }}</div>
      }

      <div class="preview-note">
        <span class="material-icons-outlined">info</span>
        <span>Live mode: profile and password use backend APIs, preferences and payment methods are saved in real-time.</span>
      </div>

      <section class="settings-card">
        <div class="card-title">
          <span class="material-icons-outlined">person</span>
          <h3>Profile</h3>
        </div>
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="profile-form">
          <div class="avatar-row">
            <div class="avatar-preview">
              @if (avatarPreview()) {
                <img [src]="avatarPreview()!" alt="Profile avatar">
              } @else {
                <span class="material-icons-outlined">person</span>
              }
            </div>
            <label class="upload-btn">
              Upload profile picture
              <input type="file" accept="image/*" (change)="onAvatarSelected($event)">
            </label>
          </div>

          <div class="preference-grid">
            <div class="pref-field">
              <label>Edit name (First)</label>
              <input type="text" formControlName="first_name">
            </div>
            <div class="pref-field">
              <label>Edit name (Last)</label>
              <input type="text" formControlName="last_name">
            </div>
            <div class="pref-field">
              <label>Edit email</label>
              <input type="email" formControlName="email">
            </div>
            <div class="pref-field">
              <label>Edit phone number</label>
              <input type="tel" formControlName="phone">
            </div>
          </div>

          <button class="primary-btn" type="submit" [disabled]="profileLoading() || profileForm.invalid">
            {{ profileLoading() ? 'Saving...' : 'Save profile changes' }}
          </button>
        </form>
      </section>

      <section class="settings-card">
        <div class="card-title">
          <span class="material-icons-outlined">lock</span>
          <h3>Security</h3>
        </div>
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="profile-form">
          <div class="preference-grid">
            <div class="pref-field">
              <label>Current password</label>
              <input type="password" formControlName="currentPassword">
            </div>
            <div class="pref-field">
              <label>New password</label>
              <input type="password" formControlName="newPassword">
            </div>
            <div class="pref-field">
              <label>Confirm new password</label>
              <input type="password" formControlName="confirmPassword">
            </div>
          </div>

          <div class="actions-grid">
            <button type="submit" [disabled]="passwordLoading() || passwordForm.invalid">
              {{ passwordLoading() ? 'Updating...' : 'Change password' }}
            </button>
            <button type="button" (click)="logoutAllDevices()">Logout from all devices</button>
            <button type="button" (click)="toggleFlag('twoFactorEnabled')" [class.active]="twoFactorEnabled()">
              Two-factor authentication: {{ twoFactorEnabled() ? 'Enabled' : 'Disabled' }}
            </button>
          </div>
        </form>
      </section>

      <section class="settings-card">
        <div class="card-title">
          <span class="material-icons-outlined">location_on</span>
          <h3>Address Management</h3>
        </div>
        <div class="actions-grid">
          <a routerLink="/account/addresses">Add new address</a>
          <a routerLink="/account/addresses">Edit address</a>
          <a routerLink="/account/addresses">Delete address</a>
          <a routerLink="/account/addresses">Set default address</a>
        </div>
      </section>

      <section class="settings-card">
        <div class="card-title">
          <span class="material-icons-outlined">inventory_2</span>
          <h3>Orders</h3>
        </div>
        <div class="actions-grid">
          <a routerLink="/account/orders">View order history</a>
          <a routerLink="/track-order">Track orders</a>
          <button type="button">Cancel / return orders</button>
        </div>
      </section>

      <section class="settings-card">
        <div class="card-title">
          <span class="material-icons-outlined">favorite</span>
          <h3>Wishlist</h3>
        </div>
        <div class="actions-grid">
          <a routerLink="/account/wishlist">View saved items</a>
          <a routerLink="/cart">Move items to cart</a>
          <a routerLink="/account/wishlist">Remove items</a>
        </div>
      </section>

      <section class="settings-card">
        <div class="card-title">
          <span class="material-icons-outlined">payments</span>
          <h3>Payments</h3>
        </div>
        <div class="preference-grid">
          <div class="pref-field">
            <label>Type</label>
            <select [value]="paymentType()" (change)="onPaymentTypeChange($event)">
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </div>
          <div class="pref-field">
            <label>{{ paymentType() === 'UPI' ? 'UPI ID' : 'Card number' }}</label>
            <input
              type="text"
              [value]="paymentInput()"
              (input)="onPaymentInputChange($event)"
              [placeholder]="paymentType() === 'UPI' ? 'yourname@upi' : '4111 1111 1111 1111'"
            >
          </div>
        </div>

        <div class="actions-grid">
          <button type="button" (click)="addPaymentMethod()">Save cards / UPI</button>
          <a routerLink="/account/orders">View payment history</a>
        </div>

        @if (payments().length > 0) {
          <div class="payment-list">
            @for (method of payments(); track method.id) {
              <div class="payment-item">
                <div>
                  <strong>{{ method.type }}</strong>
                  <p>{{ maskPaymentLabel(method) }}</p>
                </div>
                <div class="actions-grid compact">
                  <button type="button" (click)="setDefaultPayment(method.id)" [class.active]="method.isDefault">
                    {{ method.isDefault ? 'Default' : 'Set default' }}
                  </button>
                  <button type="button" (click)="removePayment(method.id)">Remove</button>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <section class="settings-card">
        <div class="card-title">
          <span class="material-icons-outlined">notifications</span>
          <h3>Notifications</h3>
        </div>
        <div class="toggles">
          <label class="toggle-item">
            <span>Order updates</span>
            <button type="button" (click)="toggleFlag('orderUpdates')" [class.active]="orderUpdates()">{{ orderUpdates() ? 'On' : 'Off' }}</button>
          </label>
          <label class="toggle-item">
            <span>Offers & promotions</span>
            <button type="button" (click)="toggleFlag('offersPromotions')" [class.active]="offersPromotions()">{{ offersPromotions() ? 'On' : 'Off' }}</button>
          </label>
          <label class="toggle-item">
            <span>Email / SMS preferences</span>
            <button type="button" (click)="toggleFlag('emailSmsPrefs')" [class.active]="emailSmsPrefs()">{{ emailSmsPrefs() ? 'On' : 'Off' }}</button>
          </label>
        </div>
      </section>

      <section class="settings-card">
        <div class="card-title">
          <span class="material-icons-outlined">tune</span>
          <h3>Preferences</h3>
        </div>
        <div class="preference-grid">
          <div class="pref-field">
            <label>Language selection</label>
            <select [value]="language()" (change)="onLanguageChange($event)">
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          <div class="pref-field">
            <label>Dark / light mode</label>
            <select [value]="themeMode()" (change)="onThemeChange($event)">
              <option value="Dark">Dark</option>
              <option value="Light">Light</option>
            </select>
          </div>

          <div class="pref-field">
            <label>Currency (optional)</label>
            <select [value]="currency()" (change)="onCurrencyChange($event)">
              <option value="INR">INR - Indian Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
        </div>
      </section>

      <section class="settings-card" *ngIf="showAdminTools()">
        <div class="card-title">
          <span class="material-icons-outlined">admin_panel_settings</span>
          <h3>Admin</h3>
        </div>
        <div class="actions-grid">
          <a routerLink="/admin/products">Manage products</a>
          <a routerLink="/admin/users">Manage users</a>
          <a routerLink="/admin/orders">Manage orders</a>
          <a routerLink="/admin">Manage payments</a>
          <a routerLink="/admin/coupons">Add discounts / coupons</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .settings-header {
      h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 2rem;
        color: #f8f6f1;
        margin-bottom: 0.25rem;
      }

      p {
        color: rgba(255, 255, 255, 0.65);
        font-size: 0.95rem;
      }
    }

    .alert {
      padding: 0.7rem 0.9rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 0.85rem;
    }

    .alert-success {
      border-color: rgba(16, 185, 129, 0.45);
      background: rgba(16, 185, 129, 0.12);
      color: #6ee7b7;
    }

    .alert-error {
      border-color: rgba(239, 68, 68, 0.45);
      background: rgba(239, 68, 68, 0.12);
      color: #fca5a5;
    }

    .alert-info {
      border-color: rgba(96, 165, 250, 0.45);
      background: rgba(96, 165, 250, 0.1);
      color: #bfdbfe;
    }

    .preview-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(201, 169, 98, 0.12);
      border: 1px solid rgba(201, 169, 98, 0.35);
      color: #f3e6c7;
      padding: 0.75rem 0.9rem;
      font-size: 0.85rem;

      .material-icons-outlined {
        font-size: 1rem;
      }
    }

    .settings-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.09);
      padding: 1rem;
    }

    .profile-form {
      display: grid;
      gap: 0.8rem;
    }

    .avatar-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .avatar-preview {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.2);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.06);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .upload-btn {
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.55rem 0.75rem;
      font-size: 0.83rem;
      color: rgba(255, 255, 255, 0.9);
      cursor: pointer;

      input {
        display: none;
      }
    }

    .primary-btn {
      border: 1px solid rgba(201, 169, 98, 0.65);
      background: rgba(201, 169, 98, 0.2);
      color: #f8f6f1;
      padding: 0.65rem 0.8rem;
      width: fit-content;
      cursor: pointer;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.9rem;

      .material-icons-outlined {
        color: #c9a962;
      }

      h3 {
        margin: 0;
        color: #f5f5f5;
        font-size: 1.05rem;
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 0.625rem;

      button,
      a {
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(255, 255, 255, 0.04);
        color: rgba(255, 255, 255, 0.88);
        text-decoration: none;
        padding: 0.7rem 0.8rem;
        font-size: 0.86rem;
        font-family: 'Montserrat', sans-serif;
        text-align: left;
        cursor: pointer;
        transition: 0.2s ease;

        &:hover {
          border-color: rgba(201, 169, 98, 0.7);
          color: #fff;
          background: rgba(201, 169, 98, 0.14);
        }
      }
    }

    .toggles {
      display: grid;
      gap: 0.625rem;
    }

    .toggle-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.7rem 0.8rem;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.03);
      color: rgba(255, 255, 255, 0.88);
      gap: 0.8rem;

      span {
        font-size: 0.88rem;
      }

      button {
        min-width: 64px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: transparent;
        color: rgba(255, 255, 255, 0.8);
        padding: 0.35rem 0.5rem;
        cursor: pointer;

        &.active {
          border-color: #c9a962;
          background: rgba(201, 169, 98, 0.2);
          color: #fff;
        }
      }
    }

    .preference-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.75rem;
    }

    .pref-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      label {
        font-size: 0.82rem;
        color: rgba(255, 255, 255, 0.66);
      }

      select {
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(0, 0, 0, 0.25);
        color: #fff;
        padding: 0.6rem;
      }

      input {
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(0, 0, 0, 0.25);
        color: #fff;
        padding: 0.6rem;
      }
    }

    .payment-list {
      display: grid;
      gap: 0.6rem;
      margin-top: 0.8rem;
    }

    .payment-item {
      display: flex;
      justify-content: space-between;
      gap: 0.7rem;
      align-items: center;
      padding: 0.7rem 0.8rem;
      border: 1px solid rgba(255, 255, 255, 0.14);

      p {
        margin: 0.2rem 0 0;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.82rem;
      }
    }

    .actions-grid.compact {
      grid-template-columns: 1fr 1fr;
      min-width: 210px;
    }

    @media (max-width: 768px) {
      .settings-header h2 {
        font-size: 1.5rem;
      }
    }

    :host-context(body.vw-light-mode) .settings-header h2,
    :host-context(body.vw-light-mode) .settings-header p,
    :host-context(body.vw-light-mode) .card-title h3,
    :host-context(body.vw-light-mode) .pref-field label,
    :host-context(body.vw-light-mode) .toggle-item,
    :host-context(body.vw-light-mode) .payment-item strong,
    :host-context(body.vw-light-mode) .payment-item p {
      color: #1f2937;
    }

    :host-context(body.vw-light-mode) .settings-card {
      background: #ffffff;
      border-color: rgba(17, 24, 39, 0.12);
    }

    :host-context(body.vw-light-mode) .preview-note {
      background: rgba(201, 169, 98, 0.2);
      color: #4b5563;
      border-color: rgba(166, 139, 75, 0.45);
    }

    :host-context(body.vw-light-mode) .actions-grid button,
    :host-context(body.vw-light-mode) .actions-grid a,
    :host-context(body.vw-light-mode) .toggle-item button,
    :host-context(body.vw-light-mode) .upload-btn,
    :host-context(body.vw-light-mode) .pref-field input,
    :host-context(body.vw-light-mode) .pref-field select {
      background: #f9fafb;
      color: #1f2937;
      border-color: rgba(17, 24, 39, 0.2);
    }

    :host-context(body.vw-light-mode) .actions-grid button:hover,
    :host-context(body.vw-light-mode) .actions-grid a:hover,
    :host-context(body.vw-light-mode) .toggle-item button:hover {
      background: rgba(201, 169, 98, 0.2);
      color: #111827;
    }

    :host-context(body.vw-light-mode) .alert-success {
      color: #065f46;
      background: rgba(16, 185, 129, 0.15);
    }

    :host-context(body.vw-light-mode) .alert-error {
      color: #991b1b;
      background: rgba(239, 68, 68, 0.15);
    }

    :host-context(body.vw-light-mode) .alert-info {
      color: #1e3a8a;
      background: rgba(96, 165, 250, 0.18);
    }
  `]
})
export class SettingsComponent implements OnInit {
  readonly settingsStorageKey = 'vw_account_settings';
  readonly paymentMethodsKey = 'vw_payment_methods';

  profileLoading = signal(false);
  passwordLoading = signal(false);
  profileSaved = signal('');
  profileError = signal('');
  passwordSaved = signal('');
  passwordError = signal('');
  generalMessage = signal('');

  orderUpdates = signal(true);
  offersPromotions = signal(true);
  emailSmsPrefs = signal(true);
  twoFactorEnabled = signal(false);

  language = this.languageService.language;
  themeMode = signal('Dark');
  currency = signal('INR');

  avatarPreview = signal<string | null>(null);
  payments = signal<PaymentMethod[]>([]);
  paymentInput = signal('');
  paymentType = signal<'UPI' | 'CARD'>('UPI');

  profileForm = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    avatar_url: ['']
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  showAdminTools = computed(() => this.authService.isAdmin());

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadSavedSettings();
    this.loadSavedPaymentMethods();
    this.applyTheme(this.themeMode());
  }

  loadProfile(): void {
    const user = this.authService.user();
    if (!user) return;

    this.profileForm.patchValue({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar_url: user.avatar_url || ''
    });

    this.avatarPreview.set(user.avatar_url || null);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.profileLoading.set(true);
    this.profileSaved.set('');
    this.profileError.set('');

    const raw = this.profileForm.getRawValue();
    const payload = {
      first_name: raw.first_name || '',
      last_name: raw.last_name || '',
      email: raw.email || '',
      phone: raw.phone || '',
      avatar_url: raw.avatar_url || null
    };

    this.authService.updateProfile(payload).subscribe({
      next: (user) => {
        this.profileLoading.set(false);
        this.profileSaved.set('Profile updated successfully.');
        this.avatarPreview.set(user.avatar_url || this.avatarPreview());
      },
      error: (err) => {
        this.profileLoading.set(false);
        this.profileError.set(err?.error?.detail || 'Unable to update profile.');
      }
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;

      this.avatarPreview.set(result);
      this.profileForm.patchValue({ avatar_url: result });
      this.saveProfile();
    };
    reader.readAsDataURL(file);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    const currentPassword = this.passwordForm.value.currentPassword || '';
    const newPassword = this.passwordForm.value.newPassword || '';
    const confirmPassword = this.passwordForm.value.confirmPassword || '';

    this.passwordSaved.set('');
    this.passwordError.set('');

    if (newPassword !== confirmPassword) {
      this.passwordError.set('New password and confirm password do not match.');
      return;
    }

    this.passwordLoading.set(true);
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordLoading.set(false);
        this.passwordSaved.set('Password changed successfully.');
        this.passwordForm.reset();
      },
      error: (err) => {
        this.passwordLoading.set(false);
        this.passwordError.set(err?.error?.detail || 'Unable to change password.');
      }
    });
  }

  logoutAllDevices(): void {
    this.generalMessage.set('You have been logged out. Full multi-device logout needs token invalidation API and can be added next.');
    this.authService.logout();
  }

  toggleFlag(key: 'orderUpdates' | 'offersPromotions' | 'emailSmsPrefs' | 'twoFactorEnabled'): void {
    const target = this[key];
    target.set(!target());
    this.persistSettings();
  }

  onLanguageChange(event: Event): void {
    const selected = this.getSelectValue(event);
    this.languageService.setLanguage(selected === 'Tamil' || selected === 'Hindi' ? selected : 'English');
    this.persistSettings();
  }

  onPaymentTypeChange(event: Event): void {
    this.paymentType.set(this.getSelectValue(event) === 'CARD' ? 'CARD' : 'UPI');
  }

  onPaymentInputChange(event: Event): void {
    this.paymentInput.set((event.target as HTMLInputElement).value);
  }

  onThemeChange(event: Event): void {
    const mode = this.getSelectValue(event);
    this.themeMode.set(mode);
    this.applyTheme(mode);
    this.persistSettings();
  }

  onCurrencyChange(event: Event): void {
    this.currency.set(this.getSelectValue(event));
    this.persistSettings();
    if (this.currency() !== 'INR') {
      this.generalMessage.set('Display currency is saved, but checkout and catalog currently operate in INR.');
    }
  }

  addPaymentMethod(): void {
    const value = this.paymentInput().trim();
    if (!value) return;

    const next = [...this.payments()];
    const item: PaymentMethod = {
      id: `${Date.now()}`,
      type: this.paymentType(),
      label: value,
      isDefault: next.length === 0
    };
    next.push(item);
    this.payments.set(next);
    this.paymentInput.set('');
    this.savePaymentMethods();
  }

  setDefaultPayment(id: string): void {
    this.payments.set(this.payments().map(p => ({ ...p, isDefault: p.id === id })));
    this.savePaymentMethods();
  }

  removePayment(id: string): void {
    const filtered = this.payments().filter(p => p.id !== id);
    if (filtered.length > 0 && !filtered.some(p => p.isDefault)) {
      filtered[0].isDefault = true;
    }
    this.payments.set(filtered);
    this.savePaymentMethods();
  }

  maskPaymentLabel(method: PaymentMethod): string {
    if (method.type === 'UPI') return method.label;
    const digits = method.label.replace(/\D/g, '');
    if (digits.length < 4) return method.label;
    return `**** **** **** ${digits.slice(-4)}`;
  }

  private persistSettings(): void {
    localStorage.setItem(this.settingsStorageKey, JSON.stringify({
      orderUpdates: this.orderUpdates(),
      offersPromotions: this.offersPromotions(),
      emailSmsPrefs: this.emailSmsPrefs(),
      twoFactorEnabled: this.twoFactorEnabled(),
      language: this.language(),
      themeMode: this.themeMode(),
      currency: this.currency()
    }));
  }

  private loadSavedSettings(): void {
    const raw = localStorage.getItem(this.settingsStorageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      this.orderUpdates.set(!!parsed.orderUpdates);
      this.offersPromotions.set(!!parsed.offersPromotions);
      this.emailSmsPrefs.set(!!parsed.emailSmsPrefs);
      this.twoFactorEnabled.set(!!parsed.twoFactorEnabled);
      this.languageService.setLanguage(parsed.language === 'Tamil' || parsed.language === 'Hindi' ? parsed.language : 'English');
      this.themeMode.set(parsed.themeMode || 'Dark');
      this.currency.set(parsed.currency || 'INR');
    } catch {
      // Ignore malformed local storage.
    }
  }

  private savePaymentMethods(): void {
    localStorage.setItem(this.paymentMethodsKey, JSON.stringify(this.payments()));
  }

  private loadSavedPaymentMethods(): void {
    const raw = localStorage.getItem(this.paymentMethodsKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PaymentMethod[];
      if (Array.isArray(parsed)) {
        this.payments.set(parsed);
      }
    } catch {
      // Ignore malformed local storage.
    }
  }

  private applyTheme(mode: string): void {
    document.body.classList.toggle('vw-light-mode', mode === 'Light');
    document.body.classList.toggle('vw-dark-mode', mode !== 'Light');
  }

  getSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
