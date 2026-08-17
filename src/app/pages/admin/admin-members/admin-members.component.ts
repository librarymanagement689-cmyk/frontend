import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMemberService } from '../../../services/admin-member.service';
import { AdminSubscriptionService } from '../../../services/admin-subscription.service';
import { ErrorService } from '../../../services/error.service';
import { Member, MemberCreate, Order, Subscription } from '../../../models/book.model';

@Component({
  selector: 'app-admin-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-members.component.html',
  styleUrls: ['./admin-members.component.scss']
})
export class AdminMembersComponent implements OnInit {
  private memberService = inject(AdminMemberService);
  private subscriptionService = inject(AdminSubscriptionService);
  private errorService = inject(ErrorService);

  members = signal<Member[]>([]);
  subscriptions = signal<Subscription[]>([]);
  totalCount = signal(0);
  totalPages = signal(1);
  currentPage = 1;
  pageSize = 15;

  searchQuery = '';
  selectedStatus = '';
  selectedSubscription = '';

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Modal State for Member Add/Edit
  isModalOpen = signal(false);
  isEditing = signal(false);
  editingMemberId = signal<string | null>(null);

  // Member Form Model
  memberForm: MemberCreate = {
    name: '',
    phone: '',
    email: '',
    subscription_type_id: '',
    subscription_start_date: new Date().toISOString().split('T')[0],
    subscription_end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'active'
  };

  // History Modal State
  isHistoryModalOpen = signal(false);
  selectedMemberForHistory = signal<Member | null>(null);
  memberHistory = signal<Order[]>([]);
  isLoadingHistory = signal(false);

  ngOnInit(): void {
    this.loadSubscriptions();
    this.loadMembers();
  }

  loadSubscriptions(): void {
    this.subscriptionService.getSubscriptions().subscribe({
      next: (subs) => {
        this.subscriptions.set(subs);
        if (subs.length > 0 && !this.memberForm.subscription_type_id) {
          this.memberForm.subscription_type_id = subs[0].subscription_id;
        }
      }
    });
  }

  loadMembers(page = 1): void {
    this.currentPage = page;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.memberService.getMembers(
      this.searchQuery,
      this.selectedStatus,
      this.selectedSubscription,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (res) => {
        this.members.set(res.items);
        this.totalCount.set(res.total);
        this.totalPages.set(res.total_pages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.errorService.getErrorMessage(err));
      }
    });
  }

  onSearch(): void {
    this.loadMembers(1);
  }

  onSubscriptionChange(): void {
    const sub = this.subscriptions().find(s => s.subscription_id === this.memberForm.subscription_type_id);
    if (sub) {
      const days = sub.duration_days || 30;
      const startDate = new Date(this.memberForm.subscription_start_date || Date.now());
      const endDate = new Date(startDate.getTime() + days * 86400000);
      this.memberForm.subscription_end_date = endDate.toISOString().split('T')[0];
    }
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.editingMemberId.set(null);
    const today = new Date().toISOString().split('T')[0];
    const defaultSub = this.subscriptions()[0]?.subscription_id || 'SUB-00001';
    
    this.memberForm = {
      name: '',
      phone: '',
      email: '',
      subscription_type_id: defaultSub,
      subscription_start_date: today,
      subscription_end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'active'
    };
    this.onSubscriptionChange();
    this.isModalOpen.set(true);
  }

  openEditModal(member: Member): void {
    this.isEditing.set(true);
    this.editingMemberId.set(member.member_id);
    this.memberForm = {
      name: member.name,
      phone: member.phone,
      email: member.email,
      subscription_type_id: member.subscription_type_id,
      subscription_start_date: member.subscription_start_date,
      subscription_end_date: member.subscription_end_date,
      status: member.status as 'active' | 'inactive' | 'expired'
    };
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveMember(): void {
    if (!this.memberForm.name || !this.memberForm.phone || !this.memberForm.email || !this.memberForm.subscription_type_id) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (this.isEditing() && this.editingMemberId()) {
      this.memberService.updateMember(this.editingMemberId()!, this.memberForm).subscribe({
        next: (updated) => {
          this.showSuccess(`Member ${updated.member_id} updated successfully.`);
          this.closeModal();
          this.loadMembers(this.currentPage);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(this.errorService.getErrorMessage(err));
        }
      });
    } else {
      this.memberService.createMember(this.memberForm).subscribe({
        next: (created) => {
          this.showSuccess(`Member ${created.member_id} registered successfully.`);
          this.closeModal();
          this.loadMembers(1);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(this.errorService.getErrorMessage(err));
        }
      });
    }
  }

  deleteMember(member: Member): void {
    if (!confirm(`Are you sure you want to delete member ${member.member_id} (${member.name})?`)) {
      return;
    }

    this.memberService.deleteMember(member.member_id).subscribe({
      next: () => {
        this.showSuccess(`Member ${member.member_id} deleted successfully.`);
        this.loadMembers(this.currentPage);
      },
      error: (err) => {
        this.errorMessage.set(this.errorService.getErrorMessage(err));
      }
    });
  }

  openHistoryModal(member: Member): void {
    this.selectedMemberForHistory.set(member);
    this.isLoadingHistory.set(true);
    this.isHistoryModalOpen.set(true);

    this.memberService.getMemberBorrowingHistory(member.member_id).subscribe({
      next: (orders) => {
        this.memberHistory.set(orders);
        this.isLoadingHistory.set(false);
      },
      error: (err) => {
        this.isLoadingHistory.set(false);
        this.errorMessage.set(this.errorService.getErrorMessage(err));
      }
    });
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen.set(false);
    this.selectedMemberForHistory.set(null);
  }

  getSubscriptionName(id: string): string {
    const found = this.subscriptions().find(s => s.subscription_id === id);
    return found ? found.name : id;
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 4000);
  }
}
