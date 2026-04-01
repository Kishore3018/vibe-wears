import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="not-found-page">
      <div class="container">
        <div class="not-found-content">
          <div class="error-code">404</div>
          <h1>Page Not Found</h1>
          <p>Oops! The page you're looking for doesn't exist or has been moved.</p>
          
          <div class="actions">
            <a routerLink="/" class="btn btn-primary">
              <span class="material-icons">home</span>
              Go Home
            </a>
            <a routerLink="/products" class="btn btn-outline">
              <span class="material-icons">shopping_bag</span>
              Browse Products
            </a>
          </div>

          <div class="helpful-links">
            <h3>Helpful Links</h3>
            <ul>
              <li><a routerLink="/products" [queryParams]="{category: 'casual'}">Casual Collection</a></li>
              <li><a routerLink="/products" [queryParams]="{category: 'formal'}">Formal Collection</a></li>
              <li><a routerLink="/products" [queryParams]="{is_new_arrival: true}">New Arrivals</a></li>
              <li><a routerLink="/products" [queryParams]="{is_featured: true}">Best Sellers</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-page {
      min-height: calc(100vh - 200px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4rem 1rem;
      background-color: var(--bg-secondary);
    }

    .not-found-content {
      text-align: center;
      max-width: 500px;
    }

    .error-code {
      font-size: 8rem;
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, var(--accent-color), var(--secondary-color));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }

    p {
      color: var(--text-secondary);
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 3rem;

      .btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .helpful-links {
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);

      h3 {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }

      ul {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem 2rem;
      }

      a {
        color: var(--accent-color);
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    @media (max-width: 576px) {
      .error-code {
        font-size: 5rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      .actions {
        flex-direction: column;

        .btn {
          width: 100%;
          justify-content: center;
        }
      }
    }
  `]
})
export class NotFoundComponent {}
