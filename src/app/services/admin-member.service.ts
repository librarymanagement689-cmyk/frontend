import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Member, MemberCreate, MemberPaginatedResponse, Order, PastBookItem, MemberPreviouslyBorrowedResponse } from '../models/book.model';
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

  getMemberBorrowingHistory(member_id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/members/${member_id}/orders`);
  }

  toggleDepositRefund(
    member_id: string,
    payload: {
      security_deposit_returned: boolean;
      security_deposit_returned_date?: string;
      security_deposit_notes?: string;
    }
  ): Observable<Member> {
    return this.http.patch<Member>(`${environment.apiUrl}/admin/members/${member_id}/deposit-refund`, payload);
  }

  getMemberPreviouslyBorrowedBooks(member_id: string): Observable<MemberPreviouslyBorrowedResponse> {
    return this.http.get<MemberPreviouslyBorrowedResponse>(`${environment.apiUrl}/admin/members/${member_id}/previously-borrowed-books`);
  }

  addPastBook(member_id: string, item: PastBookItem): Observable<Member> {
    return this.http.post<Member>(`${environment.apiUrl}/admin/members/${member_id}/past-books`, item);
  }

  removePastBook(member_id: string, book_id: string): Observable<Member> {
    return this.http.delete<Member>(`${environment.apiUrl}/admin/members/${member_id}/past-books/${book_id}`);
  }
}
