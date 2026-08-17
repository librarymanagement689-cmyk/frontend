import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrderService } from '../../../services/admin-order.service';
import { ErrorService } from '../../../services/error.service';
import { ToastService } from '../../../services/toast.service';
import { Order } from '../../../models/book.model';

@Component({
  selector: 'app-overdue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './overdue.component.html',
  styleUrls: ['./overdue.component.scss']
})
export class OverdueComponent implements OnInit {
  private orderService = inject(AdminOrderService);
  private errorService = inject(ErrorService);
  private toastService = inject(ToastService);

  orders = signal<Order[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadOverdueOrders();
  }

  loadOverdueOrders(): void {
    this.isLoading.set(true);
    this.orderService.getOrders(undefined, undefined, 'overdue', 1, 100).subscribe({
      next: (res) => {
        this.orders.set(res.items);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error(this.errorService.getErrorMessage(err));
      }
    });
  }

  getDaysOverdue(dueDateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  processReturn(order: Order): void {
    if (!confirm(`Return all books for overdue order ${order.order_id}?`)) return;

    this.orderService.returnBooks(order.order_id, {}).subscribe({
      next: () => {
        this.toastService.success(`Overdue order ${order.order_id} returned successfully.`);
        this.loadOverdueOrders();
      },
      error: (err) => this.toastService.error(this.errorService.getErrorMessage(err))
    });
  }

  sendReminder(order: Order): void {
    this.orderService.sendReminders().subscribe({
      next: (res) => this.toastService.success(res.message || `Overdue notice sent for order ${order.order_id}`),
      error: (err) => this.toastService.error(this.errorService.getErrorMessage(err))
    });
  }
}
