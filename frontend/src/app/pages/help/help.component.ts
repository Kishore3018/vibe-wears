import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface FAQ {
  question: string;
  answer: string;
  expanded: boolean;
}

interface FAQCategory {
  title: string;
  icon: string;
  faqs: FAQ[];
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="help-page">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header">
          <h1>Help Center</h1>
          <p>Find answers to your questions or contact our support team</p>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <a routerLink="/track-order" class="action-card">
            <span class="material-icons">local_shipping</span>
            <h3>Track Order</h3>
            <p>Track your order status</p>
          </a>
          <a routerLink="/account/orders" class="action-card">
            <span class="material-icons">receipt_long</span>
            <h3>My Orders</h3>
            <p>View your order history</p>
          </a>
          <a href="mailto:support@vibewears.com" class="action-card">
            <span class="material-icons">email</span>
            <h3>Email Support</h3>
            <p>Get help via email</p>
          </a>
          <a href="tel:+911800123456" class="action-card">
            <span class="material-icons">phone</span>
            <h3>Call Us</h3>
            <p>1800-123-4567</p>
          </a>
        </div>

        <!-- Search FAQs -->
        <div class="search-section">
          <div class="search-box">
            <span class="material-icons">search</span>
            <input 
              type="text" 
              placeholder="Search for help..." 
              [(ngModel)]="searchQuery"
              (input)="filterFAQs()"
            />
          </div>
        </div>

        <!-- FAQ Categories -->
        <div class="faq-section">
          @for (category of filteredCategories(); track category.title) {
            <div class="faq-category">
              <div class="category-header">
                <span class="material-icons">{{ category.icon }}</span>
                <h2>{{ category.title }}</h2>
              </div>
              <div class="faq-list">
                @for (faq of category.faqs; track faq.question; let i = $index) {
                  <div class="faq-item" [class.expanded]="faq.expanded">
                    <button class="faq-question" (click)="toggleFAQ(category, i)">
                      <span>{{ faq.question }}</span>
                      <span class="material-icons">{{ faq.expanded ? 'expand_less' : 'expand_more' }}</span>
                    </button>
                    @if (faq.expanded) {
                      <div class="faq-answer">
                        <p>{{ faq.answer }}</p>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Contact Section -->
        <div class="contact-section">
          <h2>Still Need Help?</h2>
          <p>Our customer support team is here to assist you</p>
          
          <div class="contact-methods">
            <div class="contact-card">
              <span class="material-icons">email</span>
              <h3>Email Us</h3>
              <p>support&#64;vibewears.com</p>
              <span class="response-time">Response within 24 hours</span>
            </div>
            
            <div class="contact-card">
              <span class="material-icons">phone</span>
              <h3>Call Us</h3>
              <p>1800-123-4567</p>
              <span class="response-time">Mon-Sat, 9AM - 8PM</span>
            </div>
            
            <div class="contact-card">
              <span class="material-icons">chat</span>
              <h3>Live Chat</h3>
              <p>Chat with our team</p>
              <span class="response-time">Available 24/7</span>
            </div>
          </div>
        </div>

        <!-- Policies Links -->
        <div class="policies-section">
          <h3>Important Information</h3>
          <div class="policy-links">
            <a href="#">Shipping Policy</a>
            <a href="#">Return & Refund Policy</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .help-page {
      min-height: 100vh;
      padding: 120px 0 60px;
      background: var(--bg-light);
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;

      h1 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 2.5rem;
        font-weight: 600;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--text-secondary);
        font-size: 1rem;
      }
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .action-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
      transition: all 0.3s;
      text-decoration: none;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      }

      .material-icons {
        font-size: 2.5rem;
        color: var(--accent-color);
        margin-bottom: 1rem;
      }

      h3 {
        font-size: 1rem;
        color: var(--primary-color);
        margin-bottom: 0.25rem;
      }

      p {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .search-section {
      margin-bottom: 3rem;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: white;
      padding: 1rem 1.5rem;
      border-radius: 50px;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);

      .material-icons {
        color: var(--text-secondary);
      }

      input {
        flex: 1;
        border: none;
        font-size: 1rem;
        outline: none;

        &::placeholder {
          color: #999;
        }
      }
    }

    .faq-section {
      margin-bottom: 3rem;
    }

    .faq-category {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;

      .material-icons {
        font-size: 1.5rem;
        color: var(--accent-color);
      }

      h2 {
        font-size: 1.2rem;
        color: var(--primary-color);
        margin: 0;
      }
    }

    .faq-list {
      display: flex;
      flex-direction: column;
    }

    .faq-item {
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      &.expanded {
        .faq-question {
          color: var(--accent-color);
        }
      }
    }

    .faq-question {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      background: none;
      border: none;
      text-align: left;
      font-size: 0.95rem;
      color: var(--primary-color);
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: var(--accent-color);
      }

      .material-icons {
        font-size: 1.5rem;
        color: inherit;
      }
    }

    .faq-answer {
      padding: 0 0 1rem;
      animation: slideDown 0.3s ease;

      p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.6;
        font-size: 0.9rem;
      }
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

    .contact-section {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);

      h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.75rem;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
      }

      > p {
        color: var(--text-secondary);
        margin-bottom: 2rem;
      }
    }

    .contact-methods {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .contact-card {
      padding: 1.5rem;
      border: 1px solid #eee;
      border-radius: 12px;
      transition: all 0.3s;

      &:hover {
        border-color: var(--accent-color);
        background: #fafafa;
      }

      .material-icons {
        font-size: 2rem;
        color: var(--accent-color);
        margin-bottom: 1rem;
      }

      h3 {
        font-size: 1rem;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--text-primary);
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      .response-time {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
    }

    .policies-section {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);

      h3 {
        font-size: 1.1rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
      }
    }

    .policy-links {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1.5rem;

      a {
        color: var(--text-secondary);
        font-size: 0.9rem;
        transition: color 0.2s;

        &:hover {
          color: var(--accent-color);
        }
      }
    }

    @media (max-width: 768px) {
      .help-page {
        padding-top: 100px;
      }

      .page-header h1 {
        font-size: 2rem;
      }

      .quick-actions {
        grid-template-columns: repeat(2, 1fr);
      }

      .contact-methods {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HelpComponent {
  searchQuery = '';

  private faqCategories: FAQCategory[] = [
    {
      title: 'Orders & Shipping',
      icon: 'local_shipping',
      faqs: [
        {
          question: 'How can I track my order?',
          answer: 'You can track your order by visiting our Track Order page and entering your order number and registered email address. You will receive tracking updates via email once your order is shipped.',
          expanded: false
        },
        {
          question: 'What are the shipping charges?',
          answer: 'We offer FREE shipping on all orders above ₹999. For orders below ₹999, a flat shipping fee of ₹99 is applied. Delivery typically takes 3-7 business days depending on your location.',
          expanded: false
        },
        {
          question: 'Can I change my delivery address after placing an order?',
          answer: 'Address changes can only be made if your order has not been shipped yet. Please contact our customer support immediately with your order number and new address details.',
          expanded: false
        },
        {
          question: 'Do you deliver internationally?',
          answer: 'Currently, we only deliver within India. We are working on expanding our services to international locations. Stay tuned for updates!',
          expanded: false
        }
      ]
    },
    {
      title: 'Returns & Refunds',
      icon: 'assignment_return',
      faqs: [
        {
          question: 'What is your return policy?',
          answer: 'We offer a 7-day easy return policy for all unused products with original tags and packaging intact. Simply initiate a return request from your account or contact customer support.',
          expanded: false
        },
        {
          question: 'How long does it take to process a refund?',
          answer: 'Once we receive and inspect the returned item, refunds are processed within 5-7 business days. The amount will be credited to your original payment method.',
          expanded: false
        },
        {
          question: 'Can I exchange a product instead of returning it?',
          answer: 'Yes, you can exchange products for a different size or color within 7 days of delivery. Please ensure the product is unused with original tags intact.',
          expanded: false
        }
      ]
    },
    {
      title: 'Payment',
      icon: 'payment',
      faqs: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit/debit cards (Visa, MasterCard, Rupay), UPI, Net Banking, and Cash on Delivery (COD) for select locations. All online payments are secured with SSL encryption.',
          expanded: false
        },
        {
          question: 'Is Cash on Delivery available?',
          answer: 'Yes, Cash on Delivery is available for orders up to ₹10,000 in select serviceable pin codes. COD availability will be shown at checkout based on your delivery address.',
          expanded: false
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Absolutely! We use industry-standard SSL encryption and secure payment gateways. We do not store your card details on our servers.',
          expanded: false
        }
      ]
    },
    {
      title: 'Account & Orders',
      icon: 'person',
      faqs: [
        {
          question: 'How do I create an account?',
          answer: 'Click on the user icon in the header and select "Register". Fill in your details including name, email, and password. You can also sign up during checkout.',
          expanded: false
        },
        {
          question: 'How can I cancel my order?',
          answer: 'Orders can be cancelled before they are shipped. Go to My Orders in your account, select the order you wish to cancel, and click "Cancel Order". Refunds will be processed within 5-7 business days.',
          expanded: false
        },
        {
          question: 'I forgot my password. How can I reset it?',
          answer: 'Click on "Login" and then "Forgot Password". Enter your registered email address, and we\'ll send you a link to reset your password.',
          expanded: false
        }
      ]
    },
    {
      title: 'Products & Sizing',
      icon: 'checkroom',
      faqs: [
        {
          question: 'How do I find my correct size?',
          answer: 'Each product page includes a detailed size guide with measurements. We recommend measuring yourself and comparing with our size chart for the best fit. If you\'re between sizes, we suggest going one size up.',
          expanded: false
        },
        {
          question: 'Are the product colors accurate?',
          answer: 'We make every effort to display accurate colors. However, actual colors may vary slightly due to monitor settings and lighting conditions during photography.',
          expanded: false
        },
        {
          question: 'Can I get notified when an out-of-stock item is available?',
          answer: 'Yes! On the product page, click "Notify Me" for out-of-stock items, and we\'ll email you as soon as it\'s back in stock.',
          expanded: false
        }
      ]
    }
  ];

  filteredCategories = signal<FAQCategory[]>(this.faqCategories);

  filterFAQs(): void {
    if (!this.searchQuery.trim()) {
      this.filteredCategories.set(this.faqCategories);
      return;
    }

    const query = this.searchQuery.toLowerCase();
    const filtered = this.faqCategories.map(category => ({
      ...category,
      faqs: category.faqs.filter(faq => 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query)
      )
    })).filter(category => category.faqs.length > 0);

    this.filteredCategories.set(filtered);
  }

  toggleFAQ(category: FAQCategory, index: number): void {
    category.faqs[index].expanded = !category.faqs[index].expanded;
  }
}
