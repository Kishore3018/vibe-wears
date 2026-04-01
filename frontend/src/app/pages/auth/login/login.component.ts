import { Component, signal, OnDestroy, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { WishlistService } from '@core/services/wishlist.service';
import { CartService } from '@core/services/cart.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to continue shopping</p>
          </div>

          <!-- Login Method Tabs -->
          <div class="login-tabs">
            <button 
              class="tab-btn" 
              [class.active]="loginMethod() === 'email'"
              (click)="switchMethod('email')"
            >
              <span class="material-icons">email</span>
              Email
            </button>
            <button 
              class="tab-btn" 
              [class.active]="loginMethod() === 'mobile'"
              (click)="switchMethod('mobile')"
            >
              <span class="material-icons">smartphone</span>
              Mobile
            </button>
          </div>

          @if (error()) {
            <div class="alert alert-error">
              <span class="material-icons">error_outline</span>
              {{ error() }}
            </div>
          }

          @if (success()) {
            <div class="alert alert-success">
              <span class="material-icons">check_circle</span>
              {{ success() }}
            </div>
          }

          <!-- Email Login Form -->
          @if (loginMethod() === 'email') {
            <form [formGroup]="loginForm" (ngSubmit)="onEmailSubmit()">
              <div class="form-group">
                <label for="email">Email Address</label>
                <div class="input-wrapper">
                  <span class="material-icons-outlined">email</span>
                  <input 
                    type="email" 
                    id="email" 
                    formControlName="email"
                    placeholder="Enter your email"
                    [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                  >
                </div>
                @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                  <span class="error-message">Please enter a valid email address</span>
                }
              </div>

              <div class="form-group">
                <label for="password">Password</label>
                <div class="input-wrapper">
                  <span class="material-icons-outlined">lock</span>
                  <input 
                    [type]="showPassword() ? 'text' : 'password'" 
                    id="password" 
                    formControlName="password"
                    placeholder="Enter your password"
                    [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                  >
                  <button type="button" class="toggle-password" (click)="togglePassword()">
                    <span class="material-icons-outlined">
                      {{ showPassword() ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
                @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                  <span class="error-message">Password is required</span>
                }
              </div>

              <div class="form-options">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="rememberMe">
                  <span>Remember me</span>
                </label>
                <a href="#" class="forgot-link">Forgot Password?</a>
              </div>

              <button 
                type="submit" 
                class="btn btn-primary btn-lg w-full"
                [disabled]="loginForm.invalid || loading()"
              >
                @if (loading()) {
                  <span class="spinner"></span>
                  Signing in...
                } @else {
                  Sign In
                }
              </button>
            </form>
          }

          <!-- Mobile OTP Login Form -->
          @if (loginMethod() === 'mobile') {
            @if (otpStep() === 'phone') {
              <!-- Step 1: Enter Phone Number -->
              <form [formGroup]="phoneForm" (ngSubmit)="onSendOTP()">
                <div class="form-group">
                  <label for="phone">Mobile Number</label>
                  <div class="input-wrapper phone-input">
                    <span class="country-code">+91</span>
                    <input 
                      type="tel" 
                      id="phone" 
                      formControlName="phone"
                      placeholder="Enter 10-digit mobile number"
                      maxlength="10"
                      [class.error]="phoneForm.get('phone')?.invalid && phoneForm.get('phone')?.touched"
                    >
                  </div>
                  @if (phoneForm.get('phone')?.invalid && phoneForm.get('phone')?.touched) {
                    <span class="error-message">Please enter a valid 10-digit mobile number</span>
                  }
                </div>

                <div class="otp-info">
                  <span class="material-icons">info</span>
                  <p>We'll send a 6-digit OTP to this number for verification</p>
                </div>

                <button 
                  type="submit" 
                  class="btn btn-primary btn-lg w-full"
                  [disabled]="phoneForm.invalid || loading()"
                >
                  @if (loading()) {
                    <span class="spinner"></span>
                    Sending OTP...
                  } @else {
                    Send OTP
                  }
                </button>
              </form>
            } @else {
              <!-- Step 2: Enter OTP -->
              <form [formGroup]="otpForm" (ngSubmit)="onVerifyOTP()">
                <div class="otp-header">
                  <p>Enter the OTP sent to</p>
                  <strong>+91 {{ phoneForm.get('phone')?.value }}</strong>
                  <button type="button" class="change-btn" (click)="changePhone()">Change</button>
                </div>

                <div class="form-group">
                  <label for="otp">Enter OTP</label>
                  <div class="otp-inputs">
                    @for (digit of [0,1,2,3,4,5]; track digit) {
                      <input 
                        type="text" 
                        maxlength="1"
                        class="otp-digit"
                        [attr.data-index]="digit"
                        (input)="onOtpInput($event, digit)"
                        (keydown)="onOtpKeydown($event, digit)"
                        (paste)="onOtpPaste($event)"
                        [value]="otpDigits()[digit]"
                      >
                    }
                  </div>
                </div>

                <div class="resend-section">
                  @if (resendTimer() > 0) {
                    <p>Resend OTP in <strong>{{ resendTimer() }}s</strong></p>
                  } @else {
                    <button type="button" class="resend-btn" (click)="resendOTP()" [disabled]="loading()">
                      <span class="material-icons">refresh</span>
                      Resend OTP
                    </button>
                  }
                </div>

                <button 
                  type="submit" 
                  class="btn btn-primary btn-lg w-full"
                  [disabled]="!isOtpComplete() || loading()"
                >
                  @if (loading()) {
                    <span class="spinner"></span>
                    Verifying...
                  } @else {
                    Verify & Sign In
                  }
                </button>

                <!-- Demo OTP Display (for testing) -->
                <div class="demo-otp" *ngIf="demoOtp()">
                  <span class="material-icons">science</span>
                  <span>Demo OTP: <strong>{{ demoOtp() }}</strong></span>
                </div>
              </form>
            }
          }

          @if (googleClientId()) {
            <div class="auth-divider">
              <span>or</span>
            </div>

            <button class="social-btn google w-full" (click)="googleSignIn()" [disabled]="googleLoading()">
              @if (googleLoading()) {
                <span class="spinner"></span>
                Signing in with Google...
              } @else {
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              }
            </button>
          }

          <p class="auth-footer">
            Don't have an account? <a routerLink="/auth/register">Create one</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 200px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      background-color: var(--bg-secondary);
    }

    .auth-container {
      width: 100%;
      max-width: 440px;
    }

    .auth-card {
      background-color: var(--bg-primary);
      padding: 2.5rem;
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-lg);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.5rem;

      h1 {
        font-size: 1.75rem;
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--text-secondary);
      }
    }

    /* Login Method Tabs */
    .login-tabs {
      display: flex;
      background: var(--bg-secondary);
      border-radius: var(--border-radius);
      padding: 4px;
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border: none;
      border-radius: calc(var(--border-radius) - 2px);
      background: transparent;
      color: var(--text-secondary);
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);

      .material-icons {
        font-size: 20px;
      }

      &.active {
        background: var(--bg-primary);
        color: var(--accent-color);
        box-shadow: var(--shadow-sm);
      }

      &:hover:not(.active) {
        color: var(--text-primary);
      }
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: var(--border-radius);
      margin-bottom: 1.5rem;

      &.alert-error {
        background-color: rgba(239, 68, 68, 0.1);
        color: var(--error-color);
        border: 1px solid rgba(239, 68, 68, 0.2);
      }

      &.alert-success {
        background-color: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }

      .material-icons {
        font-size: 1.25rem;
      }
    }

    .form-group {
      margin-bottom: 1.25rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        font-size: 0.9rem;
      }
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      .material-icons-outlined {
        position: absolute;
        left: 1rem;
        color: var(--text-secondary);
        font-size: 1.25rem;
      }

      input {
        width: 100%;
        padding: 0.875rem 1rem 0.875rem 3rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: 1rem;
        transition: var(--transition);

        &:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        &.error {
          border-color: var(--error-color);
        }

        &::placeholder {
          color: var(--text-secondary);
        }
      }

      &.phone-input {
        .country-code {
          position: absolute;
          left: 1rem;
          color: var(--text-primary);
          font-weight: 500;
          font-size: 0.95rem;
          padding-right: 0.75rem;
          border-right: 1px solid var(--border-color);
        }

        input {
          padding-left: 4rem;
        }
      }

      .toggle-password {
        position: absolute;
        right: 0.75rem;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);

        &:hover {
          color: var(--text-primary);
        }
      }
    }

    .error-message {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: var(--error-color);
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--accent-color);
      }
    }

    .forgot-link {
      font-size: 0.9rem;
      color: var(--accent-color);

      &:hover {
        text-decoration: underline;
      }
    }

    /* OTP Info Section */
    .otp-info {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: var(--border-radius);
      margin-bottom: 1.5rem;

      .material-icons {
        color: var(--accent-color);
        font-size: 20px;
      }

      p {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.4;
      }
    }

    /* OTP Header */
    .otp-header {
      text-align: center;
      margin-bottom: 1.5rem;

      p {
        color: var(--text-secondary);
        margin-bottom: 0.25rem;
      }

      strong {
        font-size: 1.1rem;
        display: block;
        margin-bottom: 0.5rem;
      }

      .change-btn {
        background: none;
        border: none;
        color: var(--accent-color);
        font-size: 0.9rem;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    /* OTP Inputs */
    .otp-inputs {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .otp-digit {
      width: 50px;
      height: 56px;
      text-align: center;
      font-size: 1.5rem;
      font-weight: 600;
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius);
      transition: var(--transition);

      &:focus {
        outline: none;
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
      }
    }

    /* Resend Section */
    .resend-section {
      text-align: center;
      margin: 1.5rem 0;

      p {
        color: var(--text-secondary);
        font-size: 0.9rem;

        strong {
          color: var(--accent-color);
        }
      }

      .resend-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: none;
        border: none;
        color: var(--accent-color);
        font-weight: 500;
        cursor: pointer;

        &:hover:not(:disabled) {
          text-decoration: underline;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .material-icons {
          font-size: 18px;
        }
      }
    }

    /* Demo OTP Display */
    .demo-otp {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: var(--border-radius);
      color: #92400e;
      font-size: 0.85rem;

      .material-icons {
        font-size: 18px;
      }

      strong {
        font-family: monospace;
        font-size: 1rem;
        letter-spacing: 2px;
      }
    }

    .w-full {
      width: 100%;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-divider {
      display: flex;
      align-items: center;
      margin: 1.5rem 0;

      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background-color: var(--border-color);
      }

      span {
        padding: 0 1rem;
        color: var(--text-secondary);
        font-size: 0.85rem;
      }
    }

    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.875rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background-color: var(--bg-primary);
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);

      &:hover {
        background-color: var(--bg-secondary);
        border-color: #ddd;
      }

      &.google {
        svg {
          flex-shrink: 0;
        }
      }
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      color: var(--text-secondary);

      a {
        color: var(--accent-color);
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    @media (max-width: 480px) {
      .auth-card {
        padding: 1.5rem;
      }

      .otp-inputs {
        gap: 0.5rem;
      }

      .otp-digit {
        width: 42px;
        height: 48px;
        font-size: 1.25rem;
      }
    }
  `]
})
export class LoginComponent implements OnDestroy, OnInit {
  // Forms
  loginForm: FormGroup;
  phoneForm: FormGroup;
  otpForm: FormGroup;
  
  // State signals
  loading = signal(false);
  error = signal('');
  success = signal('');
  showPassword = signal(false);
  loginMethod = signal<'email' | 'mobile'>('email');
  otpStep = signal<'phone' | 'otp'>('phone');
  otpDigits = signal<string[]>(['', '', '', '', '', '']);
  resendTimer = signal(0);
  demoOtp = signal('');
  googleClientId = signal('');
  googleLoading = signal(false);
  
  private timerInterval: any;
  private apiUrl = 'http://localhost:8000/api/auth';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private wishlistService: WishlistService,
    private cartService: CartService,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });

    this.phoneForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.initGoogleSignIn();
    // Check for method query parameter
    this.route.queryParams.subscribe(params => {
      if (params['method'] === 'mobile') {
        this.loginMethod.set('mobile');
      }
    });
  }

  private initGoogleSignIn(): void {
    // Fetch Google Client ID from backend
    fetch(`${this.apiUrl}/google/client-id`)
      .then(res => res.json())
      .then(data => {
        if (data.client_id) {
          this.googleClientId.set(data.client_id);
          this.initGoogleButton();
        }
      })
      .catch(err => console.log('Google client ID not configured'));
  }

  private initGoogleButton(): void {
    // Wait for Google script to load
    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(checkGoogle);
        
        google.accounts.id.initialize({
          client_id: this.googleClientId(),
          callback: (response: any) => this.handleGoogleCallback(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkGoogle), 5000);
  }

  private handleGoogleCallback(response: any): void {
    this.ngZone.run(() => {
      if (response.credential) {
        this.googleLoading.set(true);
        this.error.set('');
        
        fetch(`${this.apiUrl}/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential })
        })
        .then(res => {
          if (!res.ok) {
            return res.json().then(err => Promise.reject(err));
          }
          return res.json();
        })
        .then(data => {
          this.googleLoading.set(false);
          // Store token and user data
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('token_type', data.token_type);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Update auth service state
          this.authService.loadUserFromStorage();
          
          // Load user data
          this.wishlistService.loadWishlist();
          this.cartService.loadCart();
          
          this.success.set('Welcome! Signed in with Google successfully.');
          
          // Redirect after short delay
          setTimeout(() => {
            const returnUrl = sessionStorage.getItem('returnUrl') || '/';
            sessionStorage.removeItem('returnUrl');
            this.router.navigate([returnUrl]);
          }, 500);
        })
        .catch(err => {
          this.googleLoading.set(false);
          this.error.set(err.detail || 'Google sign-in failed. Please try again.');
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  switchMethod(method: 'email' | 'mobile'): void {
    this.loginMethod.set(method);
    this.error.set('');
    this.success.set('');
    this.otpStep.set('phone');
    this.otpDigits.set(['', '', '', '', '', '']);
    this.demoOtp.set('');
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  // Email Login
  onEmailSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.wishlistService.loadWishlist().subscribe();
        this.cartService.loadCart().subscribe();
        
        if (response.user?.is_admin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail || 'Invalid email or password');
      }
    });
  }

  // OTP Methods
  onSendOTP(): void {
    if (this.phoneForm.invalid) return;

    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    this.demoOtp.set('');

    const phone = this.phoneForm.get('phone')?.value;

    fetch(`${this.apiUrl}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })
    .then(res => res.json())
    .then(data => {
      this.loading.set(false);
      if (data.success) {
        // Check if message contains OTP (demo mode)
        const otpMatch = data.message?.match(/OTP:\s*(\d{6})/);
        if (otpMatch) {
          this.demoOtp.set(otpMatch[1]);
          this.success.set('Demo Mode: OTP displayed below');
        } else {
          this.success.set(data.message);
        }
        this.otpStep.set('otp');
        this.startResendTimer();
      } else {
        this.error.set(data.detail || 'Failed to send OTP');
      }
    })
    .catch(() => {
      this.loading.set(false);
      this.error.set('Failed to send OTP. Please try again.');
    });
  }

  onVerifyOTP(): void {
    if (!this.isOtpComplete()) return;

    this.loading.set(true);
    this.error.set('');

    const phone = this.phoneForm.get('phone')?.value;
    const otp = this.otpDigits().join('');

    fetch(`${this.apiUrl}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => Promise.reject(err));
      }
      return res.json();
    })
    .then(data => {
      this.loading.set(false);
      // Store auth data
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Reload services
      this.wishlistService.loadWishlist().subscribe();
      this.cartService.loadCart().subscribe();
      
      // Redirect
      if (data.user?.is_admin) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
      
      // Reload to update auth state
      window.location.href = data.user?.is_admin ? '/admin' : '/';
    })
    .catch(err => {
      this.loading.set(false);
      this.error.set(err.detail || 'Invalid OTP. Please try again.');
    });
  }

  changePhone(): void {
    this.otpStep.set('phone');
    this.otpDigits.set(['', '', '', '', '', '']);
    this.error.set('');
    this.success.set('');
    this.demoOtp.set('');
    this.clearTimer();
  }

  resendOTP(): void {
    this.otpDigits.set(['', '', '', '', '', '']);
    this.demoOtp.set('');
    this.onSendOTP();
  }

  // OTP Input Handling
  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    
    const digits = [...this.otpDigits()];
    digits[index] = value.charAt(0);
    this.otpDigits.set(digits);
    
    input.value = digits[index];
    
    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.querySelector(`[data-index="${index + 1}"]`) as HTMLInputElement;
      nextInput?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const digits = [...this.otpDigits()];
      if (!digits[index] && index > 0) {
        const prevInput = document.querySelector(`[data-index="${index - 1}"]`) as HTMLInputElement;
        prevInput?.focus();
      }
      digits[index] = '';
      this.otpDigits.set(digits);
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste) {
      const digits = paste.split('').concat(['', '', '', '', '', '']).slice(0, 6);
      this.otpDigits.set(digits);
      
      // Update inputs
      digits.forEach((digit, i) => {
        const input = document.querySelector(`[data-index="${i}"]`) as HTMLInputElement;
        if (input) input.value = digit;
      });
      
      // Focus last filled or first empty
      const lastIndex = Math.min(paste.length, 5);
      const focusInput = document.querySelector(`[data-index="${lastIndex}"]`) as HTMLInputElement;
      focusInput?.focus();
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits().every(d => d !== '');
  }

  // Timer Methods
  private startResendTimer(): void {
    this.clearTimer();
    this.resendTimer.set(30);
    this.timerInterval = setInterval(() => {
      const current = this.resendTimer();
      if (current <= 1) {
        this.resendTimer.set(0);
        this.clearTimer();
      } else {
        this.resendTimer.set(current - 1);
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Demo helper
  private fetchDemoOtp(phone: string): void {
    fetch(`${this.apiUrl}/otp-demo/${phone}`)
      .then(res => res.json())
      .then(data => {
        if (data.otp) {
          this.demoOtp.set(data.otp);
        }
      })
      .catch(() => {});
  }

  // Google Sign In
  googleSignIn(): void {
    if (!this.googleClientId()) {
      this.error.set('Google Sign-In is not configured. Please contact administrator.');
      return;
    }

    if (typeof google === 'undefined' || !google.accounts) {
      this.error.set('Google services not loaded. Please refresh the page.');
      return;
    }

    this.googleLoading.set(true);
    this.error.set('');

    // Open Google sign-in popup using OAuth2
    const client = google.accounts.oauth2.initTokenClient({
      client_id: this.googleClientId(),
      scope: 'email profile openid',
      callback: (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          // Use access token to get user info and create ID token request
          this.fetchGoogleUserInfo(tokenResponse.access_token);
        } else {
          this.googleLoading.set(false);
          this.error.set('Google sign-in was cancelled.');
        }
      },
      error_callback: (error: any) => {
        this.googleLoading.set(false);
        this.error.set('Google sign-in failed. Please try again.');
        console.error('Google OAuth error:', error);
      }
    });

    client.requestAccessToken();
  }

  private fetchGoogleUserInfo(accessToken: string): void {
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    .then(res => res.json())
    .then(userInfo => {
      // Send user info to backend for authentication
      return fetch(`${this.apiUrl}/google/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          access_token: accessToken,
          email: userInfo.email,
          name: userInfo.name,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
          picture: userInfo.picture,
          sub: userInfo.sub
        })
      });
    })
    .then(res => {
      if (!res.ok) return res.json().then(err => Promise.reject(err));
      return res.json();
    })
    .then(data => {
      this.googleLoading.set(false);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_type', data.token_type);
      localStorage.setItem('user', JSON.stringify(data.user));
      this.authService.loadUserFromStorage();
      this.wishlistService.loadWishlist();
      this.cartService.loadCart();
      this.success.set('Welcome! Signed in with Google successfully.');
      setTimeout(() => {
        const returnUrl = sessionStorage.getItem('returnUrl') || '/';
        sessionStorage.removeItem('returnUrl');
        this.router.navigate([returnUrl]);
      }, 500);
    })
    .catch(err => {
      this.googleLoading.set(false);
      this.error.set(err.detail || 'Google sign-in failed. Please try again.');
    });
  }
}
