import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSubscriptionService } from '../../../services/admin-subscription.service';
import { ErrorService } from '../../../services/error.service';
import { Subscription, SubscriptionCreate } from '../../../models/book.model';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-subscriptions.component.html',
  styleUrls: ['./admin-subscriptions.component.scss']
})
export class AdminSubscriptionsComponent implements OnInit {
  private subscriptionService = inject(AdminSubscriptionService);
  private errorService = inject(ErrorService);

  subscriptions = signal<Subscription[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Modal State
  isModalOpen = signal(false);
  isEditing = signal(false);
  editingSubId = signal<string | null>(null);

  subForm: SubscriptionCreate = {
    name: '',
    description: '',
    duration_days: 30,
    price: 199,
    is_active: true
  };

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.subscriptionService.getSubscriptions(false).subscribe({
      next: (subs) => {
        this.subscriptions.set(subs);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.errorService.getErrorMessage(err));
      }
    });
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.editingSubId.set(null);
    this.subForm = {
      name: '',
      description: '',
      duration_days: 30,
      price: 199,
      is_active: true
    };
    this.isModalOpen.set(true);
  }

  openEditModal(sub: Subscription): void {
    this.isEditing.set(true);
    this.editingSubId.set(sub.subscription_id);
    this.subForm = {
      name: sub.name,
      description: sub.description || '',
      duration_days: sub.duration_days,
      price: sub.price,
      is_active: sub.is_active
    };
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveSubscription(): void {
    if (!this.subForm.name || this.subForm.duration_days <= 0 || this.subForm.price < 0) {
      this.errorMessage.set('Please provide valid plan details.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (this.isEditing() && this.editingSubId()) {
      this.subscriptionService.updateSubscription(this.editingSubId()!, this.subForm).subscribe({
        next: (updated) => {
          this.showSuccess(`Subscription type ${updated.subscription_id} updated.`);
          this.closeModal();
          this.loadSubscriptions();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(this.errorService.getErrorMessage(err));
        }
      });
    } else {
      this.subscriptionService.createSubscription(this.subForm).subscribe({
        next: (created) => {
          this.showSuccess(`Subscription type ${created.subscription_id} created.`);
          this.closeModal();
          this.loadSubscriptions();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(this.errorService.getErrorMessage(err));
        }
      });
    }
  }

  deleteSubscription(sub: Subscription): void {
    if (!confirm(`Are you sure you want to delete subscription plan ${sub.subscription_id} (${sub.name})?`)) {
      return;
    }

    this.subscriptionService.deleteSubscription(sub.subscription_id).subscribe({
      next: () => {
        this.showSuccess(`Subscription plan ${sub.subscription_id} deleted.`);
        this.loadSubscriptions();
      },
      error: (err) => {
        this.errorMessage.set(this.errorService.getErrorMessage(err));
      }
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 4000);
  }
}
