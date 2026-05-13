import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

interface Address {
  id: number;
  full_name: string;
  phone: string;
  street_address: string;
  apartment?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: string;
  is_default: boolean;
}

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="addresses-page">
      <div class="page-header">
        <div>
          <h2>My Addresses</h2>
          <p class="subtitle">Manage your shipping addresses</p>
        </div>
        <button class="btn btn-primary" (click)="showAddForm()">
          <span class="material-icons">add</span>
          Add Address
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading addresses...</p>
        </div>
      } @else if (showForm()) {
        <div class="address-form-modal">
          <div class="form-card">
            <h3>{{ editingAddress() ? 'Edit Address' : 'Add New Address' }}</h3>
            
            <form [formGroup]="addressForm" (ngSubmit)="onSubmit()">
              <div class="form-row">
                <div class="form-group">
                  <label>Full Name *</label>
                  <input type="text" formControlName="full_name">
                </div>
                <div class="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" formControlName="phone">
                </div>
              </div>

              <div class="form-group">
                <label>Street Address *</label>
                <input type="text" formControlName="street_address">
              </div>

              <div class="form-group">
                <label>Apartment/Suite (Optional)</label>
                <input type="text" formControlName="apartment">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>City *</label>
                  <input type="text" formControlName="city">
                </div>
                <div class="form-group">
                  <label>State/Province *</label>
                  <input type="text" formControlName="state">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>ZIP/Postal Code *</label>
                  <input type="text" formControlName="postal_code">
                </div>
                <div class="form-group">
                  <label>Country *</label>
                  <select formControlName="country">
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>

              <label class="checkbox-label">
                <input type="checkbox" formControlName="is_default">
                <span>Set as default address</span>
              </label>

              <div class="form-actions">
                <button type="button" class="btn btn-outline" (click)="cancelForm()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="addressForm.invalid || saving()">
                  {{ saving() ? 'Saving...' : (editingAddress() ? 'Save Changes' : 'Add Address') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      } @else if (addresses().length === 0) {
        <div class="empty-addresses">
          <span class="material-icons-outlined">location_on</span>
          <h3>No Addresses Saved</h3>
          <p>Add a shipping address for faster checkout.</p>
        </div>
      } @else {
        <div class="addresses-grid">
          @for (address of addresses(); track address.id) {
            <div class="address-card" [class.default]="address.is_default">
              @if (address.is_default) {
                <span class="default-badge">Default</span>
              }
              <h4>{{ address.full_name }}</h4>
              <p>{{ address.phone }}</p>
              <p>{{ address.street_address }}</p>
              @if (address.apartment) {
                <p>{{ address.apartment }}</p>
              }
              <p>{{ address.city }}, {{ address.state }} {{ address.postal_code }}</p>
              <p>{{ address.country }}</p>

              <div class="address-actions">
                <button class="action-btn" (click)="editAddress(address)">
                  <span class="material-icons">edit</span>
                  Edit
                </button>
                @if (!address.is_default) {
                  <button class="action-btn" (click)="setDefault(address)">
                    <span class="material-icons">check_circle_outline</span>
                    Set Default
                  </button>
                }
                <button class="action-btn delete" (click)="deleteAddress(address)">
                  <span class="material-icons">delete</span>
                  Delete
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .addresses-page {
      h2 {
        margin-bottom: 0.25rem;
        color: #ffffff !important;
      }

      .subtitle {
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color);
        border-top-color: var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;

      .btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .address-form-modal {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .form-card {
      background-color: var(--bg-primary);
      padding: 2rem;
      border-radius: var(--border-radius-lg);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;

      h3 {
        margin-bottom: 1.5rem;
        color: var(--text-primary);
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        font-size: 0.9rem;
        color: var(--text-primary);
      }

      input, select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background-color: var(--bg-secondary);
        color: var(--text-primary);

        &:focus {
          outline: none;
          border-color: var(--accent-color);
        }
        
        &::placeholder {
          color: var(--text-secondary);
        }
      }
      
      select option {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 1rem 0;
      cursor: pointer;
      color: var(--text-primary);

      input {
        accent-color: var(--accent-color);
      }
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    .empty-addresses {
      text-align: center;
      padding: 3rem;
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius-lg);

      .material-icons-outlined {
        font-size: 4rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }

      h3 { margin-bottom: 0.5rem; }
      p { color: var(--text-secondary); }
    }

    .addresses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .address-card {
      position: relative;
      padding: 1.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      background-color: var(--bg-primary);

      &.default {
        border-color: var(--accent-color);
      }
    }

    .default-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.75rem;
      background-color: var(--accent-color);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: var(--border-radius);
    }

    .address-card h4 {
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    .address-card p {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .address-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 0.85rem;
      cursor: pointer;

      .material-icons {
        font-size: 1rem;
      }

      &:hover {
        color: var(--accent-color);
      }

      &.delete:hover {
        color: var(--error-color);
      }
    }

    @media (max-width: 576px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-card {
        padding: 1.5rem;
      }
    }

    :host-context(body.vw-light-mode) .addresses-page h2,
    :host-context(body.vw-light-mode) .addresses-page .subtitle,
    :host-context(body.vw-light-mode) .addresses-page .empty-addresses h3,
    :host-context(body.vw-light-mode) .addresses-page .empty-addresses p,
    :host-context(body.vw-light-mode) .addresses-page .form-card h3,
    :host-context(body.vw-light-mode) .addresses-page .address-card h4,
    :host-context(body.vw-light-mode) .addresses-page .address-card p,
    :host-context(body.vw-light-mode) .addresses-page .form-group label,
    :host-context(body.vw-light-mode) .addresses-page .checkbox-label span {
      color: #1f2937;
    }

    :host-context(body.vw-light-mode) .addresses-page .address-card,
    :host-context(body.vw-light-mode) .addresses-page .form-card,
    :host-context(body.vw-light-mode) .addresses-page .empty-addresses {
      background-color: #ffffff;
      border-color: rgba(17, 24, 39, 0.12);
    }

    :host-context(body.vw-light-mode) .addresses-page .form-group input,
    :host-context(body.vw-light-mode) .addresses-page .form-group select {
      background-color: #ffffff;
      color: #111827;
      border-color: rgba(17, 24, 39, 0.18);
    }

    :host-context(body.vw-light-mode) .addresses-page .action-btn,
    :host-context(body.vw-light-mode) .addresses-page .page-header .btn,
    :host-context(body.vw-light-mode) .addresses-page .form-actions .btn-outline,
    :host-context(body.vw-light-mode) .addresses-page .form-actions .btn-primary {
      background: #f9fafb;
      color: #1f2937;
      border-color: rgba(17, 24, 39, 0.16);
    }

    :host-context(body.vw-light-mode) .addresses-page .address-form-modal {
      background-color: rgba(17, 24, 39, 0.45);
    }

    :host-context(body.vw-light-mode) .addresses-page .default-badge {
      background: rgba(201, 169, 98, 0.18);
      color: #7c5f1d;
    }
  `]
})
export class AddressesComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  
  addresses = signal<Address[]>([]);
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  editingAddress = signal<Address | null>(null);
  addressForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.addressForm = this.fb.group({
      full_name: ['', Validators.required],
      phone: ['', Validators.required],
      street_address: ['', Validators.required],
      apartment: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postal_code: ['', Validators.required],
      country: ['India', Validators.required],
      is_default: [false],
      address_type: ['home']
    });
  }

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.loading.set(true);
    this.http.get<Address[]>(`${this.apiUrl}/addresses`).subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  showAddForm(): void {
    this.editingAddress.set(null);
    this.addressForm.reset({ country: 'India', is_default: false, address_type: 'home' });
    this.showForm.set(true);
  }

  editAddress(address: Address): void {
    this.editingAddress.set(address);
    this.addressForm.patchValue(address);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingAddress.set(null);
  }

  onSubmit(): void {
    if (this.addressForm.invalid) return;

    const formValue = this.addressForm.value;
    const editing = this.editingAddress();

    this.saving.set(true);

    if (editing) {
      this.http.put<Address>(`${this.apiUrl}/addresses/${editing.id}`, formValue).subscribe({
        next: () => {
          this.loadAddresses();
          this.cancelForm();
          this.saving.set(false);
        },
        error: () => {
          this.saving.set(false);
        }
      });
    } else {
      this.http.post<Address>(`${this.apiUrl}/addresses`, formValue).subscribe({
        next: () => {
          this.loadAddresses();
          this.cancelForm();
          this.saving.set(false);
        },
        error: () => {
          this.saving.set(false);
        }
      });
    }
  }

  setDefault(address: Address): void {
    this.http.put<Address>(`${this.apiUrl}/addresses/${address.id}`, { is_default: true }).subscribe({
      next: () => {
        this.loadAddresses();
      }
    });
  }

  deleteAddress(address: Address): void {
    if (confirm('Are you sure you want to delete this address?')) {
      this.http.delete(`${this.apiUrl}/addresses/${address.id}`).subscribe({
        next: () => {
          this.loadAddresses();
        }
      });
    }
  }
}
