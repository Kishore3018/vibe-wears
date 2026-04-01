import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap, tap } from 'rxjs';
import { environment } from '@env/environment';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrder {
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number;
  currency: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export interface PaymentVerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: number;
}

export interface PaymentFailureRequest {
  order_id: number;
  reason?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  order_number?: string;
}

export interface PaymentConfig {
  razorpay_key_id: string;
  demo_mode: boolean;
}

export interface RazorpayPaymentResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;
  private razorpayLoaded = false;

  /**
   * Load Razorpay checkout script dynamically
   */
  loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.razorpayLoaded && window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.razorpayLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.body.appendChild(script);
    });
  }

  /**
   * Get payment configuration
   */
  getPaymentConfig(): Observable<PaymentConfig> {
    return this.http.get<PaymentConfig>(`${this.apiUrl}/config`);
  }

  /**
   * Create a Razorpay order for payment
   */
  createPaymentOrder(orderId: number): Observable<RazorpayOrder> {
    return this.http.post<RazorpayOrder>(`${this.apiUrl}/create-order`, {
      order_id: orderId
    });
  }

  /**
   * Verify payment after completion
   */
  verifyPayment(request: PaymentVerifyRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/verify`, request);
  }

  /**
   * Mark order as Cash on Delivery
   */
  markCOD(orderId: number): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/mark-cod?order_id=${orderId}`, {});
  }

  /**
   * Mark online payment as failed and trigger rollback/cart restore
   */
  markFailed(orderId: number, reason?: string): Observable<PaymentResponse> {
    const body: PaymentFailureRequest = { order_id: orderId, reason };
    return this.http.post<PaymentResponse>(`${this.apiUrl}/failed`, body);
  }

  /**
   * Open Razorpay checkout modal and handle payment
   */
  initiatePayment(orderId: number): Observable<PaymentResponse> {
    return from(this.loadRazorpayScript()).pipe(
      switchMap(() => this.createPaymentOrder(orderId)),
      switchMap((razorpayOrder) => {
        return new Observable<RazorpayPaymentResult>((observer) => {
          const options = {
            key: razorpayOrder.razorpay_key_id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'Vibe Wears',
            description: `Order #${razorpayOrder.order_number}`,
            order_id: razorpayOrder.razorpay_order_id,
            prefill: {
              name: razorpayOrder.customer_name,
              email: razorpayOrder.customer_email,
              contact: razorpayOrder.customer_phone
            },
            theme: {
              color: '#C9A962'
            },
            handler: (response: RazorpayPaymentResult) => {
              observer.next(response);
              observer.complete();
            },
            modal: {
              ondismiss: () => {
                observer.error(new Error('Payment cancelled by user'));
              }
            }
          };

          // For demo mode, simulate successful payment
          if (razorpayOrder.razorpay_key_id === 'rzp_test_demo') {
            setTimeout(() => {
              observer.next({
                razorpay_order_id: razorpayOrder.razorpay_order_id,
                razorpay_payment_id: `pay_demo_${Date.now()}`,
                razorpay_signature: 'demo_signature'
              });
              observer.complete();
            }, 2000);
            return;
          }

          const razorpay = new window.Razorpay(options);
          razorpay.open();
        });
      }),
      switchMap((paymentResult) => 
        this.verifyPayment({
          ...paymentResult,
          order_id: orderId
        })
      )
    );
  }
}
