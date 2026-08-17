import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface GlobalSearchResult {
  books: Array<{ book_id: string; title: string; author: string; status: string; price: number }>;
  members: Array<{ member_id: string; name: string; phone: string; email: string; status: string }>;
  orders: Array<{ order_id: string; member_id: string; status: string; borrowed_date: string; subtotal: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private http = inject(HttpClient);

  searchAll(query: string): Observable<GlobalSearchResult> {
    if (!query || query.trim().length < 2) {
      return of({ books: [], members: [], orders: [] });
    }

    const q = query.trim();

    const books$ = this.http.get<any>(`${environment.apiUrl}/admin/books`, {
      params: new HttpParams().set('search', q).set('limit', '5')
    }).pipe(
      map(res => res.items || []),
      catchError(() => of([]))
    );

    const members$ = this.http.get<any>(`${environment.apiUrl}/admin/members`, {
      params: new HttpParams().set('search', q).set('limit', '5')
    }).pipe(
      map(res => res.items || []),
      catchError(() => of([]))
    );

    const orders$ = this.http.get<any>(`${environment.apiUrl}/admin/orders`, {
      params: new HttpParams().set('search', q).set('limit', '5')
    }).pipe(
      map(res => res.items || []),
      catchError(() => of([]))
    );

    return forkJoin({ books: books$, members: members$, orders: orders$ });
  }
}
