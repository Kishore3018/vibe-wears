import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminCategory } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="categories-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h2>Categories</h2>
          <span class="total-count">{{ categories().length }} categories</span>
        </div>
        <button class="btn btn-primary" (click)="openModal()">
          <span class="material-icons">add</span>
          Add Category
        </button>
      </div>

      <!-- Categories Grid -->
      <div class="categories-grid">
        @for (category of categories(); track category.id) {
          <div class="category-card">
            <div class="category-image">
              @if (category.image_url) {
                <img [src]="category.image_url" [alt]="category.name">
              } @else {
                <div class="placeholder">
                  <span class="material-icons">category</span>
                </div>
              }
            </div>
            <div class="category-content">
              <h3>{{ category.name }}</h3>
              <p class="category-slug">{{ category.slug }}</p>
              @if (category.description) {
                <p class="category-desc">{{ category.description }}</p>
              }
              <div class="category-meta">
                <span class="product-count">{{ category.product_count || 0 }} products</span>
                <span class="status-badge" [class.active]="category.is_active">
                  {{ category.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            <div class="category-actions">
              <button class="action-btn" (click)="editCategory(category)" title="Edit">
                <span class="material-icons">edit</span>
              </button>
              <button class="action-btn" (click)="toggleStatus(category)" [title]="category.is_active ? 'Deactivate' : 'Activate'">
                <span class="material-icons">{{ category.is_active ? 'visibility_off' : 'visibility' }}</span>
              </button>
              <button class="action-btn delete" (click)="deleteCategory(category)" title="Delete">
                <span class="material-icons">delete</span>
              </button>
            </div>
          </div>
        }
      </div>

      @if (categories().length === 0) {
        <div class="empty-state">
          <span class="material-icons">category</span>
          <h3>No categories yet</h3>
          <p>Create your first category to organize products</p>
          <button class="btn btn-primary" (click)="openModal()">Add Category</button>
        </div>
      }

      <!-- Category Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingCategory() ? 'Edit Category' : 'Add New Category' }}</h3>
              <button class="close-btn" (click)="closeModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <form (submit)="saveCategory($event)">
                <div class="form-group">
                  <label>Category Name *</label>
                  <input type="text" [(ngModel)]="formData.name" name="name" required (input)="generateSlug()">
                </div>
                <div class="form-group">
                  <label>Slug *</label>
                  <input type="text" [(ngModel)]="formData.slug" name="slug" required>
                </div>
                <div class="form-group">
                  <label>Description</label>
                  <textarea rows="3" [(ngModel)]="formData.description" name="description"></textarea>
                </div>
                <div class="form-group">
                  <label>Image URL</label>
                  <input type="url" [(ngModel)]="formData.image_url" name="image_url" placeholder="https://...">
                  @if (formData.image_url) {
                    <div class="image-preview">
                      <img [src]="formData.image_url" alt="Preview">
                    </div>
                  }
                </div>
                <div class="form-group">
                  <label>Parent Category</label>
                  <select [(ngModel)]="formData.parent_id" name="parent_id">
                    <option [value]="null">None (Top Level)</option>
                    @for (cat of categories(); track cat.id) {
                      @if (!editingCategory() || cat.id !== editingCategory()?.id) {
                        <option [value]="cat.id">{{ cat.name }}</option>
                      }
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Display Order</label>
                  <input type="number" [(ngModel)]="formData.display_order" name="display_order" min="0">
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
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                  <button type="submit" class="btn btn-primary" [disabled]="saving()">
                    {{ saving() ? 'Saving...' : (editingCategory() ? 'Update Category' : 'Create Category') }}
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
    .categories-page {
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

      .material-icons { font-size: 1.25rem; }
    }

    .btn-primary {
      background: #6366f1;
      color: #fff;
      &:hover { background: #4f46e5; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;
      &:hover { background: #e5e7eb; }
    }

    /* Categories Grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }

    .category-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .category-image {
      height: 140px;
      background: #f9fafb;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        .material-icons {
          font-size: 3rem;
          color: #d1d5db;
        }
      }
    }

    .category-content {
      padding: 1rem;
      flex: 1;

      h3 {
        margin: 0 0 0.25rem;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1f2937;
      }

      .category-slug {
        font-size: 0.8rem;
        color: #9ca3af;
        margin: 0 0 0.5rem;
      }

      .category-desc {
        font-size: 0.85rem;
        color: #6b7280;
        margin: 0 0 0.75rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .category-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .product-count {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 500;
      background: #fee2e2;
      color: #991b1b;

      &.active {
        background: #d1fae5;
        color: #065f46;
      }
    }

    .category-actions {
      display: flex;
      border-top: 1px solid #f3f4f6;
      padding: 0.5rem;
      gap: 0.25rem;
      justify-content: flex-end;
    }

    .action-btn {
      width: 34px;
      height: 34px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      .material-icons { font-size: 1.1rem; color: #6b7280; }
      &:hover { background: #f3f4f6; }
      &.delete:hover {
        background: #fee2e2;
        .material-icons { color: #ef4444; }
      }
    }

    .empty-state {
      background: #fff;
      border-radius: 12px;
      padding: 4rem 2rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

      .material-icons { font-size: 4rem; color: #d1d5db; margin-bottom: 1rem; }
      h3 { margin: 0 0 0.5rem; color: #374151; }
      p { color: #9ca3af; margin: 0 0 1.5rem; }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
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
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }

      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #6b7280;
        &:hover { color: #1f2937; }
      }
    }

    .modal-body {
      padding: 1.25rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding-top: 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.375rem;
      }

      input, select, textarea {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;

        &:focus { outline: none; border-color: #6366f1; }
      }
    }

    .image-preview {
      margin-top: 0.5rem;
      border-radius: 8px;
      overflow: hidden;
      max-height: 150px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .form-row.checkboxes {
      display: flex;
      gap: 1.5rem;
      margin-top: 0.5rem;
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

    @media (max-width: 640px) {
      .categories-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  private adminService = inject(AdminService);

  categories = signal<AdminCategory[]>([]);
  showModal = signal(false);
  editingCategory = signal<AdminCategory | null>(null);
  saving = signal(false);

  formData = this.getEmptyForm();

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.adminService.getCategories({ include_inactive: true }).subscribe({
      next: (res) => this.categories.set(res.items),
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  getEmptyForm() {
    return {
      name: '',
      slug: '',
      description: '',
      image_url: '',
      parent_id: null as number | null,
      display_order: 0,
      is_active: true,
      is_featured: false
    };
  }

  openModal(): void {
    this.editingCategory.set(null);
    this.formData = this.getEmptyForm();
    this.showModal.set(true);
  }

  editCategory(category: AdminCategory): void {
    this.editingCategory.set(category);
    this.formData = {
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      parent_id: category.parent_id,
      display_order: category.display_order || 0,
      is_active: category.is_active,
      is_featured: category.is_featured || false
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCategory.set(null);
  }

  generateSlug(): void {
    if (!this.editingCategory()) {
      this.formData.slug = this.formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  }

  saveCategory(event: Event): void {
    event.preventDefault();
    this.saving.set(true);

    const data = { ...this.formData };
    if (!data.parent_id) {
      delete (data as any).parent_id;
    }

    const request = this.editingCategory()
      ? this.adminService.updateCategory(this.editingCategory()!.id, data)
      : this.adminService.createCategory(data);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadCategories();
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error saving category:', err);
        alert(err.error?.detail || 'Error saving category');
        this.saving.set(false);
      }
    });
  }

  toggleStatus(category: AdminCategory): void {
    this.adminService.updateCategory(category.id, { is_active: !category.is_active }).subscribe({
      next: () => this.loadCategories(),
      error: (err) => console.error('Error updating status:', err)
    });
  }

  deleteCategory(category: AdminCategory): void {
    if (confirm(`Are you sure you want to delete "${category.name}"? This may affect associated products.`)) {
      this.adminService.deleteCategory(category.id).subscribe({
        next: () => this.loadCategories(),
        error: (err) => {
          console.error('Error deleting category:', err);
          alert(err.error?.detail || 'Error deleting category');
        }
      });
    }
  }
}
