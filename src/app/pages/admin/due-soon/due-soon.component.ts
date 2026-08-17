import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrderService } from '../../../services/admin-order.service';
import { AdminMemberService } from '../../../services/admin-member.service';
import { ErrorService } from '../../../services/error.service';
import { ToastService } from '../../../services/toast.service';
import { Order } from '../../../models/book.model';

@Component({
  selector: 'app-due-soon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './due-soon.component.html',
  styleUrls: ['./due-soon.component.scss']
})
export class DueSoonComponent implements OnInit {
  private orderService = inject(AdminOrderService);
  private memberService = inject(AdminMemberService);
  private errorService = inject(ErrorService);
  private toastService = inject(ToastService);

  orders = signal<Order[]>([]);
  isLoading = signal(true);
  sendingReminder = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDueSoonOrders();
  }

  loadDueSoonOrders(): void {
    this.isLoading.set(true);
    this.orderService.getOrders(undefined, undefined, 'active', 1, 100).subscribe({
      next: (res) => {
        // Filter orders due within next 3 days
        const today = new Date();
        const threeDaysFromNow = new Date(today.getTime() + 3 * 86400000);

        const dueSoon = res.items.filter(order => {
          if (order.status !== 'active') return false;
          const due = new Date(order.due_date);
          return due >= today && due <= threeDaysFromNow;
        });

        this.orders.set(dueSoon);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error(this.errorService.getErrorMessage(err));
      }
    });
  }

  getDaysRemaining(dueDateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  sendReminder(order: Order): void {
    this.sendingReminder.set(order.order_id);
    this.orderService.sendReminders().subscribe({
      next: (res) => {
        this.sendingReminder.set(null);
        this.toastService.success(res.message || `Due date reminder sent for order ${order.order_id}`);
        this.loadDueSoonOrders();
      },
      error: (err) => {
        this.sendingReminder.set(null);
        this.toastService.error(this.errorService.getErrorMessage(err));
      }
    });
  }
}
