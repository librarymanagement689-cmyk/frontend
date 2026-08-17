import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderCreate, OrderPaginatedResponse } from '../models/book.model';
import { environment } from '../../environments/environment';

export interface ReturnBooksPayload {
  book_ids?: string[]; // null/empty list means return all books in order
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {
  private http = inject(HttpClient);

  getOrders(
    search?: string,
    member_id?: string,
    status?: string,
    page = 1,
    limit = 20
  ): Observable<OrderPaginatedResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim()) params = params.set('search', search.trim());
    if (member_id) params = params.set('member_id', member_id);
    if (status) params = params.set('status', status);

    return this.http.get<OrderPaginatedResponse>(`${environment.apiUrl}/admin/orders`, { params });
  }

  getOrderById(order_id: string): Observable<Order> {
    return this.http.get<Order>(`${environment.apiUrl}/admin/orders/${order_id}`);
  }

  createOrder(data: OrderCreate): Observable<Order> {
    return this.http.post<Order>(`${environment.apiUrl}/admin/orders`, data);
  }

  returnBooks(order_id: string, payload: ReturnBooksPayload): Observable<Order> {
    return this.http.post<Order>(`${environment.apiUrl}/admin/orders/${order_id}/return`, payload);
  }

  sendReminders(): Observable<{ sent_count: number; message: string }> {
    return this.http.post<{ sent_count: number; message: string }>(`${environment.apiUrl}/admin/orders/send-reminders`, {});
  }
}
