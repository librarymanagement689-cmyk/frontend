import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Member, MemberCreate, MemberPaginatedResponse, Order } from '../models/book.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminMemberService {
  private http = inject(HttpClient);

  getMembers(
    search?: string,
    status?: string,
    subscription_type_id?: string,
    page = 1,
    limit = 20
  ): Observable<MemberPaginatedResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim()) params = params.set('search', search.trim());
    if (status) params = params.set('status', status);
    if (subscription_type_id) params = params.set('subscription_type_id', subscription_type_id);

    return this.http.get<MemberPaginatedResponse>(`${environment.apiUrl}/admin/members`, { params });
  }

  getMemberById(member_id: string): Observable<Member> {
    return this.http.get<Member>(`${environment.apiUrl}/admin/members/${member_id}`);
  }

  createMember(data: MemberCreate): Observable<Member> {
    return this.http.post<Member>(`${environment.apiUrl}/admin/members`, data);
  }

  updateMember(member_id: string, data: Partial<MemberCreate>): Observable<Member> {
    return this.http.put<Member>(`${environment.apiUrl}/admin/members/${member_id}`, data);
  }

  deleteMember(member_id: string): Observable<{ message: string; success: boolean }> {
    return this.http.delete<{ message: string; success: boolean }>(`${environment.apiUrl}/admin/members/${member_id}`);
  }

  getMemberBorrowingHistory(member_id: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.apiUrl}/admin/members/${member_id}/orders`);
  }
}
