import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Book, BackendBook, BookPaginatedResponse, Category, BookFilter,
  CatalogResponse, CatalogItem
} from '../models/book.model';
import { environment } from '../../environments/environment';

export function mapBackendBookToBook(b: BackendBook): Book {
  return {
    id: b.book_id,
    book_id: b.book_id,
    title: b.title,
    author: b.author,
    price: b.price,
    category: b.category,
    language: b.language,
    status: b.status,
    available: b.status === 'available',
    publish_on_website: b.publish_on_website,
    imageUrl: b.image_url || undefined,
    image_url: b.image_url || undefined,
    created_at: b.created_at,
    updated_at: b.updated_at,
    // Series fields
    series_name: b.series_name,
    volume_number: b.volume_number,
    total_volumes: b.total_volumes,
    part_or_volume: b.part_or_volume,
  };
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);

  /** GET /api/books with optional search, category, language, status, page, limit */
  getPublicBooks(
    filter?: BookFilter,
    page = 1,
    limit = 20
  ): Observable<BookPaginatedResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filter?.query && filter.query.trim()) {
      params = params.set('search', filter.query.trim());
    }
    if (filter?.category && filter.category !== 'All') {
      params = params.set('category', filter.category);
    }
    if (filter?.language && filter.language !== 'All') {
      params = params.set('language', filter.language);
    }

    return this.http.get<BookPaginatedResponse>(`${environment.apiUrl}/books`, { params });
  }

  /**
   * GET /api/books/catalog — returns grouped catalog:
   * series groups (type='series') + standalone books (type='book').
   * Used ONLY by the public website books page.
   */
  getPublicCatalog(
    filter?: BookFilter,
    limit = 200
  ): Observable<CatalogResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString());

    if (filter?.query && filter.query.trim()) {
      params = params.set('search', filter.query.trim());
    }
    if (filter?.category && filter.category !== 'All') {
      params = params.set('category', filter.category);
    }
    if (filter?.language && filter.language !== 'All') {
      params = params.set('language', filter.language);
    }

    return this.http.get<CatalogResponse>(`${environment.apiUrl}/books/catalog`, { params }).pipe(
      catchError(() => of({ total: 0, series_count: 0, standalone_count: 0, items: [] }))
    );
  }

  /** GET /api/books/:id */
  getBookById(id: string): Observable<Book | undefined> {
    return this.http.get<BackendBook>(`${environment.apiUrl}/books/${id}`).pipe(
      map(b => mapBackendBookToBook(b)),
      catchError(() => of(undefined))
    );
  }

  /** GET featured books for Home Page */
  getFeaturedBooks(): Observable<Book[]> {
    return this.getPublicBooks({}, 1, 6).pipe(
      map(res => res.items.map(b => mapBackendBookToBook(b))),
      catchError(() => of([]))
    );
  }

  /** GET category list aggregated or default list */
  getCategories(): Observable<Category[]> {
    return this.getPublicBooks({}, 1, 100).pipe(
      map(res => {

        const countMap = res.items.reduce(
          (acc, book) => {

            const category = book.category?.trim();

            if (category) {
              acc[category] = (acc[category] ?? 0) + 1;
            }

            return acc;

          },
          {} as Record<string, number>
        );

        return Object.entries(countMap)
          .sort(([a], [b]) =>
            a.localeCompare(b, undefined, {
              sensitivity: 'base'
            })
          )
          .map(([name, count]) => ({
            id: name
              .toLowerCase()
              .replace(/\s+/g, '-'),

            name,

            icon: 'book',

            count
          }));

      }),

      catchError(() => of([]))
    );
  }

  /** GET distinct languages */
  getLanguages(): Observable<string[]> {
    return this.getPublicBooks({}, 1, 100).pipe(
      map(res => [...new Set(res.items.map(b => b.language).filter(Boolean))]),
      catchError(() => of([]))
    );
  }
}
