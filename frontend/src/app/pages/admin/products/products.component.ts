import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminProduct, AdminCategory } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="products-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h2>Products</h2>
          <span class="total-count">{{ total() }} products</span>
        </div>
        <button class="btn btn-primary" (click)="openProductModal()">
          <span class="material-icons">add</span>
          Add Product
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <span class="material-icons">search</span>
          <input 
            type="text" 
            placeholder="Search products..." 
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
          >
        </div>
        <div class="filter-group">
          <select [(ngModel)]="filterCategory" (change)="loadProducts()">
            <option value="">All Categories</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
          <select [(ngModel)]="filterStatus" (change)="loadProducts()">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select [(ngModel)]="filterFeatured" (change)="loadProducts()">
            <option value="">All Products</option>
            <option value="true">Featured</option>
            <option value="low_stock">Low Stock</option>
          </select>
        </div>
      </div>

      <!-- Products Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (product of products(); track product.id) {
              <tr>
                <td>
                  <div class="product-cell">
                    <img [src]="getProductImage(product)" [alt]="product.name">
                    <div class="product-info">
                      <span class="product-name">{{ product.name }}</span>
                      <span class="product-categories">
                        @for (cat of product.categories; track cat.id) {
                          <span class="category-tag">{{ cat.name }}</span>
                        }
                      </span>
                    </div>
                  </div>
                </td>
                <td>{{ product.sku || '-' }}</td>
                <td>
                  <div class="price-cell">
                    <span class="current-price">{{ product.price | currency:'INR':'symbol':'1.0-0' }}</span>
                    @if (product.compare_price) {
                      <span class="compare-price">{{ product.compare_price | currency:'INR':'symbol':'1.0-0' }}</span>
                    }
                  </div>
                </td>
                <td>
                  <span class="stock-badge" [class.low]="product.quantity <= product.low_stock_threshold">
                    {{ product.quantity }}
                  </span>
                </td>
                <td>
                  <div class="status-badges">
                    <span class="status-badge" [class.active]="product.is_active">
                      {{ product.is_active ? 'Active' : 'Inactive' }}
                    </span>
                    @if (product.is_featured) {
                      <span class="featured-badge">Featured</span>
                    }
                  </div>
                </td>
                <td>
                  <div class="actions">
                    <button class="action-btn" (click)="editProduct(product)" title="Edit">
                      <span class="material-icons">edit</span>
                    </button>
                    <button class="action-btn" (click)="toggleStatus(product)" [title]="product.is_active ? 'Deactivate' : 'Activate'">
                      <span class="material-icons">{{ product.is_active ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                    <button class="action-btn delete" (click)="deleteProduct(product)" title="Delete">
                      <span class="material-icons">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (products().length === 0) {
          <div class="empty-state">
            <span class="material-icons">inventory_2</span>
            <h3>No products found</h3>
            <p>Add your first product to get started</p>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (total() > limit) {
        <div class="pagination">
          <button [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
            <span class="material-icons">chevron_left</span>
          </button>
          <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
          <button [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
      }

      <!-- Product Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingProduct() ? 'Edit Product' : 'Add New Product' }}</h3>
              <button class="close-btn" (click)="closeModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <form (submit)="saveProduct($event)">
                <div class="form-row">
                  <div class="form-group">
                    <label>Product Name *</label>
                    <input type="text" [(ngModel)]="formData.name" name="name" required>
                  </div>
                  <div class="form-group">
                    <label>Slug *</label>
                    <input type="text" [(ngModel)]="formData.slug" name="slug" required>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Price *</label>
                    <input type="number" [(ngModel)]="formData.price" name="price" required min="0">
                  </div>
                  <div class="form-group">
                    <label>Compare Price</label>
                    <input type="number" [(ngModel)]="formData.compare_price" name="compare_price" min="0">
                  </div>
                  <div class="form-group">
                    <label>Cost Price</label>
                    <input type="number" [(ngModel)]="formData.cost_price" name="cost_price" min="0">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>SKU</label>
                    <input type="text" [(ngModel)]="formData.sku" name="sku">
                  </div>
                  <div class="form-group">
                    <label>Stock Quantity</label>
                    <input type="number" [(ngModel)]="formData.quantity" name="quantity" min="0">
                  </div>
                  <div class="form-group">
                    <label>Low Stock Threshold</label>
                    <input type="number" [(ngModel)]="formData.low_stock_threshold" name="low_stock_threshold" min="0">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Brand</label>
                    <input type="text" [(ngModel)]="formData.brand" name="brand">
                  </div>
                  <div class="form-group">
                    <label>Material</label>
                    <input type="text" [(ngModel)]="formData.material" name="material">
                  </div>
                </div>

                <div class="form-group">
                  <label>Short Description</label>
                  <input type="text" [(ngModel)]="formData.short_description" name="short_description">
                </div>

                <div class="form-group">
                  <label>Description</label>
                  <textarea rows="4" [(ngModel)]="formData.description" name="description"></textarea>
                </div>

                <div class="form-group">
                  <label>Categories</label>
                  <div class="checkbox-group">
                    @for (cat of categories(); track cat.id) {
                      <label class="checkbox-label">
                        <input 
                          type="checkbox" 
                          [checked]="formData.category_ids.includes(cat.id)"
                          (change)="toggleCategory(cat.id)"
                        >
                        {{ cat.name }}
                      </label>
                    }
                  </div>
                </div>

                <div class="form-row checkboxes">
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="formData.is_active" name="is_active">
                    Active
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="formData.is_featured" name="is_featured">
                    Featured
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="formData.is_new_arrival" name="is_new_arrival">
                    New Arrival
                  </label>
                </div>

                <!-- Images Section -->
                <div class="form-section">
                  <h4>Product Images</h4>
                  <div class="images-grid">
                    @for (img of formData.images; track $index) {
                      <div class="image-item">
                        <img [src]="img.image_url" alt="Product image">
                        <button type="button" class="remove-btn" (click)="removeImage($index)">
                          <span class="material-icons">close</span>
                        </button>
                      </div>
                    }
                    <div class="add-image" (click)="fileInput.click()">
                      @if (uploadingImage()) {
                        <div class="spinner-small"></div>
                        <span>Uploading...</span>
                      } @else {
                        <span class="material-icons">add_photo_alternate</span>
                        <span>Upload Image</span>
                      }
                    </div>
                    <input type="file" #fileInput hidden accept="image/*" (change)="onImageSelected($event)">
                  </div>
                </div>

                <!-- Variants Section -->
                <div class="form-section">
                  <div class="section-header">
                    <h4>Product Variants</h4>
                    <button type="button" class="btn btn-sm" (click)="addVariant()">
                      <span class="material-icons">add</span> Add Variant
                    </button>
                  </div>
                  @if (formData.variants.length > 0) {
                    <div class="variants-list">
                      @for (variant of formData.variants; track $index) {
                        <div class="variant-row">
                          <input type="text" placeholder="Size" [(ngModel)]="variant.size" [ngModelOptions]="{standalone: true}">
                          <input type="text" placeholder="Color" [(ngModel)]="variant.color" [ngModelOptions]="{standalone: true}">
                          <input type="text" placeholder="Color Code" [(ngModel)]="variant.color_code" [ngModelOptions]="{standalone: true}">
                          <input type="number" placeholder="Stock" [(ngModel)]="variant.quantity" [ngModelOptions]="{standalone: true}">
                          <input type="number" placeholder="Price Modifier" [(ngModel)]="variant.price_modifier" [ngModelOptions]="{standalone: true}">
                          <button type="button" class="remove-variant" (click)="removeVariant($index)">
                            <span class="material-icons">delete</span>
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                  <button type="submit" class="btn btn-primary" [disabled]="saving()">
                    {{ saving() ? 'Saving...' : (editingProduct() ? 'Update Product' : 'Create Product') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .products-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .total-count {
      background: #f3f4f6;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      color: #6b7280;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;

      .material-icons {
        font-size: 1.25rem;
      }
    }

    .btn-primary {
      background: #6366f1;
      color: #fff;

      &:hover {
        background: #4f46e5;
      }
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;

      &:hover {
        background: #e5e7eb;
      }
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8rem;

      .material-icons {
        font-size: 1rem;
      }
    }

    /* Filters */
    .filters-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #fff;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .search-box {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f9fafb;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      .material-icons {
        color: #9ca3af;
      }

      input {
        flex: 1;
        border: none;
        background: none;
        font-size: 0.9rem;
        outline: none;
      }
    }

    .filter-group {
      display: flex;
      gap: 0.75rem;

      select {
        padding: 0.5rem 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;
        background: #fff;
        cursor: pointer;

        &:focus {
          outline: none;
          border-color: #6366f1;
        }
      }
    }

    /* Table */
    .table-container {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      overflow: hidden;

      table {
        width: 100%;
        border-collapse: collapse;

        th, td {
          padding: 1rem;
          text-align: left;
        }

        th {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        td {
          border-bottom: 1px solid #f3f4f6;
        }

        tbody tr:hover {
          background: #f9fafb;
        }
      }
    }

    .product-cell {
      display: flex;
      align-items: center;
      gap: 0.875rem;

      img {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        object-fit: cover;
      }
    }

    .product-info {
      display: flex;
      flex-direction: column;
    }

    .product-name {
      font-weight: 500;
      color: #1f2937;
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-categories {
      display: flex;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }

    .category-tag {
      font-size: 0.7rem;
      padding: 0.125rem 0.375rem;
      background: #f3f4f6;
      color: #6b7280;
      border-radius: 4px;
    }

    .price-cell {
      display: flex;
      flex-direction: column;
    }

    .current-price {
      font-weight: 600;
      color: #1f2937;
    }

    .compare-price {
      font-size: 0.8rem;
      color: #9ca3af;
      text-decoration: line-through;
    }

    .stock-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      background: #d1fae5;
      color: #065f46;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;

      &.low {
        background: #fee2e2;
        color: #991b1b;
      }
    }

    .status-badges {
      display: flex;
      gap: 0.5rem;
    }

    .status-badge {
      padding: 0.25rem 0.625rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #f3f4f6;
      color: #6b7280;

      &.active {
        background: #d1fae5;
        color: #065f46;
      }
    }

    .featured-badge {
      padding: 0.25rem 0.625rem;
      background: #fef3c7;
      color: #92400e;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .actions {
      display: flex;
      gap: 0.375rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f3f4f6;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      .material-icons {
        font-size: 1.1rem;
        color: #6b7280;
      }

      &:hover {
        background: #e5e7eb;
      }

      &.delete:hover {
        background: #fee2e2;
        .material-icons { color: #ef4444; }
      }
    }

    .empty-state {
      padding: 4rem 2rem;
      text-align: center;

      .material-icons {
        font-size: 4rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }

      h3 {
        margin: 0 0 0.5rem;
        color: #374151;
      }

      p {
        color: #9ca3af;
        margin: 0;
      }
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem;

      button {
        width: 36px;
        height: 36px;
        border: 1px solid #e5e7eb;
        background: #fff;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover:not(:disabled) {
          background: #f3f4f6;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .page-info {
        font-size: 0.9rem;
        color: #6b7280;
      }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }

    .modal-content {
      background: #fff;
      border-radius: 12px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      &.large {
        max-width: 900px;
      }
    }

    .modal-header {
      padding: 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
      }

      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #6b7280;

        &:hover {
          color: #1f2937;
        }
      }
    }

    .modal-body {
      padding: 1.25rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 1.25rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;

      &.checkboxes {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;

      label {
        font-size: 0.85rem;
        font-weight: 500;
        color: #374151;
      }

      input, select, textarea {
        padding: 0.625rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;

        &:focus {
          outline: none;
          border-color: #6366f1;
        }
      }
    }

    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
    }

    .form-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;

      h4 {
        margin: 0 0 1rem;
        font-size: 1rem;
        color: #1f2937;
      }
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h4 {
        margin: 0;
      }
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.75rem;
    }

    .image-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .remove-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 24px;
        height: 24px;
        background: rgba(0, 0, 0, 0.6);
        border: none;
        border-radius: 50%;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        .material-icons {
          font-size: 1rem;
        }
      }
    }

    .add-image {
      aspect-ratio: 1;
      border: 2px dashed #e5e7eb;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      cursor: pointer;
      color: #9ca3af;
      transition: all 0.2s;

      .material-icons {
        font-size: 1.75rem;
      }

      span:last-child {
        font-size: 0.75rem;
      }

      &:hover {
        border-color: #6366f1;
        color: #6366f1;
      }

      .spinner-small {
        width: 24px;
        height: 24px;
        border: 3px solid #e5e7eb;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .variants-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .variant-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 80px 100px 40px;
      gap: 0.5rem;
      align-items: center;

      input {
        padding: 0.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 0.85rem;

        &:focus {
          outline: none;
          border-color: #6366f1;
        }
      }

      .remove-variant {
        width: 36px;
        height: 36px;
        border: none;
        background: #fee2e2;
        border-radius: 6px;
        color: #ef4444;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        .material-icons {
          font-size: 1.1rem;
        }
      }
    }

    @media (max-width: 768px) {
      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group {
        flex-wrap: wrap;
      }

      .table-container {
        overflow-x: auto;
      }

      .variant-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class AdminProductsComponent implements OnInit {
  private adminService = inject(AdminService);

  products = signal<AdminProduct[]>([]);
  categories = signal<AdminCategory[]>([]);
  total = signal(0);
  currentPage = signal(1);
  limit = 20;
  showModal = signal(false);
  editingProduct = signal<AdminProduct | null>(null);
  saving = signal(false);

  searchQuery = '';
  filterCategory = '';
  filterStatus = '';
  filterFeatured = '';
  private searchTimeout: any;

  formData = this.getEmptyForm();

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    const params: any = {
      skip: (this.currentPage() - 1) * this.limit,
      limit: this.limit
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterCategory) params.category_id = parseInt(this.filterCategory);
    if (this.filterStatus) params.is_active = this.filterStatus === 'true';
    if (this.filterFeatured === 'true') params.is_featured = true;
    if (this.filterFeatured === 'low_stock') params.low_stock = true;

    this.adminService.getProducts(params).subscribe({
      next: (res) => {
        this.products.set(res.items);
        this.total.set(res.total);
      },
      error: (err) => console.error('Error loading products:', err)
    });
  }

  loadCategories(): void {
    this.adminService.getCategories({ include_inactive: false }).subscribe({
      next: (res) => this.categories.set(res.items),
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadProducts();
    }, 300);
  }

  totalPages(): number {
    return Math.ceil(this.total() / this.limit);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  getProductImage(product: AdminProduct): string {
    const primary = product.images?.find(img => img.is_primary);
    return primary?.image_url || product.images?.[0]?.image_url || 'https://placehold.co/50x50';
  }

  openProductModal(): void {
    this.editingProduct.set(null);
    this.formData = this.getEmptyForm();
    this.showModal.set(true);
  }

  editProduct(product: AdminProduct): void {
    this.editingProduct.set(product);
    this.formData = {
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      short_description: product.short_description || '',
      price: product.price,
      compare_price: product.compare_price || null,
      cost_price: product.cost_price || null,
      sku: product.sku || '',
      quantity: product.quantity,
      low_stock_threshold: product.low_stock_threshold,
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
      brand: product.brand || '',
      material: product.material || '',
      category_ids: product.categories?.map(c => c.id) || [],
      images: product.images?.map(img => ({ image_url: img.image_url, alt_text: img.alt_text })) || [],
      variants: product.variants?.map(v => ({
        size: v.size,
        color: v.color,
        color_code: v.color_code,
        quantity: v.quantity,
        price_modifier: v.price_modifier
      })) || []
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingProduct.set(null);
  }

  getEmptyForm() {
    return {
      name: '',
      slug: '',
      description: '',
      short_description: '',
      price: 0,
      compare_price: null as number | null,
      cost_price: null as number | null,
      sku: '',
      quantity: 0,
      low_stock_threshold: 10,
      is_active: true,
      is_featured: false,
      is_new_arrival: false,
      brand: '',
      material: '',
      category_ids: [] as number[],
      images: [] as any[],
      variants: [] as any[]
    };
  }

  toggleCategory(categoryId: number): void {
    const index = this.formData.category_ids.indexOf(categoryId);
    if (index > -1) {
      this.formData.category_ids.splice(index, 1);
    } else {
      this.formData.category_ids.push(categoryId);
    }
  }

  uploadingImage = signal(false);

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    this.uploadImage(file);
    input.value = ''; // Reset input
  }

  async uploadImage(file: File): Promise<void> {
    this.uploadingImage.set(true);
    
    try {
      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.formData.images.push({ 
          image_url: result.url, 
          alt_text: file.name 
        });
      } else {
        alert(result.error || 'Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      this.uploadingImage.set(false);
    }
  }

  addImageUrl(): void {
    const url = prompt('Enter image URL:');
    if (url) {
      this.formData.images.push({ image_url: url, alt_text: '' });
    }
  }

  removeImage(index: number): void {
    this.formData.images.splice(index, 1);
  }

  addVariant(): void {
    this.formData.variants.push({
      size: '',
      color: '',
      color_code: '',
      quantity: 0,
      price_modifier: 0
    });
  }

  removeVariant(index: number): void {
    this.formData.variants.splice(index, 1);
  }

  saveProduct(event: Event): void {
    event.preventDefault();
    this.saving.set(true);

    const data = { ...this.formData };
    
    const request = this.editingProduct()
      ? this.adminService.updateProduct(this.editingProduct()!.id, data)
      : this.adminService.createProduct(data);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadProducts();
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error saving product:', err);
        alert(err.error?.detail || 'Error saving product');
        this.saving.set(false);
      }
    });
  }

  toggleStatus(product: AdminProduct): void {
    this.adminService.updateProduct(product.id, { is_active: !product.is_active }).subscribe({
      next: () => this.loadProducts(),
      error: (err) => console.error('Error updating status:', err)
    });
  }

  deleteProduct(product: AdminProduct): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.adminService.deleteProduct(product.id).subscribe({
        next: () => this.loadProducts(),
        error: (err) => console.error('Error deleting product:', err)
      });
    }
  }
}
