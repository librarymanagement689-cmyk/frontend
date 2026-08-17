import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-card" [ngClass]="'toast-' + toast.type" role="alert">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ⚠ }
              @default { ℹ }
            }
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button (click)="toastService.remove(toast.id)" class="toast-close" aria-label="Close notification">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 420px;
      width: calc(100vw - 3rem);
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1.1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .toast-success {
      background-color: #064e3b;
      color: #a7f3d0;
      border-color: #059669;
    }

    .toast-error {
      background-color: #7f1d1d;
      color: #fecaca;
      border-color: #dc2626;
    }

    .toast-warning {
      background-color: #78350f;
      color: #fde68a;
      border-color: #d97706;
    }

    .toast-info {
      background-color: #1e3a8a;
      color: #bfdbfe;
      border-color: #2563eb;
    }

    .toast-icon {
      font-weight: 700;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .toast-message {
      flex: 1;
      line-height: 1.4;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: currentColor;
      font-size: 1.25rem;
      opacity: 0.7;
      cursor: pointer;
      padding: 0 0.2rem;
      &:hover { opacity: 1; }
    }

    @keyframes toastIn {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
