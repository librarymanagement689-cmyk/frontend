import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendBook, BookPaginatedResponse } from '../models/book.model';
import { environment } from '../../environments/environment';

export interface BookCreatePayload {
  serial_number: string;
  title: string;
  author: string;
  author_alias?: string;
  price: number;
  category: string;
  language: string;
  publish_on_website: boolean;
  image_url?: string;
}



export interface BookUpdatePayload {
  serial_number?: string;
  title?: string;
  author?: string;
  author_alias?: string;
  price?: number;
  category?: string;
  language?: string;
  status?: 'available' | 'borrowed';
  publish_on_website?: boolean;
  image_url?: string | null;
}

export interface CSVImportSummaryResponse {
  total_rows: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminBookService {
  private http = inject(HttpClient);

  getAuthors(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/admin/books/authors`);
  }

  getBooks(
    search?: string,
    category?: string,
    language?: string,
    status?: string,
    publish_on_website?: boolean,
    page = 1,
    limit = 20,
    serial_number?: string,
    author?: string
  ): Observable<BookPaginatedResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim()) params = params.set('search', search.trim());

    if (serial_number && serial_number.trim()) {
      params = params.set('serial_number', serial_number.trim());
    }

    if (author && author.trim()) {
      params = params.set('author', author.trim());
    }

    if (category) params = params.set('category', category);
    if (language) params = params.set('language', language);
    if (status) params = params.set('status', status);
    if (publish_on_website !== undefined && publish_on_website !== null) {
      params = params.set('publish_on_website', publish_on_website.toString());
    }

    return this.http.get<BookPaginatedResponse>(`${environment.apiUrl}/admin/books`, { params });
  }

  getBookById(book_id: string): Observable<BackendBook> {
    return this.http.get<BackendBook>(`${environment.apiUrl}/admin/books/${book_id}`);
  }

  exportBooksCSV(
    fields: string[],
    search?: string,
    author?: string,
    serialNumber?: string,
    category?: string,
    language?: string,
    status?: string,
    publishOnWebsite?: boolean
  ): Observable<Blob> {

    let params = new HttpParams()
      .set('fields', fields.join(','));

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (author && author.trim()) {
      params = params.set('author', author.trim());
    }

    if (serialNumber && serialNumber.trim()) {
      params = params.set('serial_number', serialNumber.trim());
    }

    if (category) {
      params = params.set('category', category);
    }

    if (language) {
      params = params.set('language', language);
    }

    if (status) {
      params = params.set('status', status);
    }

    if (publishOnWebsite !== undefined && publishOnWebsite !== null) {
      params = params.set(
        'publish_on_website',
        publishOnWebsite.toString()
      );
    }

    return this.http.get(
      `${environment.apiUrl}/admin/books/export`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  exportBooksWord(): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/admin/books/export-word`, {
      responseType: 'blob'
    });
  }

  createBook(data: BookCreatePayload): Observable<BackendBook> {
    return this.http.post<BackendBook>(`${environment.apiUrl}/admin/books`, data);
  }

  updateBook(book_id: string, data: BookUpdatePayload): Observable<BackendBook> {
    return this.http.put<BackendBook>(`${environment.apiUrl}/admin/books/${book_id}`, data);
  }

  deleteBook(book_id: string): Observable<{ message: string; success: boolean }> {
    return this.http.delete<{ message: string; success: boolean }>(`${environment.apiUrl}/admin/books/${book_id}`);
  }

  uploadCoverImage(file: File): Observable<{ image_url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ image_url: string; filename: string }>(`${environment.apiUrl}/admin/books/upload-image`, formData);
  }

  removeCoverImage(book_id: string): Observable<{ message: string; success: boolean }> {
    return this.http.delete<{ message: string; success: boolean }>(`${environment.apiUrl}/admin/books/${book_id}/image`);
  }

  importBooksCSV(file: File, previewOnly = false): Observable<CSVImportSummaryResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const params = new HttpParams().set('preview', previewOnly.toString());
    return this.http.post<CSVImportSummaryResponse>(`${environment.apiUrl}/admin/books/import`, formData, { params });
  }

  getBookBorrowingHistory(book_id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/books/${book_id}/history`);
  }
}
