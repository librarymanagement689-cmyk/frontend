import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
    Category,
    CategoryCreate
} from '../../../models/book.model';

import { CategoryService } from '../../../services/category.service';
import { ErrorService } from '../../../services/error.service';
import { ToastService } from '../../../services/toast.service';

@Component({
    selector: 'app-admin-categories',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-categories.component.html',
    styleUrl: './admin-categories.component.scss'
})
export class AdminCategoriesComponent implements OnInit {

    private categoryService = inject(CategoryService);
    private errorService = inject(ErrorService);
    private toastService = inject(ToastService);

    // ─────────────────────────────────────────────
    // Data
    // ─────────────────────────────────────────────

    categories = signal<Category[]>([]);

    isLoading = signal(true);

    // ─────────────────────────────────────────────
    // Search / Filter
    // ─────────────────────────────────────────────

    searchQuery = '';
    showInactive = false;

    // ─────────────────────────────────────────────
    // Modal
    // ─────────────────────────────────────────────

    isModalOpen = signal(false);
    isEditing = signal(false);

    editingCategoryId = signal<string | null>(null);

    // ─────────────────────────────────────────────
    // Form
    // ─────────────────────────────────────────────

    categoryForm: CategoryCreate = {
        name: '',
        description: '',
        is_active: true
    };

    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────

    ngOnInit(): void {
        this.loadCategories();
    }

    // ─────────────────────────────────────────────
    // Load
    // ─────────────────────────────────────────────

    loadCategories(): void {
        this.isLoading.set(true);

        this.categoryService
            .getAdminCategories(this.showInactive ? false : true)
            .subscribe({
                next: (response) => {
                    this.categories.set(response.items);
                    this.isLoading.set(false);
                },

                error: (err) => {
                    this.isLoading.set(false);

                    this.toastService.error(
                        this.errorService.getErrorMessage(err)
                    );
                }
            });
    }

    // ─────────────────────────────────────────────
    // Search
    // ─────────────────────────────────────────────

    onSearch(): void {
        this.loadCategories();
    }

    // ─────────────────────────────────────────────
    // Toggle inactive
    // ─────────────────────────────────────────────

    toggleInactive(): void {
        this.showInactive = !this.showInactive;
        this.loadCategories();
    }

    // ─────────────────────────────────────────────
    // Add
    // ─────────────────────────────────────────────

    openAddModal(): void {

        this.isEditing.set(false);
        this.editingCategoryId.set(null);

        this.categoryForm = {
            name: '',
            description: '',
            is_active: true
        };

        this.isModalOpen.set(true);
    }

    // ─────────────────────────────────────────────
    // Edit
    // ─────────────────────────────────────────────

    openEditModal(category: Category): void {

        this.isEditing.set(true);

        this.editingCategoryId.set(
            category.category_id || category.id
        );

        this.categoryForm = {
            name: category.name,
            description: category.description || '',
            is_active: category.is_active ?? true
        };

        this.isModalOpen.set(true);
    }

    // ─────────────────────────────────────────────
    // Close modal
    // ─────────────────────────────────────────────

    closeModal(): void {
        this.isModalOpen.set(false);
        this.editingCategoryId.set(null);
    }

    // ─────────────────────────────────────────────
    // Save
    // ─────────────────────────────────────────────

    saveCategory(): void {

        const name = this.categoryForm.name.trim();

        if (!name) {
            this.toastService.error(
                'Category name is required.'
            );
            return;
        }

        this.categoryForm = {
            ...this.categoryForm,
            name
        };

        // EDIT
        if (this.isEditing() && this.editingCategoryId()) {

            this.categoryService
                .updateCategory(
                    this.editingCategoryId()!,
                    this.categoryForm
                )
                .subscribe({

                    next: () => {

                        this.toastService.success(
                            'Category updated successfully.'
                        );

                        this.closeModal();
                        this.loadCategories();
                    },

                    error: (err) => {

                        this.toastService.error(
                            this.errorService.getErrorMessage(err)
                        );
                    }
                });

            return;
        }

        // CREATE
        this.categoryService
            .createCategory(this.categoryForm)
            .subscribe({

                next: () => {

                    this.toastService.success(
                        'Category created successfully.'
                    );

                    this.closeModal();
                    this.loadCategories();
                },

                error: (err) => {

                    this.toastService.error(
                        this.errorService.getErrorMessage(err)
                    );
                }
            });
    }

    // ─────────────────────────────────────────────
    // Delete / Deactivate
    // ─────────────────────────────────────────────

    deleteCategory(category: Category): void {

        const categoryId =
            category.category_id || category.id;

        const bookCount = category.book_count ?? 0;

        let message = `Are you sure you want to deactivate "${category.name}"?`;

        if (bookCount > 0) {
            message =
                `"${category.name}" is currently used by ${bookCount} book(s).\n\n` +
                `It will be deactivated instead of deleted.\n\n` +
                `Continue?`;
        }

        if (!confirm(message)) {
            return;
        }

        this.categoryService
            .deleteCategory(categoryId)
            .subscribe({

                next: (response) => {

                    this.toastService.success(
                        response.message
                    );

                    this.loadCategories();
                },

                error: (err) => {

                    this.toastService.error(
                        this.errorService.getErrorMessage(err)
                    );
                }
            });
    }

    // ─────────────────────────────────────────────
    // Track
    // ─────────────────────────────────────────────

    trackCategory(
        _: number,
        category: Category
    ): string {

        return category.category_id || category.id;
    }
}