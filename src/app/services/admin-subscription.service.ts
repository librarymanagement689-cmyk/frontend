import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subscription, SubscriptionCreate } from '../models/book.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminSubscriptionService {
  private http = inject(HttpClient);

  getSubscriptions(activeOnly = false): Observable<Subscription[]> {
    const params = new HttpParams().set('active_only', activeOnly.toString());
    return this.http.get<Subscription[]>(`${environment.apiUrl}/admin/subscriptions`, { params });
  }

  getSubscriptionById(subscription_id: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${environment.apiUrl}/admin/subscriptions/${subscription_id}`);
  }

  createSubscription(data: SubscriptionCreate): Observable<Subscription> {
    return this.http.post<Subscription>(`${environment.apiUrl}/admin/subscriptions`, data);
  }

  updateSubscription(subscription_id: string, data: Partial<SubscriptionCreate>): Observable<Subscription> {
    return this.http.put<Subscription>(`${environment.apiUrl}/admin/subscriptions/${subscription_id}`, data);
  }

  deleteSubscription(subscription_id: string): Observable<{ message: string; success: boolean }> {
    return this.http.delete<{ message: string; success: boolean }>(`${environment.apiUrl}/admin/subscriptions/${subscription_id}`);
  }
}
