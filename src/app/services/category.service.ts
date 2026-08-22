import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    Category,
    CategoryCreate,
    CategoryUpdate,
    CategoryPaginatedResponse
} from '../models/book.model';

import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {

    private http = inject(HttpClient);

    getCategories(
        activeOnly = true
    ): Observable<CategoryPaginatedResponse> {

        const params = new HttpParams()
            .set('active_only', activeOnly.toString());

        return this.http.get<CategoryPaginatedResponse>(
            `${environment.apiUrl}/categories`,
            { params }
        );
    }

    getAdminCategories(
        activeOnly = false
    ): Observable<CategoryPaginatedResponse> {

        const params = new HttpParams()
            .set('active_only', activeOnly.toString());

        return this.http.get<CategoryPaginatedResponse>(
            `${environment.apiUrl}/admin/categories`,
            { params }
        );
    }

    createCategory(
        data: CategoryCreate
    ): Observable<Category> {

        return this.http.post<Category>(
            `${environment.apiUrl}/admin/categories`,
            data
        );
    }

    updateCategory(
        categoryId: string,
        data: CategoryUpdate
    ): Observable<Category> {

        return this.http.put<Category>(
            `${environment.apiUrl}/admin/categories/${categoryId}`,
            data
        );
    }

    deleteCategory(
        categoryId: string
    ): Observable<{ message: string; success: boolean }> {

        return this.http.delete<{ message: string; success: boolean }>(
            `${environment.apiUrl}/admin/categories/${categoryId}`
        );
    }
}