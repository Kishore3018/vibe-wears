import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService, CartItem, Cart } from '@core/services/cart.service';
import { AuthService } from '@core/services/auth.service';
import { OrderService, AddressCreate, Address, Order } from '@core/services/order.service';
import { PaymentService } from '@core/services/payment.service';
import { WebsocketService } from '@core/services/websocket.service';
import { switchMap, catchError } from 'rxjs/operators';
import { of, interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="checkout-page">
      <div class="container">
        <h1 class="page-title">Checkout</h1>

        @if (cartItems().length === 0) {
          <div class="empty-cart">
            <span class="material-icons-outlined">shopping_cart</span>
            <h2>Your Cart is Empty</h2>
            <p>Add some items to your cart before checking out.</p>
            <a routerLink="/products" class="btn btn-primary">Browse Products</a>
          </div>
        } @else {
          <div class="checkout-layout">
            <!-- Checkout Form -->
            <div class="checkout-form">
              <!-- Progress Steps -->
              <div class="checkout-steps">
                <div class="step" [class.active]="currentStep() >= 1" [class.completed]="currentStep() > 1">
                  <span class="step-number">
                    @if (currentStep() > 1) {
                      <span class="material-icons">check</span>
                    } @else {
                      1
                    }
                  </span>
                  <span class="step-label">Shipping</span>
                </div>
                <div class="step-connector" [class.active]="currentStep() > 1"></div>
                <div class="step" [class.active]="currentStep() >= 2" [class.completed]="currentStep() > 2">
                  <span class="step-number">
                    @if (currentStep() > 2) {
                      <span class="material-icons">check</span>
                    } @else {
                      2
                    }
                  </span>
                  <span class="step-label">Payment</span>
                </div>
                <div class="step-connector" [class.active]="currentStep() > 2"></div>
                <div class="step" [class.active]="currentStep() >= 3">
                  <span class="step-number">3</span>
                  <span class="step-label">Review</span>
                </div>
              </div>

              <!-- Step 1: Shipping Information -->
              @if (currentStep() === 1) {
                <div class="form-section">
                  <h2>Shipping Information</h2>
                  
                  <!-- Saved Addresses -->
                  @if (savedAddresses().length > 0) {
                    <div class="saved-addresses">
                      <h3>Saved Addresses</h3>
                      <div class="address-grid">
                        @for (addr of savedAddresses(); track addr.id) {
                          <div 
                            class="saved-address-card" 
                            [class.selected]="selectedAddressId() === addr.id"
                            (click)="selectSavedAddress(addr)"
                          >
                            <div class="address-radio">
                              <input type="radio" [checked]="selectedAddressId() === addr.id" name="savedAddress">
                            </div>
                            <div class="address-content">
                              <span class="address-name">{{ addr.full_name }}</span>
                              @if (addr.is_default) {
                                <span class="default-badge">Default</span>
                              }
                              <p class="address-details">
                                {{ addr.street_address }}
                                @if (addr.apartment) {, {{ addr.apartment }}}
                                <br>{{ addr.city }}, {{ addr.state }} {{ addr.postal_code }}
                                <br>Phone: {{ addr.phone }}
                              </p>
                            </div>
                          </div>
                        }
                        <div 
                          class="saved-address-card add-new" 
                          [class.selected]="selectedAddressId() === null"
                          (click)="clearSelectedAddress()"
                        >
                          <span class="material-icons">add</span>
                          <span>Add New Address</span>
                        </div>
                      </div>
                    </div>
                  }
                  
                  @if (selectedAddressId() === null || savedAddresses().length === 0) {
                    <form [formGroup]="shippingForm">
                      <div class="form-row">
                        <div class="form-group">
                          <label for="firstName">First Name *</label>
                          <input 
                            type="text" 
                            id="firstName" 
                            formControlName="firstName"
                            [class.error]="shippingForm.get('firstName')?.invalid && shippingForm.get('firstName')?.touched"
                          >
                        </div>
                        <div class="form-group">
                          <label for="lastName">Last Name *</label>
                          <input 
                            type="text" 
                            id="lastName" 
                            formControlName="lastName"
                            [class.error]="shippingForm.get('lastName')?.invalid && shippingForm.get('lastName')?.touched"
                          >
                        </div>
                      </div>

                      <div class="form-group">
                        <label for="email">Email Address *</label>
                        <input 
                          type="email" 
                          id="email" 
                          formControlName="email"
                          [class.error]="shippingForm.get('email')?.invalid && shippingForm.get('email')?.touched"
                        >
                      </div>

                      <div class="form-group">
                        <label for="phone">Phone Number *</label>
                        <input 
                          type="tel" 
                          id="phone" 
                          formControlName="phone"
                          [class.error]="shippingForm.get('phone')?.invalid && shippingForm.get('phone')?.touched"
                        >
                      </div>

                      <div class="form-group">
                        <label for="address">Street Address *</label>
                        <input 
                          type="text" 
                          id="address" 
                          formControlName="address"
                          placeholder="Street address"
                          [class.error]="shippingForm.get('address')?.invalid && shippingForm.get('address')?.touched"
                        >
                      </div>

                      <div class="form-group">
                        <input 
                          type="text" 
                          formControlName="address2"
                          placeholder="Apartment, suite, etc. (optional)"
                        >
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label for="city">City *</label>
                          <input 
                            type="text" 
                            id="city" 
                            formControlName="city"
                            [class.error]="shippingForm.get('city')?.invalid && shippingForm.get('city')?.touched"
                          >
                        </div>
                        <div class="form-group">
                          <label for="state">State/Province *</label>
                          <input 
                            type="text" 
                            id="state" 
                            formControlName="state"
                            [class.error]="shippingForm.get('state')?.invalid && shippingForm.get('state')?.touched"
                          >
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label for="zipCode">ZIP/Postal Code *</label>
                          <input 
                            type="text" 
                            id="zipCode" 
                            formControlName="zipCode"
                            [class.error]="shippingForm.get('zipCode')?.invalid && shippingForm.get('zipCode')?.touched"
                          >
                        </div>
                        <div class="form-group">
                          <label for="country">Country *</label>
                          <select 
                            id="country" 
                            formControlName="country"
                            [class.error]="shippingForm.get('country')?.invalid && shippingForm.get('country')?.touched"
                          >
                            <option value="">Select Country</option>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="UK">United Kingdom</option>
                            <option value="AU">Australia</option>
                            <option value="IN">India</option>
                          </select>
                        </div>
                      </div>

                      <label class="checkbox-label">
                        <input type="checkbox" formControlName="saveAddress">
                        <span>Save this address for future orders</span>
                      </label>
                    </form>
                  }

                  <div class="form-actions">
                    <a routerLink="/cart" class="btn btn-outline">Back to Cart</a>
                    <button 
                      class="btn btn-primary" 
                      (click)="goToStep(2)"
                      [disabled]="!canProceedToPayment()"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              }

              <!-- Step 2: Payment Information - Enhanced Flipkart/Amazon Style -->
              @if (currentStep() === 2) {
                <div class="form-section payment-section">
                  <h2>Choose Payment Method</h2>

                  <!-- Payment Security Badge -->
                  <div class="security-banner">
                    <span class="material-icons">verified_user</span>
                    <span>Your payment information is secure & encrypted</span>
                    <div class="security-logos">
                      <img src="https://cdn.razorpay.com/static/assets/logo/payment/pci.svg" alt="PCI DSS" height="20">
                    </div>
                  </div>

                  <div class="payment-methods-accordion">
                    <!-- UPI Payment -->
                    <div 
                      class="payment-method-card" 
                      [class.active]="selectedPaymentType() === 'upi'"
                      [class.expanded]="selectedPaymentType() === 'upi'"
                    >
                      <div class="method-header" (click)="selectPaymentType('upi')">
                        <div class="method-radio">
                          <input type="radio" [checked]="selectedPaymentType() === 'upi'" name="paymentType">
                        </div>
                        <div class="method-info">
                          <div class="method-title-row">
                            <span class="method-title">UPI</span>
                            <span class="method-badge popular">Popular</span>
                          </div>
                          <span class="method-subtitle">Pay directly from your bank account</span>
                        </div>
                        <div class="method-logos">
                          <span class="payment-icon-text upi-badge">UPI</span>
                          <span class="payment-icon-text gpay-badge">GPay</span>
                          <span class="payment-icon-text phonepe-badge">PhonePe</span>
                          <span class="payment-icon-text paytm-badge">Paytm</span>
                        </div>
                      </div>
                      @if (selectedPaymentType() === 'upi') {
                        <div class="method-body">
                          <div class="upi-options">
                            <label class="upi-option" [class.selected]="upiMethod() === 'vpa'">
                              <input type="radio" name="upiMethod" value="vpa" [checked]="upiMethod() === 'vpa'" (change)="setUpiMethod('vpa')">
                              <span class="option-label">Enter UPI ID</span>
                            </label>
                            <label class="upi-option" [class.selected]="upiMethod() === 'qr'">
                              <input type="radio" name="upiMethod" value="qr" [checked]="upiMethod() === 'qr'" (change)="setUpiMethod('qr')">
                              <span class="option-label">Scan QR Code</span>
                            </label>
                          </div>
                          
                          @if (upiMethod() === 'vpa') {
                            <div class="upi-input-section">
                              <div class="form-group">
                                <label>UPI ID / VPA</label>
                                <div class="upi-input-wrapper">
                                  <input 
                                    type="text" 
                                    placeholder="yourname&#64;upi" 
                                    [formControl]="upiIdControl"
                                    [class.valid]="upiIdControl.valid && upiIdControl.value"
                                  >
                                  @if (upiIdControl.valid && upiIdControl.value) {
                                    <span class="material-icons check-icon">check_circle</span>
                                  }
                                </div>
                                <span class="form-hint">Example: mobile&#64;paytm, yourname&#64;oksbi, 9876543210&#64;ybl</span>
                              </div>
                              <button class="btn btn-verify" (click)="verifyUpi()" [disabled]="!upiIdControl.valid">
                                Verify & Pay
                              </button>
                            </div>
                          } @else {
                            <div class="qr-section">
                              <div class="qr-placeholder">
                                <span class="material-icons">qr_code_2</span>
                                <p>Secure UPI QR opens in Razorpay payment window</p>
                              </div>
                              <p class="qr-instructions">Continue to Review, then click Pay to open QR and scan using any UPI app</p>
                            </div>
                          }
                        </div>
                      }
                    </div>

                    <!-- Credit/Debit Cards -->
                    <div 
                      class="payment-method-card" 
                      [class.active]="selectedPaymentType() === 'card'"
                      [class.expanded]="selectedPaymentType() === 'card'"
                    >
                      <div class="method-header" (click)="selectPaymentType('card')">
                        <div class="method-radio">
                          <input type="radio" [checked]="selectedPaymentType() === 'card'" name="paymentType">
                        </div>
                        <div class="method-info">
                          <span class="method-title">Credit / Debit Card</span>
                          <span class="method-subtitle">Visa, Mastercard, Rupay & more</span>
                        </div>
                        <div class="method-logos">
                          <span class="card-brand visa">VISA</span>
                          <span class="card-brand mastercard">MC</span>
                          <span class="card-brand rupay">RuPay</span>
                          <span class="card-brand amex">AMEX</span>
                        </div>
                      </div>
                      @if (selectedPaymentType() === 'card') {
                        <div class="method-body">
                          <form [formGroup]="cardForm" class="card-form">
                            <div class="form-group">
                              <label>Card Number</label>
                              <div class="card-input-wrapper">
                                <input 
                                  type="text" 
                                  placeholder="1234 5678 9012 3456" 
                                  formControlName="cardNumber"
                                  maxlength="19"
                                  (input)="formatCardNumber($event)"
                                >
                                <div class="detected-card">
                                  @if (detectedCardType()) {
                                    <img [src]="getCardLogo(detectedCardType())" [alt]="detectedCardType()" height="24">
                                  }
                                </div>
                              </div>
                            </div>
                            <div class="form-group">
                              <label>Name on Card</label>
                              <input type="text" placeholder="JOHN DOE" formControlName="cardName" style="text-transform: uppercase;">
                            </div>
                            <div class="form-row">
                              <div class="form-group">
                                <label>Expiry Date</label>
                                <input 
                                  type="text" 
                                  placeholder="MM/YY" 
                                  formControlName="cardExpiry"
                                  maxlength="5"
                                  (input)="formatExpiry($event)"
                                >
                              </div>
                              <div class="form-group">
                                <label>CVV</label>
                                <div class="cvv-input-wrapper">
                                  <input 
                                    [type]="showCvv() ? 'text' : 'password'" 
                                    placeholder="***" 
                                    formControlName="cardCvv"
                                    maxlength="4"
                                  >
                                  <button type="button" class="cvv-toggle" (click)="toggleCvv()">
                                    <span class="material-icons">{{ showCvv() ? 'visibility_off' : 'visibility' }}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                            <label class="checkbox-label save-card">
                              <input type="checkbox" formControlName="saveCard">
                              <span>Save card securely for future payments</span>
                            </label>
                          </form>
                          
                          <!-- EMI Option -->
                          @if (total() >= 3000) {
                            <div class="emi-section">
                              <label class="checkbox-label emi-toggle">
                                <input type="checkbox" [checked]="showEmi()" (change)="toggleEmi()">
                                <span>Pay in Easy EMIs</span>
                              </label>
                              @if (showEmi()) {
                                <div class="emi-options">
                                  <p class="emi-info">No Cost EMI available on select banks</p>
                                  <div class="emi-plans">
                                    @for (plan of emiPlans(); track plan.months) {
                                      <label class="emi-plan" [class.selected]="selectedEmiPlan() === plan.months">
                                        <input type="radio" name="emiPlan" [value]="plan.months" (change)="selectEmiPlan(plan.months)">
                                        <div class="plan-details">
                                          <span class="plan-tenure">{{ plan.months }} Months</span>
                                          <span class="plan-amount">{{ plan.emi | currency:'INR':'symbol':'1.0-0' }}/month</span>
                                          @if (plan.noCost) {
                                            <span class="no-cost-badge">No Cost</span>
                                          }
                                        </div>
                                      </label>
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>

                    <!-- Net Banking -->
                    <div 
                      class="payment-method-card" 
                      [class.active]="selectedPaymentType() === 'netbanking'"
                      [class.expanded]="selectedPaymentType() === 'netbanking'"
                    >
                      <div class="method-header" (click)="selectPaymentType('netbanking')">
                        <div class="method-radio">
                          <input type="radio" [checked]="selectedPaymentType() === 'netbanking'" name="paymentType">
                        </div>
                        <div class="method-info">
                          <span class="method-title">Net Banking</span>
                          <span class="method-subtitle">All major banks supported</span>
                        </div>
                        <div class="method-logos banks">
                          <span class="bank-logo">SBI</span>
                          <span class="bank-logo">HDFC</span>
                          <span class="bank-logo">ICICI</span>
                          <span class="more-banks">+50</span>
                        </div>
                      </div>
                      @if (selectedPaymentType() === 'netbanking') {
                        <div class="method-body">
                          <div class="popular-banks">
                            <span class="section-label">Popular Banks</span>
                            <div class="bank-grid">
                              @for (bank of popularBanks; track bank.code) {
                                <label class="bank-option" [class.selected]="selectedBank() === bank.code">
                                  <input type="radio" name="bank" [value]="bank.code" (change)="selectBank(bank.code)">
                                  <div class="bank-content">
                                    <span class="bank-icon">{{ bank.icon }}</span>
                                    <span class="bank-name">{{ bank.name }}</span>
                                  </div>
                                </label>
                              }
                            </div>
                          </div>
                          <div class="other-banks">
                            <label class="section-label">Other Banks</label>
                            <select class="bank-select" (change)="selectBank($event)">
                              <option value="">Select Bank</option>
                              @for (bank of otherBanks; track bank.code) {
                                <option [value]="bank.code">{{ bank.name }}</option>
                              }
                            </select>
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Wallets -->
                    <div 
                      class="payment-method-card" 
                      [class.active]="selectedPaymentType() === 'wallet'"
                      [class.expanded]="selectedPaymentType() === 'wallet'"
                    >
                      <div class="method-header" (click)="selectPaymentType('wallet')">
                        <div class="method-radio">
                          <input type="radio" [checked]="selectedPaymentType() === 'wallet'" name="paymentType">
                        </div>
                        <div class="method-info">
                          <span class="method-title">Wallets</span>
                          <span class="method-subtitle">Paytm, PhonePe, Amazon Pay & more</span>
                        </div>
                        <div class="method-logos">
                          <span class="wallet-badge paytm">Paytm</span>
                          <span class="wallet-badge phonepe">PhonePe</span>
                          <span class="wallet-badge mobikwik">MobiKwik</span>
                        </div>
                      </div>
                      @if (selectedPaymentType() === 'wallet') {
                        <div class="method-body">
                          <div class="wallet-grid">
                            @for (wallet of wallets; track wallet.code) {
                              <label class="wallet-option" [class.selected]="selectedWallet() === wallet.code">
                                <input type="radio" name="wallet" [value]="wallet.code" (change)="selectWallet(wallet.code)">
                                <div class="wallet-content">
                                  <span class="wallet-icon" [ngClass]="wallet.code">{{ getWalletInitial(wallet.code) }}</span>
                                  <span class="wallet-name">{{ wallet.name }}</span>
                                </div>
                              </label>
                            }
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Cash on Delivery -->
                    <div 
                      class="payment-method-card" 
                      [class.active]="selectedPaymentType() === 'cod'"
                      [class.expanded]="selectedPaymentType() === 'cod'"
                    >
                      <div class="method-header" (click)="selectPaymentType('cod')">
                        <div class="method-radio">
                          <input type="radio" [checked]="selectedPaymentType() === 'cod'" name="paymentType">
                        </div>
                        <div class="method-info">
                          <span class="method-title">Cash on Delivery</span>
                          <span class="method-subtitle">Pay when you receive your order</span>
                        </div>
                        <div class="cod-charge">
                          @if (codCharge() > 0) {
                            <span class="charge-badge">+₹{{ codCharge() }}</span>
                          }
                        </div>
                      </div>
                      @if (selectedPaymentType() === 'cod') {
                        <div class="method-body">
                          <div class="cod-info-box">
                            <span class="material-icons">info</span>
                            <div class="cod-details">
                              @if (codCharge() > 0) {
                                <p>An additional charge of <strong>₹{{ codCharge() }}</strong> will be applied for Cash on Delivery.</p>
                              }
                              <p>Please keep exact change of <strong>{{ totalWithCod() | currency:'INR':'symbol':'1.0-0' }}</strong> ready at the time of delivery.</p>
                              <ul class="cod-points">
                                <li><span class="material-icons">check</span> Pay cash to delivery partner</li>
                                <li><span class="material-icons">check</span> Inspect before paying</li>
                                <li><span class="material-icons">check</span> Get instant receipt via SMS</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="form-actions">
                    <button class="btn btn-outline" (click)="goToStep(1)">Back</button>
                    <button 
                      class="btn btn-primary" 
                      (click)="goToStep(3)"
                      [disabled]="!isPaymentMethodValid()"
                    >
                      Review Order
                    </button>
                  </div>
                </div>
              }

              <!-- Step 3: Review Order -->
              @if (currentStep() === 3) {
                <div class="form-section">
                  <h2>Review Your Order</h2>

                  @if (errorMessage()) {
                    <div class="error-banner">
                      <span class="material-icons">error_outline</span>
                      <span>{{ errorMessage() }}</span>
                      <button class="close-btn" (click)="errorMessage.set(null)">
                        <span class="material-icons">close</span>
                      </button>
                    </div>
                  }

                  @if (paymentRealtimeMessage()) {
                    <div class="payment-live-banner" [class.success]="paymentRealtimeState() === 'completed'" [class.failed]="paymentRealtimeState() === 'failed'">
                      <span class="material-icons">
                        @if (paymentRealtimeState() === 'completed') {
                          check_circle
                        } @else if (paymentRealtimeState() === 'failed') {
                          error
                        } @else {
                          hourglass_top
                        }
                      </span>
                      <span>{{ paymentRealtimeMessage() }}</span>
                    </div>
                  }

                  <div class="review-section">
                    <div class="review-block">
                      <div class="review-header">
                        <h3><span class="material-icons">location_on</span> Delivery Address</h3>
                        <button class="edit-btn" (click)="goToStep(1)">Change</button>
                      </div>
                      <p>
                        <strong>{{ shippingForm.value.firstName }} {{ shippingForm.value.lastName }}</strong><br>
                        {{ shippingForm.value.address }}<br>
                        @if (shippingForm.value.address2) {
                          {{ shippingForm.value.address2 }}<br>
                        }
                        {{ shippingForm.value.city }}, {{ shippingForm.value.state }} {{ shippingForm.value.zipCode }}<br>
                        Phone: {{ shippingForm.value.phone }}
                      </p>
                      <div class="delivery-estimate">
                        <span class="material-icons">local_shipping</span>
                        <span>Estimated delivery: <strong>{{ getEstimatedDelivery() }}</strong></span>
                      </div>
                    </div>

                    <div class="review-block">
                      <div class="review-header">
                        <h3><span class="material-icons">payment</span> Payment Method</h3>
                        <button class="edit-btn" (click)="goToStep(2)">Change</button>
                      </div>
                      <div class="selected-payment-display">
                        @switch (selectedPaymentType()) {
                          @case ('upi') {
                            <img src="https://cdn.razorpay.com/static/assets/logo/payment/upi.svg" alt="UPI" height="24">
                            <div>
                              <span class="payment-name">UPI</span>
                              @if (upiMethod() === 'qr') {
                                <span class="payment-detail">UPI QR will open in Razorpay when you click Pay</span>
                              } @else if (upiIdControl.value) {
                                <span class="payment-detail">{{ upiIdControl.value }}</span>
                              }
                            </div>
                          }
                          @case ('card') {
                            <img [src]="getCardLogo(detectedCardType())" alt="Card" height="24">
                            <div>
                              <span class="payment-name">{{ detectedCardType() || 'Card' }} ending with {{ cardForm.value.cardNumber?.slice(-4) }}</span>
                              @if (showEmi() && selectedEmiPlan()) {
                                <span class="payment-detail emi-detail">EMI: {{ selectedEmiPlan() }} months</span>
                              }
                            </div>
                          }
                          @case ('netbanking') {
                            <span class="material-icons">account_balance</span>
                            <div>
                              <span class="payment-name">Net Banking</span>
                              <span class="payment-detail">{{ getBankName(selectedBank()) }}</span>
                            </div>
                          }
                          @case ('wallet') {
                            <img [src]="getWalletLogo(selectedWallet())" alt="Wallet" height="24">
                            <div>
                              <span class="payment-name">{{ getWalletName(selectedWallet()) }}</span>
                            </div>
                          }
                          @case ('cod') {
                            <span class="material-icons">payments</span>
                            <div>
                              <span class="payment-name">Cash on Delivery</span>
                              @if (codCharge() > 0) {
                                <span class="payment-detail cod-charge-note">+₹{{ codCharge() }} COD fee</span>
                              }
                            </div>
                          }
                        }
                      </div>
                    </div>
                  </div>

                  <div class="order-items-review">
                    <h3>Order Items ({{ cartItems().length }})</h3>
                    @for (item of cartItems(); track item.id) {
                      <div class="order-item">
                        <img [src]="item.product?.primary_image || '/assets/images/placeholder.jpg'" [alt]="item.product?.name">
                        <div class="item-info">
                          <span class="item-name">{{ item.product?.name }}</span>
                          <span class="item-meta">
                            Qty: {{ item.quantity }}
                          </span>
                        </div>
                        <span class="item-price">{{ getItemTotal(item) | currency:'INR':'symbol':'1.0-0' }}</span>
                      </div>
                    }
                  </div>

                  <div class="form-actions">
                    <button class="btn btn-outline" (click)="goToStep(2)">Back</button>
                    <button 
                      class="btn btn-primary btn-lg btn-pay" 
                      (click)="placeOrder()"
                      [disabled]="processing()"
                    >
                      @if (processing()) {
                        <span class="spinner"></span>
                        Processing...
                      } @else if (selectedPaymentType() === 'upi' && upiMethod() === 'qr') {
                        Open UPI QR - {{ total() | currency:'INR':'symbol':'1.0-0' }}
                      } @else if (selectedPaymentType() === 'cod') {
                        Place Order - {{ totalWithCod() | currency:'INR':'symbol':'1.0-0' }}
                      } @else {
                        Pay {{ total() | currency:'INR':'symbol':'1.0-0' }}
                      }
                    </button>
                  </div>

                  <div class="order-policies">
                    <p>By placing this order, you agree to our <a href="#">Terms of Use</a> and <a href="#">Privacy Policy</a></p>
                  </div>
                </div>
              }
            </div>

            <!-- Order Summary Sidebar - Enhanced -->
            <div class="order-summary">
              <h2>Order Summary</h2>

              <!-- Coupon Section -->
              <div class="coupon-section">
                @if (!appliedCoupon()) {
                  <div class="coupon-input-wrapper">
                    <input 
                      type="text" 
                      placeholder="Enter coupon code" 
                      [formControl]="couponControl"
                      (keyup.enter)="applyCoupon()"
                    >
                    <button class="apply-btn" (click)="applyCoupon()" [disabled]="!couponControl.value || applyingCoupon()">
                      {{ applyingCoupon() ? 'Applying...' : 'Apply' }}
                    </button>
                  </div>
                  @if (couponError()) {
                    <span class="coupon-error">{{ couponError() }}</span>
                  }
                } @else {
                  <div class="applied-coupon">
                    <span class="material-icons">local_offer</span>
                    <div class="coupon-details">
                      <span class="coupon-code">{{ appliedCoupon() }}</span>
                      <span class="coupon-savings">You save {{ discount() | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                    <button class="remove-coupon" (click)="removeCoupon()">
                      <span class="material-icons">close</span>
                    </button>
                  </div>
                }
              </div>

              <div class="summary-items">
                @for (item of cartItems(); track item.id) {
                  <div class="summary-item">
                    <div class="item-image">
                      <img [src]="item.product?.primary_image || '/assets/images/placeholder.jpg'" [alt]="item.product?.name">
                      <span class="item-qty">{{ item.quantity }}</span>
                    </div>
                    <div class="item-details">
                      <span class="item-name">{{ item.product?.name }}</span>
                      <span class="item-price">{{ getItemTotal(item) | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  </div>
                }
              </div>

              <div class="summary-totals">
                <div class="summary-row">
                  <span>Price ({{ cartItems().length }} items)</span>
                  <span>{{ subtotal() | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                @if (discount() > 0) {
                  <div class="summary-row discount">
                    <span>Discount</span>
                    <span class="discount-amount">-{{ discount() | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                }
                <div class="summary-row">
                  <span>Delivery Charges</span>
                  <span [class.free]="shipping() === 0">
                    {{ shipping() === 0 ? 'FREE' : (shipping() | currency:'INR':'symbol':'1.0-0') }}
                  </span>
                </div>
                @if (selectedPaymentType() === 'cod' && codCharge() > 0) {
                  <div class="summary-row cod-fee">
                    <span>COD Charges</span>
                    <span>+{{ codCharge() | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                }
                <div class="summary-row">
                  <span>Tax (GST 18%)</span>
                  <span>{{ tax() | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="summary-total">
                  <span>Total Amount</span>
                  <strong>{{ selectedPaymentType() === 'cod' ? (totalWithCod() | currency:'INR':'symbol':'1.0-0') : (total() | currency:'INR':'symbol':'1.0-0') }}</strong>
                </div>
                @if (savings() > 0) {
                  <div class="savings-banner">
                    <span class="material-icons">celebration</span>
                    <span>You will save {{ savings() | currency:'INR':'symbol':'1.0-0' }} on this order</span>
                  </div>
                }
              </div>

              <!-- Trust Badges -->
              <div class="trust-badges">
                <div class="badge">
                  <span class="material-icons">verified_user</span>
                  <span>Secure Payment</span>
                </div>
                <div class="badge">
                  <span class="material-icons">replay</span>
                  <span>Easy Returns</span>
                </div>
                <div class="badge">
                  <span class="material-icons">support_agent</span>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .checkout-page {
      min-height: calc(100vh - 200px);
      padding: 3rem 0 5rem;
      background: linear-gradient(180deg, var(--primary-color) 0%, #0f0f15 100%);
    }

    .page-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.5rem;
      font-weight: 500;
      color: var(--text-light);
      margin-bottom: 2.5rem;
      letter-spacing: 2px;
    }

    .empty-cart {
      text-align: center;
      padding: 5rem 2rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);

      .material-icons-outlined {
        font-size: 5rem;
        color: rgba(255, 255, 255, 0.2);
        margin-bottom: 1.5rem;
      }

      h2 {
        font-family: 'Cormorant Garamond', serif;
        color: var(--text-light);
        margin-bottom: 0.75rem;
      }

      p {
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 2rem;
      }

      .btn-primary {
        background: var(--accent-color);
        color: var(--primary-color);
        border: 1px solid var(--accent-color);
        padding: 1rem 2.5rem;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 2px;
        text-transform: uppercase;
        transition: all 0.3s ease;

        &:hover {
          background: transparent;
          color: var(--accent-color);
        }
      }
    }

    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 2.5rem;
      align-items: start;
    }

    /* Checkout Steps */
    .checkout-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2rem;
      padding: 1.5rem 2rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .step {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .step-number {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.5);
      transition: all 0.3s ease;

      .material-icons {
        font-size: 1rem;
      }
    }

    .step.active .step-number {
      background: var(--accent-color);
      border-color: var(--accent-color);
      color: var(--primary-color);
    }

    .step.completed .step-number {
      background: #10b981;
      border-color: #10b981;
      color: white;
    }

    .step-label {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.4);
    }

    .step.active .step-label {
      color: var(--text-light);
    }

    .step-connector {
      width: 60px;
      height: 1px;
      background: rgba(255, 255, 255, 0.15);
      margin: 0 1.25rem;

      &.active {
        background: #10b981;
      }
    }

    /* Form Sections */
    .form-section {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 2rem;

      h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.5rem;
        font-weight: 500;
        color: var(--text-light);
        margin-bottom: 1.75rem;
        padding-bottom: 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
        margin-bottom: 0.6rem;
        font-family: 'Montserrat', sans-serif;
        font-weight: 500;
        font-size: 0.8rem;
        letter-spacing: 0.5px;
        color: rgba(255, 255, 255, 0.7);
      }

      input, select {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-light);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.95rem;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        &.error {
          border-color: var(--error-color);
        }
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.8);

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--accent-color);
      }

      span {
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    /* Payment Methods */
    .payment-methods {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .payment-option {
      display: flex;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.02);
      cursor: pointer;
      transition: all 0.3s ease;

      input[type="radio"] {
        margin-right: 1rem;
        accent-color: var(--accent-color);
        width: 18px;
        height: 18px;
      }

      .option-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-family: 'Montserrat', sans-serif;
        color: var(--text-light);
        flex: 1;
      }

      .method-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .method-title {
        font-weight: 600;
        font-size: 0.95rem;
      }

      .method-desc {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }

      .payment-icons {
        display: flex;
        gap: 0.5rem;
        align-items: center;

        img {
          height: 18px;
          opacity: 0.8;
        }
      }

      &:hover {
        border-color: rgba(201, 169, 98, 0.3);
        background: rgba(255, 255, 255, 0.03);
      }

      &.selected {
        border-color: var(--accent-color);
        background: rgba(201, 169, 98, 0.08);
      }
    }

    .payment-info {
      margin-bottom: 1.5rem;

      .info-box {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        background: rgba(201, 169, 98, 0.08);
        border: 1px solid rgba(201, 169, 98, 0.2);
        border-radius: 4px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);

        .material-icons {
          color: var(--accent-color);
          font-size: 1.2rem;
        }
      }

      .cod-info {
        background: rgba(139, 69, 19, 0.15);
        border-color: rgba(139, 69, 19, 0.3);

        .material-icons {
          color: #d4a574;
        }
      }
    }

    /* Saved Addresses */
    .saved-addresses {
      margin-bottom: 2rem;
      
      h3 {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
    }

    .address-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .saved-address-card {
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.02);
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      gap: 1rem;

      &:hover {
        border-color: rgba(201, 169, 98, 0.3);
      }

      &.selected {
        border-color: var(--accent-color);
        background: rgba(201, 169, 98, 0.08);
      }

      &.add-new {
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 140px;
        border-style: dashed;

        .material-icons {
          font-size: 2rem;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 0.5rem;
        }

        span {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }
      }
    }

    .address-radio {
      input[type="radio"] {
        accent-color: var(--accent-color);
      }
    }

    .address-content {
      flex: 1;

      .address-name {
        font-weight: 600;
        color: var(--text-light);
        display: block;
        margin-bottom: 0.5rem;
      }

      .default-badge {
        display: inline-block;
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
        font-size: 0.7rem;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        margin-left: 0.5rem;
        text-transform: uppercase;
        font-weight: 600;
      }

      .address-details {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.6;
      }
    }

    /* Payment Section Enhanced */
    .payment-section {
      h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .security-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      margin-bottom: 1.5rem;
      border-radius: 4px;

      .material-icons {
        color: #10b981;
      }

      span {
        flex: 1;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.8);
      }

      .security-logos {
        display: flex;
        gap: 0.5rem;
      }
    }

    .payment-methods-accordion {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .payment-method-card {
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.02);
      margin-bottom: -1px;
      transition: all 0.3s ease;

      &:first-child {
        border-radius: 8px 8px 0 0;
      }

      &:last-child {
        border-radius: 0 0 8px 8px;
      }

      &.active {
        border-color: var(--accent-color);
        background: rgba(201, 169, 98, 0.05);
        z-index: 1;
      }
    }

    .method-header {
      display: flex;
      align-items: center;
      padding: 1.25rem 1.5rem;
      cursor: pointer;
      gap: 1rem;

      &:hover {
        background: rgba(255, 255, 255, 0.02);
      }
    }

    .method-radio {
      input[type="radio"] {
        width: 20px;
        height: 20px;
        accent-color: var(--accent-color);
      }
    }

    .method-info {
      flex: 1;

      .method-title-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .method-title {
        font-weight: 600;
        color: var(--text-light);
        font-size: 1rem;
      }

      .method-badge {
        font-size: 0.65rem;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        text-transform: uppercase;
        font-weight: 700;

        &.popular {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
      }

      .method-subtitle {
        display: block;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 0.25rem;
      }
    }

    .method-logos {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      img {
        height: 20px;
        opacity: 0.9;
      }

      /* Text-based payment badges */
      .payment-icon-text {
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        
        &.upi { background: linear-gradient(135deg, #097969, #20B2AA); color: white; }
        &.gpay { background: linear-gradient(135deg, #4285F4, #34A853); color: white; }
        &.phonepe { background: linear-gradient(135deg, #5f259f, #7B68EE); color: white; }
        &.paytm { background: linear-gradient(135deg, #00BAF2, #0088cc); color: white; }
      }
      
      .card-brand {
        font-size: 0.6rem;
        font-weight: 800;
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        text-transform: uppercase;
        
        &.visa { background: linear-gradient(135deg, #1A1F71, #2E4B99); color: white; }
        &.mc { background: linear-gradient(135deg, #EB001B, #F79E1B); color: white; }
        &.rupay { background: linear-gradient(135deg, #097969, #20B2AA); color: white; }
        &.amex { background: linear-gradient(135deg, #006FCF, #00A8FF); color: white; }
      }
      
      .wallet-badge {
        font-size: 0.6rem;
        font-weight: 700;
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
      }

      &.banks {
        .bank-logo {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          color: rgba(255, 255, 255, 0.8);
        }

        .more-banks {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }

    .cod-charge {
      .charge-badge {
        font-size: 0.8rem;
        color: #f59e0b;
        font-weight: 600;
      }
    }

    .method-body {
      padding: 0 1.5rem 1.5rem 3.5rem;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* UPI Styles */
    .upi-options {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .upi-option {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;

      input[type="radio"] {
        accent-color: var(--accent-color);
      }

      &.selected {
        border-color: var(--accent-color);
        background: rgba(201, 169, 98, 0.1);
      }

      .option-label {
        font-size: 0.9rem;
        color: var(--text-light);
      }
    }

    .upi-input-section {
      .form-group {
        margin-bottom: 1rem;
      }

      .upi-input-wrapper {
        position: relative;

        input {
          padding-right: 2.5rem;

          &.valid {
            border-color: #10b981;
          }
        }

        .check-icon {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #10b981;
        }
      }

      .form-hint {
        display: block;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 0.5rem;
      }

      .btn-verify {
        background: var(--accent-color);
        color: var(--primary-color);
        border: none;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          background: #d4b978;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .qr-section {
      text-align: center;

      .qr-placeholder {
        width: 180px;
        height: 180px;
        margin: 0 auto 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 2px dashed rgba(255, 255, 255, 0.2);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 8px;

        .material-icons {
          font-size: 4rem;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 0.5rem;
        }

        p {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }

      .qr-instructions {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6);
      }
    }

    /* Card Form Styles */
    .card-form {
      .form-group {
        margin-bottom: 1.25rem;

        label {
          display: block;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
      }

      .card-input-wrapper {
        position: relative;

        .detected-card {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
        }
      }

      .cvv-input-wrapper {
        position: relative;

        input {
          padding-right: 2.5rem;
        }

        .cvv-toggle {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.5);
          padding: 0.25rem;

          &:hover {
            color: var(--accent-color);
          }

          .material-icons {
            font-size: 1.2rem;
          }
        }
      }

      .save-card {
        margin-top: 0.5rem;
      }
    }

    .emi-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);

      .emi-toggle {
        margin-bottom: 1rem;
      }

      .emi-info {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 1rem;
      }

      .emi-plans {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }

      .emi-plan {
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        cursor: pointer;
        text-align: center;
        transition: all 0.3s ease;

        input[type="radio"] {
          display: none;
        }

        &.selected {
          border-color: var(--accent-color);
          background: rgba(201, 169, 98, 0.1);
        }

        .plan-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .plan-tenure {
          font-weight: 600;
          color: var(--text-light);
        }

        .plan-amount {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .no-cost-badge {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          font-size: 0.65rem;
          padding: 0.15rem 0.4rem;
          border-radius: 3px;
          margin-top: 0.25rem;
          display: inline-block;
        }
      }
    }

    /* Bank Selection */
    .popular-banks {
      margin-bottom: 1.5rem;

      .section-label {
        display: block;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .bank-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .bank-option {
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
      transition: all 0.3s ease;

      input[type="radio"] {
        display: none;
      }

      &:hover {
        border-color: rgba(201, 169, 98, 0.3);
      }

      &.selected {
        border-color: var(--accent-color);
        background: rgba(201, 169, 98, 0.1);
      }

      .bank-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .bank-icon {
        font-size: 1.5rem;
      }

      .bank-name {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .other-banks {
      .section-label {
        display: block;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 0.5rem;
      }

      .bank-select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-light);
        font-size: 0.9rem;
        cursor: pointer;

        &:focus {
          outline: none;
          border-color: var(--accent-color);
        }
      }
    }

    /* Wallet Selection */
    .wallet-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .wallet-option {
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
      transition: all 0.3s ease;

      input[type="radio"] {
        display: none;
      }

      &:hover {
        border-color: rgba(201, 169, 98, 0.3);
      }

      &.selected {
        border-color: var(--accent-color);
        background: rgba(201, 169, 98, 0.1);
      }

      .wallet-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;

        img {
          height: 32px;
        }

        .wallet-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          color: white;
          
          &.paytm { background: linear-gradient(135deg, #00BAF2, #0088cc); }
          &.phonepe { background: linear-gradient(135deg, #5f259f, #7B68EE); }
          &.mobikwik { background: linear-gradient(135deg, #E91E63, #C2185B); }
          &.freecharge { background: linear-gradient(135deg, #8BC34A, #689F38); }
          &.amazon { background: linear-gradient(135deg, #FF9900, #FF6600); }
          &.ola { background: linear-gradient(135deg, #3DB54A, #2E7D32); }
        }

        .wallet-name {
          font-size: 0.85rem;
          color: var(--text-light);
          font-weight: 500;
        }

        .linked-phone {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }

    /* COD Info */
    .cod-info-box {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 4px;

      .material-icons {
        color: #f59e0b;
        font-size: 1.5rem;
      }

      .cod-details {
        flex: 1;

        p {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.75rem;
        }

        .cod-points {
          list-style: none;
          padding: 0;
          margin: 0;

          li {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 0.5rem;

            .material-icons {
              font-size: 1rem;
              color: #10b981;
            }
          }
        }
      }
    }

    /* Review Section Enhanced */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 4px;
      margin-bottom: 1.5rem;

      .material-icons {
        color: #ef4444;
      }

      span {
        flex: 1;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.9rem;
      }

      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.5);
        padding: 0.25rem;

        &:hover {
          color: var(--text-light);
        }
      }
    }

    .payment-live-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.9rem 1rem;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 4px;
      margin-bottom: 1.5rem;

      .material-icons {
        color: #f59e0b;
      }

      span {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.9rem;
      }

      &.success {
        background: rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.35);

        .material-icons {
          color: #10b981;
        }
      }

      &.failed {
        background: rgba(239, 68, 68, 0.12);
        border-color: rgba(239, 68, 68, 0.35);

        .material-icons {
          color: #ef4444;
        }
      }
    }

    .review-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .review-block {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h3 {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-light);
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .material-icons {
          font-size: 1.1rem;
          color: var(--accent-color);
        }
      }
    }

    .edit-btn {
      background: none;
      border: none;
      color: var(--accent-color);
      cursor: pointer;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      transition: all 0.3s ease;

      &:hover {
        color: #d4b978;
      }
    }

    .review-block p {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.8;

      strong {
        color: var(--text-light);
      }
    }

    .delivery-estimate {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.85rem;
      color: #10b981;

      .material-icons {
        font-size: 1.1rem;
      }

      strong {
        color: #10b981;
      }
    }

    .selected-payment-display {
      display: flex;
      align-items: center;
      gap: 1rem;

      .material-icons {
        font-size: 1.5rem;
        color: var(--accent-color);
      }

      img {
        height: 24px;
      }

      .payment-name {
        display: block;
        font-weight: 600;
        color: var(--text-light);
      }

      .payment-detail {
        display: block;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 0.25rem;

        &.emi-detail {
          color: #10b981;
        }

        &.cod-charge-note {
          color: #f59e0b;
        }
      }
    }

    .order-items-review {
      h3 {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--text-light);
      }
    }

    .order-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      &:last-child {
        border-bottom: none;
      }

      img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
      }

      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .item-name {
        font-family: 'Montserrat', sans-serif;
        font-weight: 500;
        color: var(--text-light);
      }

      .item-meta {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 0.25rem;
      }

      .item-price {
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
        color: var(--accent-color);
      }
    }

    .btn-pay {
      min-width: 200px;
    }

    .order-policies {
      margin-top: 1.5rem;
      text-align: center;

      p {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);

        a {
          color: var(--accent-color);
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(201, 169, 98, 0.3);
      border-top-color: var(--accent-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Order Summary Enhanced */
    .order-summary {
      background: var(--surface-card);
      border: 1px solid var(--surface-card-border);
      border-radius: 8px;
      padding: 2rem;
      position: sticky;
      top: 120px;

      h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--surface-card-border);
        color: var(--text-primary);
      }
    }

    /* Coupon Section */
    .coupon-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--surface-card-border);
    }

    .coupon-input-wrapper {
      display: flex;
      gap: 0.5rem;

      input {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 1px solid var(--surface-card-border);
        background: var(--surface-card-muted);
        color: var(--text-primary);
        font-size: 0.9rem;
        text-transform: uppercase;

        &:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        &::placeholder {
          text-transform: none;
        }
      }

      .apply-btn {
        padding: 0.75rem 1.25rem;
        background: transparent;
        border: 1px solid var(--accent-color);
        color: var(--accent-color);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          background: var(--accent-color);
          color: var(--primary-color);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .coupon-error {
      display: block;
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }

    .applied-coupon {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 4px;

      .material-icons {
        color: #10b981;
      }

      .coupon-details {
        flex: 1;

        .coupon-code {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .coupon-savings {
          font-size: 0.8rem;
          color: #10b981;
        }
      }

      .remove-coupon {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 0.25rem;

        &:hover {
          color: #ef4444;
        }
      }
    }

    .summary-items {
      max-height: 250px;
      overflow-y: auto;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--surface-card-border);
      background: var(--surface-card);
      border: 1px solid var(--surface-card-border);
      border-radius: 8px;
      padding: 0.75rem;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: var(--surface-card-muted);
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(201, 169, 98, 0.3);
      }
    }

    .summary-item {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
      border-bottom: 1px solid var(--surface-card-border);
      padding-bottom: 0.75rem;

      &:last-child {
        margin-bottom: 0;
        border-bottom: none;
        padding-bottom: 0;
      }
    }

    .summary-item .item-image {
      position: relative;
      width: 50px;
      height: 50px;
      overflow: hidden;
      border: 1px solid var(--surface-card-border);
      border-radius: 4px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .item-qty {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 18px;
        height: 18px;
        background: var(--accent-color);
        color: #0a0a0f;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        font-weight: 700;
        font-family: 'Montserrat', sans-serif;
      }
    }

    .summary-item .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .summary-item .item-name {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.85rem;
      margin-bottom: 0.25rem;
      color: var(--text-primary);
      font-weight: 600;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .summary-item .item-price {
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--accent-color);
    }

    .summary-totals {
      margin-bottom: 1.5rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.9rem;
      color: var(--text-secondary);

      &.discount {
        color: #10b981;

        .discount-amount {
          color: #10b981;
        }
      }

      &.cod-fee {
        color: #f59e0b;
      }

      .free {
        color: #10b981;
        font-weight: 600;
      }
    }

    .summary-total {
      display: flex;
      justify-content: space-between;
      padding-top: 1.25rem;
      margin-top: 1rem;
      border-top: 1px solid var(--surface-card-border);
      font-family: 'Montserrat', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);

      strong {
        color: var(--accent-color);
        font-size: 1.25rem;
      }
    }

    .savings-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 4px;
      font-size: 0.85rem;
      color: #10b981;

      .material-icons {
        font-size: 1.1rem;
      }
    }

    .trust-badges {
      display: flex;
      justify-content: space-around;
      padding-top: 1.5rem;
      border-top: 1px solid var(--surface-card-border);

      .badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        text-align: center;

        .material-icons {
          font-size: 1.3rem;
          color: var(--accent-color);
        }

        span {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }
      }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .checkout-layout {
        grid-template-columns: 1fr;
      }

      .order-summary {
        position: static;
        order: -1;
      }

      .address-grid {
        grid-template-columns: 1fr;
      }

      .bank-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .wallet-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .emi-section .emi-plans {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .checkout-page {
        padding: 2rem 0 4rem;
      }

      .page-title {
        font-size: 2rem;
      }

      .checkout-steps {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .step-connector {
        display: none;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .review-section {
        grid-template-columns: 1fr;
      }

      .method-logos {
        display: none;
      }

      .bank-grid {
        grid-template-columns: 1fr 1fr;
      }

      .wallet-grid {
        grid-template-columns: 1fr 1fr;
      }

      .emi-section .emi-plans {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
        gap: 1rem;

        .btn {
          width: 100%;
        }
      }

      .trust-badges {
        flex-wrap: wrap;
        gap: 1rem;

        .badge {
          flex: 1;
          min-width: 80px;
        }
      }
    }
  `]
})
export class CheckoutComponent implements OnInit, OnDestroy {
  cartItems = signal<CartItem[]>([]);
  currentStep = signal(1);
  processing = signal(false);
  errorMessage = signal<string | null>(null);
  savedAddresses = signal<Address[]>([]);
  selectedAddressId = signal<number | null>(null);
  createdOrder = signal<Order | null>(null);
  paymentRealtimeMessage = signal<string | null>(null);
  paymentRealtimeState = signal<'idle' | 'creating' | 'pending' | 'completed' | 'failed'>('idle');

  private websocketSub?: Subscription;
  private paymentPollSub?: Subscription;
  private paymentResolved = false;

  // Payment State
  selectedPaymentType = signal<'upi' | 'card' | 'netbanking' | 'wallet' | 'cod'>('upi');
  upiMethod = signal<'vpa' | 'qr'>('vpa');
  showCvv = signal(false);
  showEmi = signal(false);
  selectedEmiPlan = signal<number | null>(null);
  selectedBank = signal<string>('');
  selectedWallet = signal<string>('');
  detectedCardType = signal<string>('');

  // Coupon State
  appliedCoupon = signal<string>('');
  couponError = signal<string>('');
  applyingCoupon = signal(false);
  discount = signal(0);

  // Form Controls
  upiIdControl = this.fb.control('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/)]);
  couponControl = this.fb.control('');
  
  cardForm = this.fb.group({
    cardNumber: ['', [Validators.required, Validators.minLength(16)]],
    cardName: ['', Validators.required],
    cardExpiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cardCvv: ['', [Validators.required, Validators.minLength(3)]],
    saveCard: [false]
  });

  shippingForm: FormGroup;

  // Payment Data
  popularBanks = [
    { code: 'SBIN', name: 'SBI', icon: '🏦' },
    { code: 'HDFC', name: 'HDFC', icon: '🏛️' },
    { code: 'ICIC', name: 'ICICI', icon: '🏢' },
    { code: 'AXIS', name: 'Axis', icon: '💳' },
    { code: 'KKBK', name: 'Kotak', icon: '🏪' },
    { code: 'PUNB', name: 'PNB', icon: '🏫' },
    { code: 'BARB', name: 'BOB', icon: '🏬' },
    { code: 'UTIB', name: 'Yes Bank', icon: '✨' }
  ];

  otherBanks = [
    { code: 'CNRB', name: 'Canara Bank' },
    { code: 'UBIN', name: 'Union Bank' },
    { code: 'IDIB', name: 'Indian Bank' },
    { code: 'CBIN', name: 'Central Bank' },
    { code: 'BKID', name: 'Bank of India' },
    { code: 'IOBA', name: 'IOB' },
    { code: 'FDRL', name: 'Federal Bank' },
    { code: 'SYNB', name: 'Syndicate Bank' },
    { code: 'CORP', name: 'Corporation Bank' },
    { code: 'ALLA', name: 'Allahabad Bank' }
  ];

  wallets = [
    { code: 'paytm', name: 'Paytm', logo: '', linkedPhone: '' },
    { code: 'phonepe', name: 'PhonePe', logo: '', linkedPhone: '' },
    { code: 'mobikwik', name: 'MobiKwik', logo: '', linkedPhone: '' },
    { code: 'freecharge', name: 'FreeCharge', logo: '', linkedPhone: '' },
    { code: 'airtel', name: 'Airtel Money', logo: '', linkedPhone: '' },
    { code: 'olamoney', name: 'Ola Money', logo: '', linkedPhone: '' }
  ];

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private authService: AuthService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private websocketService: WebsocketService,
    private router: Router
  ) {
    this.shippingForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      address2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      country: ['', Validators.required],
      saveAddress: [true]
    });
  }

  subtotal = computed(() => {
    return this.cartItems().reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);
  });

  shipping = computed(() => {
    return this.subtotal() > 999 ? 0 : 49;
  });

  tax = computed(() => {
    return (this.subtotal() - this.discount()) * 0.18;
  });

  total = computed(() => {
    return this.subtotal() - this.discount() + this.shipping() + this.tax();
  });

  codCharge = computed(() => {
    return this.total() < 500 ? 40 : 0;
  });

  totalWithCod = computed(() => {
    return this.total() + this.codCharge();
  });

  savings = computed(() => {
    const originalPrices = this.cartItems().reduce((sum, item) => {
      const originalPrice = item.product?.compare_price || item.product?.price || 0;
      return sum + originalPrice * item.quantity;
    }, 0);
    return originalPrices - this.subtotal() + this.discount();
  });

  emiPlans = computed(() => {
    const amount = this.total();
    return [
      { months: 3, emi: Math.round(amount / 3), noCost: true },
      { months: 6, emi: Math.round(amount / 6), noCost: true },
      { months: 9, emi: Math.round(amount / 9), noCost: false },
      { months: 12, emi: Math.round(amount / 12), noCost: false },
      { months: 18, emi: Math.round(amount / 18), noCost: false },
      { months: 24, emi: Math.round(amount / 24), noCost: false }
    ];
  });

  ngOnInit(): void {
    this.loadCart();
    this.prefillUserData();
    this.loadSavedAddresses();
    this.setupRealtimePaymentListener();
  }

  ngOnDestroy(): void {
    this.stopPaymentTracking();
    this.websocketSub?.unsubscribe();
  }

  loadCart(): void {
    this.cartService.loadCart().subscribe({
      next: (cart: Cart) => {
        this.cartItems.set(cart.items || []);
      }
    });
  }

  loadSavedAddresses(): void {
    this.orderService.getAddresses().subscribe({
      next: (addresses) => {
        this.savedAddresses.set(addresses);
        const defaultAddr = addresses.find(a => a.is_default);
        if (defaultAddr) {
          this.selectedAddressId.set(defaultAddr.id);
          this.prefillAddressForm(defaultAddr);
        }
      },
      error: () => {}
    });
  }

  prefillAddressForm(address: Address): void {
    const nameParts = address.full_name.split(' ');
    this.shippingForm.patchValue({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      phone: address.phone,
      address: address.street_address,
      address2: address.apartment || '',
      city: address.city,
      state: address.state,
      zipCode: address.postal_code,
      country: address.country
    });
  }

  selectSavedAddress(address: Address): void {
    this.selectedAddressId.set(address.id);
    this.prefillAddressForm(address);
  }

  clearSelectedAddress(): void {
    this.selectedAddressId.set(null);
    this.shippingForm.reset({ saveAddress: true });
    this.prefillUserData();
  }

  prefillUserData(): void {
    const user = this.authService.user();
    if (user) {
      this.shippingForm.patchValue({
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone
      });
    }
  }

  canProceedToPayment(): boolean {
    return this.selectedAddressId() !== null || this.shippingForm.valid;
  }

  getItemTotal(item: CartItem): number {
    return (item.product?.price || 0) * item.quantity;
  }

  goToStep(step: number): void {
    this.currentStep.set(step);
    this.errorMessage.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Payment Methods
  selectPaymentType(type: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod'): void {
    this.selectedPaymentType.set(type);
  }

  setUpiMethod(method: 'vpa' | 'qr'): void {
    this.upiMethod.set(method);
  }

  verifyUpi(): void {
    // In real implementation, this would verify UPI ID with the payment gateway
    console.log('Verifying UPI:', this.upiIdControl.value);
  }

  toggleCvv(): void {
    this.showCvv.update(v => !v);
  }

  toggleEmi(): void {
    this.showEmi.update(v => !v);
    if (!this.showEmi()) {
      this.selectedEmiPlan.set(null);
    }
  }

  selectEmiPlan(months: number): void {
    this.selectedEmiPlan.set(months);
  }

  selectBank(bankCodeOrEvent: string | Event): void {
    const code = typeof bankCodeOrEvent === 'string' 
      ? bankCodeOrEvent 
      : (bankCodeOrEvent.target as HTMLSelectElement).value;
    this.selectedBank.set(code);
  }

  selectWallet(code: string): void {
    this.selectedWallet.set(code);
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value.substring(0, 19);
    this.cardForm.patchValue({ cardNumber: value.replace(/\s/g, '') });
    
    // Detect card type
    const cardNum = value.replace(/\s/g, '');
    if (cardNum.startsWith('4')) {
      this.detectedCardType.set('Visa');
    } else if (cardNum.startsWith('5') || (parseInt(cardNum.substring(0, 4)) >= 2221 && parseInt(cardNum.substring(0, 4)) <= 2720)) {
      this.detectedCardType.set('Mastercard');
    } else if (cardNum.startsWith('37') || cardNum.startsWith('34')) {
      this.detectedCardType.set('Amex');
    } else if (cardNum.startsWith('6') || cardNum.startsWith('508')) {
      this.detectedCardType.set('Rupay');
    } else {
      this.detectedCardType.set('');
    }
  }

  formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
    this.cardForm.patchValue({ cardExpiry: value });
  }

  getCardLogo(cardType: string | null): string {
    const logos: { [key: string]: string } = {
      'Visa': 'https://cdn.razorpay.com/static/assets/logo/payment/visa.svg',
      'Mastercard': 'https://cdn.razorpay.com/static/assets/logo/payment/mastercard.svg',
      'Amex': 'https://cdn.razorpay.com/static/assets/logo/payment/amex.svg',
      'Rupay': 'https://cdn.razorpay.com/static/assets/logo/payment/rupay.svg'
    };
    return logos[cardType || ''] || 'https://cdn.razorpay.com/static/assets/logo/payment/visa.svg';
  }

  getBankName(code: string): string {
    const bank = [...this.popularBanks, ...this.otherBanks].find(b => b.code === code);
    return bank?.name || code;
  }

  getWalletName(code: string): string {
    return this.wallets.find(w => w.code === code)?.name || code;
  }

  getWalletLogo(code: string): string {
    return this.wallets.find(w => w.code === code)?.logo || '';
  }

  getWalletInitial(code: string): string {
    const initials: { [key: string]: string } = {
      'paytm': 'P',
      'phonepe': 'Pe',
      'mobikwik': 'M',
      'freecharge': 'F',
      'airtel': 'A',
      'olamoney': 'O'
    };
    return initials[code] || code.charAt(0).toUpperCase();
  }

  isPaymentMethodValid(): boolean {
    switch (this.selectedPaymentType()) {
      case 'upi':
        return true;
      case 'card':
        return true;
      case 'netbanking':
        return true;
      case 'wallet':
        return true;
      case 'cod':
        return true;
      default:
        return false;
    }
  }

  getEstimatedDelivery(): string {
    const today = new Date();
    const deliveryDate = new Date(today.setDate(today.getDate() + 5));
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return deliveryDate.toLocaleDateString('en-IN', options);
  }

  // Coupon Methods
  applyCoupon(): void {
    const code = this.couponControl.value?.toUpperCase().trim();
    if (!code) return;

    this.applyingCoupon.set(true);
    this.couponError.set('');

    // Simulated coupon validation - replace with actual API call
    setTimeout(() => {
      const validCoupons: { [key: string]: number } = {
        'WELCOME10': 10,
        'SAVE20': 20,
        'FLAT500': 500,
        'VIBE15': 15
      };

      if (validCoupons[code]) {
        const discountPercent = validCoupons[code];
        if (discountPercent > 100) {
          this.discount.set(discountPercent);
        } else {
          this.discount.set(Math.round(this.subtotal() * discountPercent / 100));
        }
        this.appliedCoupon.set(code);
        this.couponError.set('');
      } else {
        this.couponError.set('Invalid coupon code');
      }
      this.applyingCoupon.set(false);
    }, 1000);
  }

  removeCoupon(): void {
    this.appliedCoupon.set('');
    this.discount.set(0);
    this.couponControl.reset();
  }

  placeOrder(): void {
    this.processing.set(true);
    this.errorMessage.set(null);
    this.paymentRealtimeState.set('creating');
    this.paymentRealtimeMessage.set('Creating your order...');
    this.paymentResolved = false;

    const formValue = this.shippingForm.value;
    
    const addressData: AddressCreate = {
      full_name: `${formValue.firstName} ${formValue.lastName}`,
      phone: formValue.phone,
      street_address: formValue.address,
      apartment: formValue.address2 || undefined,
      city: formValue.city,
      state: formValue.state,
      postal_code: formValue.zipCode,
      country: formValue.country || 'IN',
      is_default: formValue.saveAddress
    };

    const addressObservable = this.selectedAddressId() 
      ? of({ id: this.selectedAddressId() } as Address)
      : this.orderService.createAddress(addressData);

    // Map payment type to backend payment method
    const paymentMethodMap: { [key: string]: string } = {
      'upi': 'razorpay',
      'card': 'razorpay',
      'netbanking': 'razorpay',
      'wallet': 'razorpay',
      'cod': 'cash_on_delivery'
    };

    addressObservable.pipe(
      switchMap((address) => {
        return this.orderService.createOrder({
          shipping_address_id: address.id,
          payment_method: paymentMethodMap[this.selectedPaymentType()],
          customer_notes: ''
        });
      }),
      switchMap((order) => {
        if (!order) {
          throw new Error('Order creation failed');
        }
        
        this.createdOrder.set(order);
        this.paymentRealtimeState.set('pending');
        this.paymentRealtimeMessage.set('Order created. Waiting for payment confirmation...');

        if (this.selectedPaymentType() !== 'cod') {
          this.startPaymentTracking(order.order_number);
        }
        
        if (this.selectedPaymentType() === 'cod') {
          return this.paymentService.markCOD(order.id);
        } else {
          return this.paymentService.initiatePayment(order.id);
        }
      }),
      catchError((error) => {
        console.error('Order/Payment failed:', error);
        const errorMsg = error?.error?.detail || error?.message || 'Failed to process. Please try again.';

        const createdOrder = this.createdOrder();
        if (createdOrder && this.selectedPaymentType() !== 'cod') {
          this.paymentService.markFailed(createdOrder.id, errorMsg).subscribe({
            error: (rollbackErr) => {
              console.error('Payment rollback failed:', rollbackErr);
            }
          });
        }

        this.errorMessage.set(errorMsg);
        this.paymentRealtimeState.set('failed');
        this.paymentRealtimeMessage.set(errorMsg);
        this.stopPaymentTracking();
        this.processing.set(false);
        return of(null);
      })
    ).subscribe({
      next: (result) => {
        if (result && result.success) {
          this.paymentResolved = true;
          this.paymentRealtimeState.set('completed');
          this.paymentRealtimeMessage.set('Payment confirmed. Redirecting...');
          this.stopPaymentTracking();
          this.cartService.clearCart().subscribe();
          this.router.navigate(['/order-confirmation', result.order_number]);
        }
        this.processing.set(false);
      }
    });
  }

  private setupRealtimePaymentListener(): void {
    this.websocketService.connect();
    this.websocketSub = this.websocketService.messages$.subscribe((message) => {
      if (message.type !== 'order_update') {
        return;
      }

      const createdOrder = this.createdOrder();
      if (!createdOrder) {
        return;
      }

      const data = message.data || {};
      const sameOrder = data.order_id === createdOrder.id || data.order_number === createdOrder.order_number;
      if (!sameOrder) {
        return;
      }

      const paymentStatus = this.normalizeStatus(data.payment_status);
      const eventMessage = data.message || this.paymentRealtimeMessage() || 'Payment status updated';

      if (paymentStatus === 'completed') {
        this.paymentRealtimeState.set('completed');
        this.paymentRealtimeMessage.set('Payment completed. Redirecting...');
        this.stopPaymentTracking();

        if (!this.paymentResolved) {
          this.paymentResolved = true;
          this.processing.set(false);
          this.cartService.clearCart().subscribe();
          this.router.navigate(['/order-confirmation', createdOrder.order_number]);
        }
        return;
      }

      if (paymentStatus === 'failed') {
        this.paymentRealtimeState.set('failed');
        this.paymentRealtimeMessage.set(eventMessage);
        this.errorMessage.set(eventMessage);
        this.stopPaymentTracking();
        this.processing.set(false);
        return;
      }

      this.paymentRealtimeState.set('pending');
      this.paymentRealtimeMessage.set(eventMessage);
    });
  }

  private startPaymentTracking(orderNumber: string): void {
    this.stopPaymentTracking();
    this.paymentPollSub = interval(3000).pipe(
      switchMap(() => this.orderService.getOrder(orderNumber)),
      catchError(() => of(null))
    ).subscribe((order) => {
      if (!order) {
        return;
      }

      const paymentStatus = this.normalizeStatus(order.payment_status);
      if (paymentStatus === 'completed' || paymentStatus === 'failed') {
        this.websocketService.send({ type: 'ping' });
        this.paymentRealtimeMessage.set(
          paymentStatus === 'completed' ? 'Payment completed. Redirecting...' : 'Payment failed. Please try again.'
        );
        this.paymentRealtimeState.set(paymentStatus === 'completed' ? 'completed' : 'failed');

        if (paymentStatus === 'completed' && !this.paymentResolved) {
          this.paymentResolved = true;
          this.processing.set(false);
          this.cartService.clearCart().subscribe();
          this.router.navigate(['/order-confirmation', order.order_number]);
        }

        if (paymentStatus === 'failed') {
          this.errorMessage.set('Payment failed. Your cart has been restored.');
          this.processing.set(false);
        }

        this.stopPaymentTracking();
      }
    });
  }

  private stopPaymentTracking(): void {
    this.paymentPollSub?.unsubscribe();
    this.paymentPollSub = undefined;
  }

  private normalizeStatus(status: unknown): string {
    return String(status || '').toLowerCase();
  }
}
