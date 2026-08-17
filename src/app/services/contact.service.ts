import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ContactEnquiry {
  name: string;
  email?: string;
  phone?: string;
  bookTitle?: string;
  message: string;
}

const USE_API = false;
const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class ContactService {

  constructor(private http: HttpClient) {}

  /**
   * POST /api/contact/enquiry
   * Stub — ready to connect to FastAPI backend.
   */
  sendEnquiry(enquiry: ContactEnquiry): Observable<{ success: boolean }> {
    if (USE_API) {
      return this.http.post<{ success: boolean }>(
        `${API_BASE}/contact/enquiry`, enquiry
      ).pipe(catchError(() => of({ success: false })));
    }
    // Mock: just resolve as success
    console.info('[ContactService] Enquiry submitted (mock):', enquiry);
    return of({ success: true });
  }

  /**
   * Opens WhatsApp with a pre-filled message.
   * REPLACE the phone number with the actual library WhatsApp number.
   */
  openWhatsApp(message: string = ''): void {
    // REPLACE: Update the phone number below with the actual library WhatsApp number
    const phone = '919999999999'; // e.g., 91 + 10-digit number
    const encodedMsg = encodeURIComponent(message || 'Hello! I would like to enquire about a book.');
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
  }
}
