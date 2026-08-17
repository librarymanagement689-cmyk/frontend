import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  getErrorMessage(error: HttpErrorResponse | any): string {
    if (!error) return 'An unknown error occurred.';

    if (typeof error === 'string') return error;

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Cannot connect to backend server. Please make sure FastAPI is running at http://localhost:8000.';
      }

      if (error.error) {
        // FastAPI return format: { detail: ... }
        if (typeof error.error.detail === 'string') {
          return error.error.detail;
        }

        // FastAPI 422 validation error format: { detail: [{ loc: [...], msg: "..." }] }
        if (Array.isArray(error.error.detail)) {
          return error.error.detail
            .map((err: any) => `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`)
            .join(' | ');
        }

        if (typeof error.error.message === 'string') {
          return error.error.message;
        }
      }

      switch (error.status) {
        case 401:
          return 'Unauthorized access. Please login with valid credentials.';
        case 403:
          return 'Forbidden. You do not have permission to perform this action.';
        case 404:
          return 'Resource not found.';
        case 409:
          return 'Conflict occurred. Record already exists or state mismatch.';
        case 422:
          return 'Validation error. Please check your inputs.';
        case 500:
          return 'Internal server error. Please try again later.';
        default:
          return `Error (${error.status}): ${error.statusText || 'Operation failed'}`;
      }
    }

    return error.message || 'An unexpected error occurred.';
  }
}
