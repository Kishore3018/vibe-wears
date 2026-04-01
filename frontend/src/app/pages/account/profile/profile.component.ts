import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '@core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page">
      <h2>My Profile</h2>
      <p class="subtitle">Manage your personal information</p>

      @if (successMessage()) {
        <div class="alert alert-success">
          <span class="material-icons">check_circle</span>
          {{ successMessage() }}
        </div>
      }

      @if (errorMessage()) {
        <div class="alert alert-error">
          <span class="material-icons">error</span>
          {{ errorMessage() }}
        </div>
      }

      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input 
              type="text" 
              id="firstName" 
              formControlName="firstName"
              [class.error]="profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched"
            >
          </div>
          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input 
              type="text" 
              id="lastName" 
              formControlName="lastName"
              [class.error]="profileForm.get('lastName')?.invalid && profileForm.get('lastName')?.touched"
            >
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            formControlName="email"
            [class.error]="profileForm.get('email')?.invalid && profileForm.get('email')?.touched"
          >
        </div>

        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input 
            type="tel" 
            id="phone" 
            formControlName="phone"
          >
        </div>

        <div class="form-actions">
          <button 
            type="submit" 
            class="btn btn-primary"
            [disabled]="profileForm.invalid || loading()"
          >
            @if (loading()) {
              <span class="spinner"></span>
              Saving...
            } @else {
              Save Changes
            }
          </button>
        </div>
      </form>

      <hr class="divider">

      <h3>Change Password</h3>
      <form [formGroup]="passwordForm" (ngSubmit)="onPasswordSubmit()">
        <div class="form-group">
          <label for="currentPassword">Current Password</label>
          <input 
            type="password" 
            id="currentPassword" 
            formControlName="currentPassword"
          >
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input 
              type="password" 
              id="newPassword" 
              formControlName="newPassword"
            >
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              formControlName="confirmPassword"
            >
          </div>
        </div>

        <div class="form-actions">
          <button 
            type="submit" 
            class="btn btn-outline"
            [disabled]="passwordForm.invalid || passwordLoading()"
          >
            @if (passwordLoading()) {
              <span class="spinner"></span>
              Updating...
            } @else {
              Update Password
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .profile-page {
      h2 {
        margin-bottom: 0.5rem;
        color: #ffffff;
      }

      .subtitle {
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 2rem;
      }

      h3 {
        margin-bottom: 1.5rem;
        color: #ffffff;
      }
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: var(--border-radius);
      margin-bottom: 1.5rem;

      .material-icons {
        font-size: 1.25rem;
      }

      &.alert-success {
        background-color: rgba(16, 185, 129, 0.1);
        color: var(--success-color);
        border: 1px solid rgba(16, 185, 129, 0.2);
      }

      &.alert-error {
        background-color: rgba(239, 68, 68, 0.1);
        color: var(--error-color);
        border: 1px solid rgba(239, 68, 68, 0.2);
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
        color: rgba(255, 255, 255, 0.8);
      }

      input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--border-radius);
        font-size: 1rem;
        transition: var(--transition);
        background-color: rgba(255, 255, 255, 0.05);
        color: #ffffff;

        &:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.2);
        }

        &.error {
          border-color: var(--error-color);
        }

        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
      }
    }

    .form-actions {
      margin-top: 1.5rem;
    }

    .divider {
      margin: 2.5rem 0;
      border: none;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .spinner {
      width: 16px;
      height: 16px;
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

    @media (max-width: 576px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = signal(false);
  passwordLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    this.loading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    // Simulate API call
    setTimeout(() => {
      this.loading.set(false);
      this.successMessage.set('Profile updated successfully!');
    }, 1500);
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) return;

    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    this.passwordLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    // Simulate API call
    setTimeout(() => {
      this.passwordLoading.set(false);
      this.successMessage.set('Password updated successfully!');
      this.passwordForm.reset();
    }, 1500);
  }
}
