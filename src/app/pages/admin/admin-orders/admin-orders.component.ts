import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrderService, ReturnBooksPayload } from '../../../services/admin-order.service';
import { AdminMemberService } from '../../../services/admin-member.service';
import { AdminBookService } from '../../../services/admin-book.service';
import { ErrorService } from '../../../services/error.service';
import { Order, Member, BackendBook, OrderCreate } from '../../../models/book.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.scss']
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(AdminOrderService);
  private memberService = inject(AdminMemberService);
  private bookService = inject(AdminBookService);
  private errorService = inject(ErrorService);

  orders = signal<Order[]>([]);
  members = signal<Member[]>([]);
  availableBooks = signal<BackendBook[]>([]);

  totalCount = signal(0);
  totalPages = signal(1);
  currentPage = 1;
  pageSize = 15;

  searchQuery = '';
  selectedStatus = '';

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // --- Create Order Modal State ---
  isCreateModalOpen = signal(false);
  selectedMemberId = '';
  selectedBookIdToAdd = '';
  selectedBooks: BackendBook[] = [];
  borrowedDate = new Date().toISOString().split('T')[0];
  dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  amountPaid = 0;

  // --- Return Modal State ---
  isReturnModalOpen = signal(false);
  orderToReturn = signal<Order | null>(null);
  selectedBookIdsToReturn: Record<string, boolean> = {};

  ngOnInit(): void {
    this.loadOrders();
    this.loadMembersAndBooks();
  }

  loadOrders(page = 1): void {
    this.currentPage = page;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService.getOrders(
      this.searchQuery,
      undefined,
      this.selectedStatus,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (res) => {
        this.orders.set(res.items);
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

  loadMembersAndBooks(): void {
    this.memberService.getMembers(undefined, 'active', undefined, 1, 100).subscribe({
      next: (res) => this.members.set(res.items)
    });

    this.bookService.getBooks(undefined, undefined, undefined, 'available', undefined, 1, 100).subscribe({
      next: (res) => this.availableBooks.set(res.items)
    });
  }

  onSearch(): void {
    this.loadOrders(1);
  }

  // --- Order Creation Handlers ---
  openCreateModal(): void {
    this.loadMembersAndBooks();
    this.selectedMemberId = this.members()[0]?.member_id || '';
    this.selectedBookIdToAdd = '';
    this.selectedBooks = [];
    this.borrowedDate = new Date().toISOString().split('T')[0];
    this.dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    this.amountPaid = 0;
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  addBookToOrder(): void {
    if (!this.selectedBookIdToAdd) return;

    // Check if already added
    if (this.selectedBooks.some(b => b.book_id === this.selectedBookIdToAdd)) {
      this.errorMessage.set('Book already added to order.');
      return;
    }

    // Fetch authoritative book info from backend or available list
    const foundBook = this.availableBooks().find(b => b.book_id === this.selectedBookIdToAdd);
    if (foundBook) {
      this.selectedBooks.push(foundBook);
      this.recalculateSubtotal();
      this.selectedBookIdToAdd = '';
      this.errorMessage.set(null);
    } else {
      // Fetch directly from API
      this.bookService.getBookById(this.selectedBookIdToAdd).subscribe({
        next: (b) => {
          this.selectedBooks.push(b);
          this.recalculateSubtotal();
          this.selectedBookIdToAdd = '';
          this.errorMessage.set(null);
        },
        error: (err) => this.errorMessage.set(this.errorService.getErrorMessage(err))
      });
    }
  }

  removeBookFromOrder(bookId: string): void {
    this.selectedBooks = this.selectedBooks.filter(b => b.book_id !== bookId);
    this.recalculateSubtotal();
  }

  /**
   * Authoritative price subtotal calculation based exclusively on backend prices.
   */
  get calculatedSubtotal(): number {
    return this.selectedBooks.reduce((sum, b) => sum + (b.price || 0), 0);
  }

  recalculateSubtotal(): void {
    this.amountPaid = this.calculatedSubtotal;
  }

  submitCreateOrder(): void {
    if (!this.selectedMemberId) {
      this.errorMessage.set('Please select a member.');
      return;
    }

    if (this.selectedBooks.length === 0) {
      this.errorMessage.set('Please select at least one book to lend.');
      return;
    }

    const payload: OrderCreate = {
      member_id: this.selectedMemberId,
      book_ids: this.selectedBooks.map(b => b.book_id),
      borrowed_date: this.borrowedDate,
      due_date: this.dueDate,
      amount_paid: Number(this.amountPaid)
    };

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService.createOrder(payload).subscribe({
      next: (created) => {
        this.showSuccess(`Lending Order ${created.order_id} created successfully! Subtotal: ₹${created.subtotal}`);
        this.closeCreateModal();
        this.loadOrders(1);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.errorService.getErrorMessage(err));
      }
    });
  }

  // --- Return Books Handlers ---
  openReturnModal(order: Order): void {
    this.orderToReturn.set(order);
    this.selectedBookIdsToReturn = {};
    order.items.forEach(item => {
      if (!item.returned) {
        this.selectedBookIdsToReturn[item.book_id] = true;
      }
    });
    this.isReturnModalOpen.set(true);
  }

  closeReturnModal(): void {
    this.isReturnModalOpen.set(false);
    this.orderToReturn.set(null);
  }

  submitReturnBooks(): void {
    const order = this.orderToReturn();
    if (!order) return;

    const bookIdsToReturn = Object.keys(this.selectedBookIdsToReturn).filter(id => this.selectedBookIdsToReturn[id]);
    const payload: ReturnBooksPayload = {
      book_ids: bookIdsToReturn.length > 0 ? bookIdsToReturn : undefined
    };

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService.returnBooks(order.order_id, payload).subscribe({
      next: (updatedOrder) => {
        this.showSuccess(`Books returned successfully for Order ${updatedOrder.order_id}. Book availability updated immediately.`);
        this.closeReturnModal();
        this.loadOrders(this.currentPage);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.errorService.getErrorMessage(err));
      }
    });
  }

  sendReminders(): void {
    this.orderService.sendReminders().subscribe({
      next: (res) => this.showSuccess(res.message || `Sent ${res.sent_count} due date reminder email(s).`),
      error: (err) => this.errorMessage.set(this.errorService.getErrorMessage(err))
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 5000);
  }
}
