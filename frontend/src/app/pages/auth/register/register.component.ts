import { Component, signal, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h1>Create Account</h1>
            <p>Join Vibe Wears and start shopping today</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            @if (error()) {
              <div class="alert alert-error">
                <span class="material-icons">error_outline</span>
                {{ error() }}
              </div>
            }

            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <div class="input-wrapper">
                  <span class="material-icons-outlined">person</span>
                  <input 
                    type="text" 
                    id="firstName" 
                    formControlName="firstName"
                    placeholder="First name"
                    [class.error]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched"
                  >
                </div>
                @if (registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched) {
                  <span class="error-message">First name is required</span>
                }
              </div>

              <div class="form-group">
                <label for="lastName">Last Name</label>
                <div class="input-wrapper">
                  <span class="material-icons-outlined">person</span>
                  <input 
                    type="text" 
                    id="lastName" 
                    formControlName="lastName"
                    placeholder="Last name"
                    [class.error]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched"
                  >
                </div>
                @if (registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched) {
                  <span class="error-message">Last name is required</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <div class="input-wrapper">
                <span class="material-icons-outlined">email</span>
                <input 
                  type="email" 
                  id="email" 
                  formControlName="email"
                  placeholder="Enter your email"
                  [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
                >
              </div>
              @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                <span class="error-message">Please enter a valid email address</span>
              }
            </div>

            <div class="form-group">
              <label for="phone">Phone Number</label>
              <div class="input-wrapper">
                <span class="material-icons-outlined">phone</span>
                <input 
                  type="tel" 
                  id="phone" 
                  formControlName="phone"
                  placeholder="Enter your phone number"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <div class="input-wrapper">
                <span class="material-icons-outlined">lock</span>
                <input 
                  [type]="showPassword() ? 'text' : 'password'" 
                  id="password" 
                  formControlName="password"
                  placeholder="Create a password"
                  [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
                >
                <button type="button" class="toggle-password" (click)="togglePassword()">
                  <span class="material-icons-outlined">
                    {{ showPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              @if (registerForm.get('password')?.errors?.['required'] && registerForm.get('password')?.touched) {
                <span class="error-message">Password is required</span>
              } @else if (registerForm.get('password')?.errors?.['minlength'] && registerForm.get('password')?.touched) {
                <span class="error-message">Password must be at least 8 characters</span>
              }
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <div class="input-wrapper">
                <span class="material-icons-outlined">lock</span>
                <input 
                  [type]="showConfirmPassword() ? 'text' : 'password'" 
                  id="confirmPassword" 
                  formControlName="confirmPassword"
                  placeholder="Confirm your password"
                  [class.error]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched"
                >
                <button type="button" class="toggle-password" (click)="toggleConfirmPassword()">
                  <span class="material-icons-outlined">
                    {{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              @if (registerForm.get('confirmPassword')?.errors?.['required'] && registerForm.get('confirmPassword')?.touched) {
                <span class="error-message">Please confirm your password</span>
              } @else if (registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmPassword')?.touched) {
                <span class="error-message">Passwords do not match</span>
              }
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="agreeTerms">
                <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
              </label>
            </div>

            <button 
              type="submit" 
              class="btn btn-primary btn-lg w-full"
              [disabled]="registerForm.invalid || loading()"
            >
              @if (loading()) {
                <span class="spinner"></span>
                Creating Account...
              } @else {
                Create Account
              }
            </button>
          </form>

          <div class="auth-divider">
            <span>or sign up with</span>
          </div>

          <div class="social-buttons">
            @if (googleClientId()) {
              <button class="social-btn google" (click)="googleSignIn()" [disabled]="googleLoading()" type="button">
                @if (googleLoading()) {
                  <span class="spinner"></span>
                  Signing up...
                } @else {
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                }
              </button>
            }
            <button class="social-btn mobile" (click)="goToMobileLogin()" type="button">
              <span class="material-icons">smartphone</span>
              Mobile
            </button>
          </div>

          <p class="auth-footer">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
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
      max-width: 500px;
    }

    .auth-card {
      background-color: var(--bg-primary);
      padding: 2.5rem;
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-lg);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;

      h1 {
        font-size: 1.75rem;
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--text-secondary);
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

      .material-icons {
        font-size: 1.25rem;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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
      margin-bottom: 1.5rem;

      .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.9rem;

        input[type="checkbox"] {
          width: 16px;
          height: 16px;
          margin-top: 2px;
          accent-color: var(--accent-color);
        }

        a {
          color: var(--accent-color);

          &:hover {
            text-decoration: underline;
          }
        }
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

    .social-buttons {
      display: flex;
      gap: 1rem;
    }

    .social-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background-color: var(--bg-primary);
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);

      &:hover {
        background-color: var(--bg-secondary);
      }

      &.mobile .material-icons {
        color: #10b981;
        font-size: 20px;
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

    @media (max-width: 576px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .auth-card {
        padding: 1.5rem;
      }
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  googleClientId = signal('');
  googleLoading = signal(false);
  private apiUrl = environment.apiUrl + '/auth';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cartService: CartService,
    private wishlistService: WishlistService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.initGoogleSignIn();
  }

  private initGoogleSignIn(): void {
    fetch(`${this.apiUrl}/google/client-id`)
      .then(res => res.json())
      .then(data => {
        if (data.client_id) {
          this.googleClientId.set(data.client_id);
        }
      })
      .catch(err => console.log('Google client ID not configured'));
  }

  googleSignIn(): void {
    if (!this.googleClientId()) {
      this.error.set('Google Sign-In is not configured.');
      return;
    }
    if (typeof google === 'undefined' || !google.accounts) {
      this.error.set('Google services not loaded. Please refresh the page.');
      return;
    }

    this.googleLoading.set(true);
    this.error.set('');

    const client = google.accounts.oauth2.initTokenClient({
      client_id: this.googleClientId(),
      scope: 'email profile openid',
      callback: (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          this.fetchGoogleUserInfo(tokenResponse.access_token);
        } else {
          this.googleLoading.set(false);
          this.error.set('Google sign-up was cancelled.');
        }
      },
      error_callback: (error: any) => {
        this.googleLoading.set(false);
        this.error.set('Google sign-up failed. Please try again.');
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
      this.router.navigate(['/']);
    })
    .catch(err => {
      this.googleLoading.set(false);
      this.error.set(err.detail || 'Google sign-up failed. Please try again.');
    });
  }

  goToMobileLogin(): void {
    this.router.navigate(['/auth/login'], { queryParams: { method: 'mobile' } });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const { firstName, lastName, email, phone, password } = this.registerForm.value;

    this.authService.register({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      password
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/auth/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail || 'Registration failed. Please try again.');
      }
    });
  }
}
