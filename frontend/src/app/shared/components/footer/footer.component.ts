import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <footer class="footer">
      <div class="container">
        <!-- Main Footer -->
        <div class="footer-main">
          <div class="footer-grid">
            <!-- Brand Column -->
            <div class="footer-col brand-col">
              <h2 class="footer-logo">VIBE WEARS</h2>
              <p class="brand-tagline">Crafting timeless elegance for the modern man. Premium men's fashion where quality meets style.</p>
              <p class="founder-credit">Founded by <span class="founder-name">Kiruthik</span></p>
              <div class="social-links">
                <a href="https://facebook.com/vibewears" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="https://instagram.com/vibewears" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="https://twitter.com/vibewears" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
                <a href="https://pinterest.com/vibewears" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.15 9.42 7.6 11.18-.1-.94-.19-2.39.04-3.42.21-.93 1.35-5.74 1.35-5.74s-.34-.69-.34-1.71c0-1.6.93-2.8 2.08-2.8.98 0 1.46.74 1.46 1.62 0 .99-.63 2.46-.95 3.83-.27 1.14.57 2.07 1.69 2.07 2.03 0 3.59-2.14 3.59-5.23 0-2.73-1.96-4.64-4.77-4.64-3.25 0-5.16 2.44-5.16 4.96 0 .98.38 2.04.85 2.61.09.11.11.21.08.33-.09.36-.28 1.14-.32 1.3-.05.21-.17.26-.38.16-1.44-.67-2.34-2.77-2.34-4.46 0-3.63 2.64-6.97 7.62-6.97 4 0 7.1 2.85 7.1 6.67 0 3.97-2.51 7.17-5.99 7.17-1.17 0-2.27-.61-2.65-1.33l-.72 2.74c-.26 1-.96 2.26-1.43 3.03C9.58 23.82 10.75 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"></path>
                  </svg>
                </a>
              </div>
            </div>

            <!-- Quick Links -->
            <div class="footer-col">
              <h4>Shop</h4>
              <ul>
                <li><a routerLink="/products">All Products</a></li>
                <li><a routerLink="/products" [queryParams]="{is_new_arrival: true}">New Arrivals</a></li>
                <li><a routerLink="/products" [queryParams]="{is_featured: true}">Featured</a></li>
                <li><a routerLink="/products" [queryParams]="{sort_by: 'popular'}">Best Sellers</a></li>
              </ul>
            </div>

            <!-- Customer Service -->
            <div class="footer-col">
              <h4>Support</h4>
              <ul>
                <li><a (click)="openModal('contact')" style="cursor: pointer;">Contact Us</a></li>
                <li><a (click)="openModal('faqs')" style="cursor: pointer;">FAQs</a></li>
                <li><a (click)="openModal('sizeGuide')" style="cursor: pointer;">Size Guide</a></li>
                <li><a (click)="openModal('shipping')" style="cursor: pointer;">Shipping</a></li>
                <li><a (click)="openModal('returns')" style="cursor: pointer;">Returns</a></li>
              </ul>
            </div>

            <!-- Visit Our Store -->
            <div class="footer-col">
              <h4>Contact Us</h4>
              <div class="contact-info">
                <a href="tel:+918524080713" class="contact-link">
                  <span class="material-icons contact-icon">phone</span>
                  <span>+91 8524080713</span>
                </a>
                <a href="mailto:support@vibemenswears.com" class="contact-link">
                  <span class="material-icons contact-icon">email</span>
                  <span>support&#64;vibemenswears.com</span>
                </a>
              </div>
              <a 
                href="https://www.google.com/maps/search/vibe+mens+wear+karur/@10.9944203,78.0547201,11z" 
                target="_blank" 
                rel="noopener noreferrer"
                class="store-location"
              >
                <span class="material-icons location-icon">location_on</span>
                <span class="address-text">
                  560 B, Vangapalayam Check Post,<br>
                  Pupa Showroom Opposite,<br>
                  Vengamedu, Karur - 639006
                </span>
              </a>
              <p class="map-hint">Click to view on Google Maps</p>
            </div>

            <!-- Newsletter -->
            <div class="footer-col newsletter-col">
              <h4>Newsletter</h4>
              <p>Join to receive exclusive offers and updates.</p>
              <form class="newsletter-form" (submit)="onSubscribe($event)">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  [(ngModel)]="email"
                  name="email"
                  required
                >
                <button type="submit" class="btn btn-secondary">
                  <span class="material-icons">east</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Footer Bottom -->
        <div class="footer-bottom">
          <div class="footer-bottom-content">
            <p>&copy; {{ currentYear }} Vibe Wears. All rights reserved.</p>
            <div class="footer-links">
              <a (click)="openModal('privacy')" style="cursor: pointer;">Privacy</a>
              <a (click)="openModal('terms')" style="cursor: pointer;">Terms</a>
              <a (click)="openModal('cookies')" style="cursor: pointer;">Cookies</a>
            </div>
            <div class="payment-methods">
              <span>We Accept:</span>
              <div class="payment-icons">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" height="16">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" height="16">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/200px-Stripe_Logo%2C_revised_2016.svg.png" alt="Stripe" height="16">
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>

    <!-- Modal Overlay -->
    <div class="modal-overlay" *ngIf="activeModal" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="modal-close" (click)="closeModal()">
          <span class="material-icons">close</span>
        </button>
        
        <!-- Contact Us -->
        <div *ngIf="activeModal === 'contact'" class="modal-body">
          <h2>Contact Us</h2>
          <div class="contact-details">
            <div class="contact-item">
              <span class="material-icons">phone</span>
              <div>
                <h4>Phone</h4>
                <p><a href="tel:+918524080713">+91 8524080713</a></p>
              </div>
            </div>
            <div class="contact-item">
              <span class="material-icons">email</span>
              <div>
                <h4>Email</h4>
                <p><a href="mailto:support@vibemenswears.com">support&#64;vibemenswears.com</a></p>
              </div>
            </div>
            <div class="contact-item">
              <span class="material-icons">location_on</span>
              <div>
                <h4>Address</h4>
                <p>560 B, Vangapalayam Check Post,<br>Pupa Showroom Opposite,<br>Vengamedu, Karur - 639006</p>
              </div>
            </div>
            <div class="contact-item">
              <span class="material-icons">schedule</span>
              <div>
                <h4>Business Hours</h4>
                <p>Mon - Sat: 10:00 AM - 9:00 PM<br>Sunday: 11:00 AM - 7:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQs -->
        <div *ngIf="activeModal === 'faqs'" class="modal-body">
          <h2>Frequently Asked Questions</h2>
          <div class="faq-list">
            <div class="faq-item" *ngFor="let faq of faqs" (click)="toggleFaq(faq)">
              <div class="faq-question">
                <span>{{ faq.question }}</span>
                <span class="material-icons">{{ faq.open ? 'expand_less' : 'expand_more' }}</span>
              </div>
              <div class="faq-answer" *ngIf="faq.open">{{ faq.answer }}</div>
            </div>
          </div>
        </div>

        <!-- Size Guide -->
        <div *ngIf="activeModal === 'sizeGuide'" class="modal-body">
          <h2>Size Guide</h2>
          <p class="size-intro">Find your perfect fit with our comprehensive size guide.</p>
          <div class="size-tables">
            <h3>Shirts & T-Shirts</h3>
            <table>
              <thead>
                <tr><th>Size</th><th>Chest (in)</th><th>Length (in)</th><th>Shoulder (in)</th></tr>
              </thead>
              <tbody>
                <tr><td>S</td><td>36-38</td><td>27</td><td>17</td></tr>
                <tr><td>M</td><td>38-40</td><td>28</td><td>18</td></tr>
                <tr><td>L</td><td>40-42</td><td>29</td><td>19</td></tr>
                <tr><td>XL</td><td>42-44</td><td>30</td><td>20</td></tr>
                <tr><td>XXL</td><td>44-46</td><td>31</td><td>21</td></tr>
              </tbody>
            </table>
            <h3>Pants & Jeans</h3>
            <table>
              <thead>
                <tr><th>Size</th><th>Waist (in)</th><th>Hip (in)</th><th>Inseam (in)</th></tr>
              </thead>
              <tbody>
                <tr><td>28</td><td>28</td><td>36</td><td>30</td></tr>
                <tr><td>30</td><td>30</td><td>38</td><td>31</td></tr>
                <tr><td>32</td><td>32</td><td>40</td><td>32</td></tr>
                <tr><td>34</td><td>34</td><td>42</td><td>32</td></tr>
                <tr><td>36</td><td>36</td><td>44</td><td>33</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Shipping -->
        <div *ngIf="activeModal === 'shipping'" class="modal-body">
          <h2>Shipping Information</h2>
          <div class="info-section">
            <h3>Delivery Options</h3>
            <div class="shipping-option">
              <span class="material-icons">local_shipping</span>
              <div>
                <h4>Standard Delivery</h4>
                <p>5-7 business days | Free on orders above ₹999</p>
              </div>
            </div>
            <div class="shipping-option">
              <span class="material-icons">bolt</span>
              <div>
                <h4>Express Delivery</h4>
                <p>2-3 business days | ₹149</p>
              </div>
            </div>
            <div class="shipping-option">
              <span class="material-icons">schedule</span>
              <div>
                <h4>Same Day Delivery</h4>
                <p>Available in select cities | ₹299</p>
              </div>
            </div>
          </div>
          <div class="info-section">
            <h3>Shipping Policy</h3>
            <ul>
              <li>Orders placed before 2 PM are processed the same day</li>
              <li>Free shipping on all prepaid orders above ₹999</li>
              <li>Cash on Delivery available (₹49 extra)</li>
              <li>Track your order with real-time updates</li>
            </ul>
          </div>
        </div>

        <!-- Returns -->
        <div *ngIf="activeModal === 'returns'" class="modal-body">
          <h2>Returns & Exchange</h2>
          <div class="info-section">
            <h3>Easy Returns</h3>
            <p>We want you to love your purchase. If you're not completely satisfied, we offer hassle-free returns within 15 days of delivery.</p>
            
            <h3>Return Policy</h3>
            <ul>
              <li>Items must be unused with original tags attached</li>
              <li>Return request must be raised within 15 days</li>
              <li>Refund processed within 5-7 business days</li>
              <li>Free return pickup for prepaid orders</li>
            </ul>

            <h3>Exchange Policy</h3>
            <ul>
              <li>Exchange available for size/color changes</li>
              <li>Subject to product availability</li>
              <li>One exchange per order allowed</li>
            </ul>

            <h3>Non-Returnable Items</h3>
            <ul>
              <li>Innerwear and socks (hygiene reasons)</li>
              <li>Customized or personalized items</li>
              <li>Items marked as "Final Sale"</li>
            </ul>
          </div>
        </div>

        <!-- Privacy Policy -->
        <div *ngIf="activeModal === 'privacy'" class="modal-body">
          <h2>Privacy Policy</h2>
          <div class="info-section">
            <p>At Vibe Wears, we respect your privacy and are committed to protecting your personal data.</p>
            
            <h3>Information We Collect</h3>
            <ul>
              <li>Personal details (name, email, phone) for order processing</li>
              <li>Shipping address for delivery</li>
              <li>Payment information (processed securely via payment gateway)</li>
              <li>Browsing data to improve user experience</li>
            </ul>

            <h3>How We Use Your Data</h3>
            <ul>
              <li>Process and deliver your orders</li>
              <li>Send order updates and notifications</li>
              <li>Improve our products and services</li>
              <li>Send promotional offers (with your consent)</li>
            </ul>

            <h3>Data Security</h3>
            <p>We use industry-standard encryption and security measures to protect your data. Your payment information is never stored on our servers.</p>
          </div>
        </div>

        <!-- Terms -->
        <div *ngIf="activeModal === 'terms'" class="modal-body">
          <h2>Terms & Conditions</h2>
          <div class="info-section">
            <h3>General Terms</h3>
            <p>By using Vibe Wears website and services, you agree to these terms and conditions.</p>
            
            <h3>Orders & Pricing</h3>
            <ul>
              <li>All prices are in Indian Rupees (INR)</li>
              <li>Prices are subject to change without notice</li>
              <li>Orders are subject to product availability</li>
              <li>We reserve the right to cancel orders due to pricing errors</li>
            </ul>

            <h3>User Accounts</h3>
            <ul>
              <li>You are responsible for maintaining account security</li>
              <li>Provide accurate and current information</li>
              <li>One account per person is allowed</li>
            </ul>

            <h3>Limitation of Liability</h3>
            <p>Vibe Wears shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
          </div>
        </div>

        <!-- Cookies -->
        <div *ngIf="activeModal === 'cookies'" class="modal-body">
          <h2>Cookie Policy</h2>
          <div class="info-section">
            <p>We use cookies to enhance your browsing experience on Vibe Wears.</p>
            
            <h3>What Are Cookies?</h3>
            <p>Cookies are small text files stored on your device that help us remember your preferences and improve site functionality.</p>

            <h3>Types of Cookies We Use</h3>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for basic site functionality</li>
              <li><strong>Performance Cookies:</strong> Help us understand how you use our site</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences</li>
              <li><strong>Marketing Cookies:</strong> Used for relevant advertising (with consent)</li>
            </ul>

            <h3>Managing Cookies</h3>
            <p>You can control cookies through your browser settings. Disabling certain cookies may affect site functionality.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .footer {
      background-color: var(--primary-color);
      color: var(--text-light);
      padding-top: 5rem;
    }

    .footer-main {
      padding-bottom: 4rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
      gap: 3rem;
    }

    .footer-logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: 4px;
      margin-bottom: 1.25rem;
      position: relative;
      display: inline-block;

      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        width: 40px;
        height: 1px;
        background: var(--accent-color);
      }
    }

    .brand-tagline {
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.8;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .founder-credit {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.85rem;
      margin-bottom: 2rem;
      font-style: italic;
    }

    .founder-name {
      color: var(--accent-color);
      font-weight: 500;
      font-style: normal;
    }

    .social-links {
      display: flex;
      gap: 0.75rem;

      a {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: var(--text-light);
        transition: var(--transition);

        &:hover {
          background: var(--accent-color);
          border-color: var(--accent-color);
          color: var(--primary-color);
          transform: translateY(-3px);
        }
      }
    }

    .footer-col h4 {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 1.75rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--accent-color);
    }

    .footer-col ul {
      list-style: none;

      li {
        margin-bottom: 0.875rem;
      }

      a {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
        transition: var(--transition);
        position: relative;

        &:hover {
          color: var(--text-light);
          padding-left: 8px;
        }
      }
    }

    .newsletter-col p {
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
    }

    /* Contact Info Styles */
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .contact-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 0.9rem;
      transition: var(--transition);

      &:hover {
        color: var(--accent-color);

        .contact-icon {
          transform: scale(1.1);
        }
      }
    }

    .contact-icon {
      font-size: 1.1rem;
      color: var(--accent-color);
      transition: var(--transition);
    }

    /* Store Location Styles */
    .store-location {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      transition: var(--transition);
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.03);

      &:hover {
        color: var(--text-light);
        border-color: var(--accent-color);
        background: rgba(255, 255, 255, 0.05);

        .location-icon {
          color: var(--accent-color);
          transform: scale(1.1);
        }
      }
    }

    .location-icon {
      color: var(--accent-color);
      font-size: 1.5rem;
      transition: var(--transition);
      flex-shrink: 0;
    }

    .address-text {
      font-size: 0.85rem;
      line-height: 1.6;
    }

    .map-hint {
      margin-top: 0.75rem;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
      font-style: italic;
    }

    .newsletter-form {
      display: flex;
      gap: 0;

      input {
        flex: 1;
        padding: 0.875rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-right: none;
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-light);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;

        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        &:focus {
          outline: none;
          border-color: var(--accent-color);
        }
      }

      .btn {
        padding: 0.875rem 1.25rem;
        border: 1px solid var(--accent-color);

        .material-icons {
          font-size: 1.25rem;
        }
      }
    }

    .footer-bottom {
      padding: 1.75rem 0;
    }

    .footer-bottom-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;

      p {
        margin: 0;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.8rem;
        letter-spacing: 0.5px;
      }
    }

    .footer-links {
      display: flex;
      gap: 2rem;

      a {
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.8rem;
        letter-spacing: 0.5px;

        &:hover {
          color: var(--accent-color);
        }
      }
    }

    .payment-methods {
      display: flex;
      align-items: center;
      gap: 1rem;

      span {
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.8rem;
        letter-spacing: 0.5px;
      }
    }

    .payment-icons {
      display: flex;
      align-items: center;
      gap: 1rem;

      img {
        filter: brightness(0) invert(1);
        opacity: 0.5;
        transition: var(--transition);

        &:hover {
          opacity: 0.8;
        }
      }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: #fff;
      color: var(--primary-color);
      max-width: 700px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      border-radius: 8px;
      position: relative;
      animation: modalSlideIn 0.3s ease;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--primary-color);
      opacity: 0.6;
      transition: var(--transition);
      z-index: 1;

      &:hover {
        opacity: 1;
      }
    }

    .modal-body {
      padding: 2.5rem;

      h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }

      h3 {
        font-size: 1.1rem;
        margin: 1.5rem 0 0.75rem;
        color: var(--primary-color);
      }

      h4 {
        font-size: 0.95rem;
        margin-bottom: 0.25rem;
        color: var(--primary-color);
      }

      p {
        color: #555;
        line-height: 1.7;
        margin-bottom: 0.75rem;
      }

      ul {
        color: #555;
        margin-left: 1.25rem;
        line-height: 1.8;

        li {
          margin-bottom: 0.5rem;
        }
      }

      a {
        color: var(--accent-color);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    /* Contact Modal */
    .contact-details {
      display: grid;
      gap: 1.5rem;
    }

    .contact-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 8px;

      .material-icons {
        color: var(--accent-color);
        font-size: 1.5rem;
      }

      p {
        margin: 0;
      }
    }

    /* FAQ Modal */
    .faq-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .faq-item {
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: var(--transition);

      &:hover {
        border-color: var(--accent-color);
      }
    }

    .faq-question {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      font-weight: 500;
      background: rgba(0, 0, 0, 0.02);

      .material-icons {
        color: var(--accent-color);
      }
    }

    .faq-answer {
      padding: 1rem 1.25rem;
      padding-top: 0;
      color: #555;
      line-height: 1.7;
      background: #fff;
    }

    /* Size Guide */
    .size-intro {
      margin-bottom: 1.5rem;
    }

    .size-tables {
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 2rem;

        th, td {
          padding: 0.75rem 1rem;
          text-align: center;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        th {
          background: var(--primary-color);
          color: #fff;
          font-weight: 500;
        }

        tr:nth-child(even) td {
          background: rgba(0, 0, 0, 0.02);
        }
      }
    }

    /* Shipping & Info Sections */
    .info-section {
      h3:first-child {
        margin-top: 0;
      }
    }

    .shipping-option {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      margin-bottom: 0.75rem;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 8px;

      .material-icons {
        color: var(--accent-color);
        font-size: 1.5rem;
      }

      h4 {
        margin-bottom: 0.25rem;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
      }
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .footer-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 2.5rem;
      }

      .brand-col {
        grid-column: span 3;
        text-align: center;
        padding-bottom: 2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);

        .footer-logo::after {
          left: 50%;
          transform: translateX(-50%);
        }

        .social-links {
          justify-content: center;
        }
      }

      .newsletter-col {
        grid-column: span 3;
        text-align: center;
      }

      .newsletter-form {
        max-width: 400px;
        margin: 0 auto;
      }
    }

    @media (max-width: 768px) {
      .footer-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .brand-col {
        grid-column: span 2;
      }

      .newsletter-col {
        grid-column: span 2;
      }

      .footer-bottom-content {
        flex-direction: column;
        text-align: center;
      }

      .footer-links {
        flex-wrap: wrap;
        justify-content: center;
      }
    }

    @media (max-width: 576px) {
      .footer-grid {
        grid-template-columns: 1fr;
      }

      .brand-col,
      .newsletter-col {
        grid-column: span 1;
      }

      .newsletter-form {
        flex-direction: column;
      }
    }
  `]
})
export class FooterComponent {
  email = '';
  currentYear = new Date().getFullYear();
  activeModal: string | null = null;

  faqs = [
    { question: 'How do I track my order?', answer: 'Once your order is shipped, you will receive an email with tracking details. You can also track your order from the "Orders" section in your account.', open: false },
    { question: 'What payment methods do you accept?', answer: 'We accept all major credit/debit cards, UPI, net banking, and Cash on Delivery (COD). All payments are securely processed.', open: false },
    { question: 'How long does delivery take?', answer: 'Standard delivery takes 5-7 business days. Express delivery (2-3 days) and same-day delivery are available in select cities.', open: false },
    { question: 'Can I modify or cancel my order?', answer: 'Orders can be modified or cancelled within 24 hours of placing them. Contact our support team for assistance.', open: false },
    { question: 'What is your return policy?', answer: 'We offer 15-day hassle-free returns. Items must be unused with original tags attached. Refunds are processed within 5-7 business days.', open: false },
    { question: 'How do I find my size?', answer: 'Refer to our Size Guide for detailed measurements. If you\'re between sizes, we recommend going for the larger size for a comfortable fit.', open: false }
  ];

  onSubscribe(event: Event): void {
    event.preventDefault();
    if (this.email) {
      console.log('Subscribing:', this.email);
      this.email = '';
      alert('Thank you for subscribing!');
    }
  }

  openModal(modalType: string): void {
    this.activeModal = modalType;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.activeModal = null;
    document.body.style.overflow = '';
  }

  toggleFaq(faq: any): void {
    faq.open = !faq.open;
  }
}
