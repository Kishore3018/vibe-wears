import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
}

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  message: string;
}

@Component({
  selector: 'app-razorpay-checkout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="checkout-wrapper">
      <h1>Checkout</h1>
      <p>Complete your payment securely with Razorpay.</p>

      @if (message()) {
        <p class="message">{{ message() }}</p>
      }

      <button class="pay-btn" [disabled]="loading()" (click)="payNow()">
        {{ loading() ? 'Processing...' : 'Pay Now' }}
      </button>
    </section>
  `,
  styles: [
    `
      .checkout-wrapper {
        max-width: 520px;
        margin: 3rem auto;
        padding: 2rem;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: #ffffff;
      }

      h1 {
        margin: 0 0 0.75rem;
      }

      .message {
        margin: 1rem 0;
        color: #374151;
      }

      .pay-btn {
        border: none;
        background: #111827;
        color: #ffffff;
        padding: 0.8rem 1.4rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }

      .pay-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    `,
  ],
})
export class RazorpayCheckoutComponent {
  loading = signal(false);
  message = signal('');
  private readonly razorpayScriptSrc = 'https://checkout.razorpay.com/v1/checkout.js';

  constructor(private http: HttpClient) {}

  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(`script[src="${this.razorpayScriptSrc}"]`) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => {
          existingScript.remove();
          this.injectRazorpayScript(resolve, reject);
        }, { once: true });

        setTimeout(() => {
          if (window.Razorpay) {
            resolve();
          }
        }, 3000);
        return;
      }

      this.injectRazorpayScript(resolve, reject);
    });
  }

  private injectRazorpayScript(resolve: () => void, reject: (reason?: unknown) => void): void {
    const script = document.createElement('script');
    script.src = this.razorpayScriptSrc;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';

    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error('Failed to load Razorpay script. Check internet or disable blockers.'));
    }, 10000);

    script.onload = () => {
      window.clearTimeout(timeout);
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK loaded but window.Razorpay is unavailable'));
        return;
      }
      resolve();
    };

    script.onerror = () => {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error('Failed to load Razorpay script. Check internet or disable blockers.'));
    };

    document.body.appendChild(script);
  }

  payNow(): void {
    this.loading.set(true);
    this.message.set('Creating Razorpay order...');

    const api = `${environment.razorpayApiUrl}/create-order`;

    this.http.post<CreateOrderResponse>(api, { amount: 499 }).subscribe({
      next: async (order) => {
        try {
          await this.loadRazorpayScript();

          const options = {
            key: environment.razorpayKeyId,
            amount: order.amount,
            currency: order.currency,
            order_id: order.order_id,
            name: 'Vibe Wears',
            description: 'Checkout Payment',
            handler: (response: VerifyPaymentRequest) => {
              this.message.set('Verifying payment...');

              const verifyApi = `${environment.razorpayApiUrl}/verify-payment`;
              this.http.post<VerifyPaymentResponse>(verifyApi, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }).subscribe({
                next: (verifyResult) => {
                  if (verifyResult.success) {
                    this.message.set('Payment verified successfully.');
                  } else {
                    this.message.set(verifyResult.message || 'Payment verification failed.');
                  }
                  this.loading.set(false);
                },
                error: (verifyError) => {
                  this.message.set(verifyError?.error?.message || 'Payment verification failed.');
                  this.loading.set(false);
                },
              });
            },
            modal: {
              ondismiss: () => {
                this.message.set('Payment popup closed');
                this.loading.set(false);
              },
            },
          };

          const razorpay = new window.Razorpay(options);
          razorpay.open();
        } catch (error: any) {
          this.message.set(error?.message || 'Unable to start Razorpay checkout');
          this.loading.set(false);
        }
      },
      error: (error) => {
        this.message.set(error?.error?.message || 'Failed to create order');
        this.loading.set(false);
      },
    });
  }
}
