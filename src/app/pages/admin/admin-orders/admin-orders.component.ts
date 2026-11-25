import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { transliterate } from '@piraisoodan/tanglish';
import { AdminOrderService, ReturnBooksPayload } from '../../../services/admin-order.service';
import { AdminMemberService } from '../../../services/admin-member.service';
import { AdminBookService } from '../../../services/admin-book.service';
import { AdminSubscriptionService } from '../../../services/admin-subscription.service';
import { ErrorService } from '../../../services/error.service';
import { Order, Member, BackendBook, OrderCreate, Subscription } from '../../../models/book.model';

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
  private subscriptionService = inject(AdminSubscriptionService);
  private errorService = inject(ErrorService);

  orders = signal<Order[]>([]);
  members = signal<Member[]>([]);
  subscriptions = signal<Subscription[]>([]);
  availableBooks = signal<BackendBook[]>([]);
  bookSearchQuery = '';
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
  memberPastBookIds = signal<Set<string>>(new Set());
  memberPastBooksCount = signal(0);
  isLoadingPastBooks = signal(false);

  // --- Return Modal State ---
  isReturnModalOpen = signal(false);
  orderToReturn = signal<Order | null>(null);
  selectedBookIdsToReturn: Record<string, boolean> = {};

  ngOnInit(): void {
    this.loadOrders();
    this.loadMembersAndBooks();
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.subscriptionService.getSubscriptions().subscribe({
      next: (subs) => this.subscriptions.set(subs)
    });
  }

  getMemberName(order: Order): string {
    if (order.member_name) return order.member_name;
    const found = this.members().find(m => m.member_id === order.member_id);
    return found ? found.name : 'Unknown Member';
  }

  getSubscriptionName(order: Order): string {
    if (order.subscription_name) return order.subscription_name;
    const foundMember = this.members().find(m => m.member_id === order.member_id);
    if (foundMember && foundMember.subscription_type_id) {
      const foundSub = this.subscriptions().find(s => s.subscription_id === foundMember.subscription_type_id);
      if (foundSub) return foundSub.name;
    }
    return 'Standard Plan';
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

  authorsList = signal<string[]>([]);
  selectedAuthorFilter = '';

  get filteredAvailableBooks(): BackendBook[] {
    const query = this.bookSearchQuery.trim().toLowerCase();
    const authorFilter = this.selectedAuthorFilter.trim().toLowerCase();

    let tamilQ = '';
    if (query && /[a-zA-Z]/.test(query)) {
      try {
        tamilQ = transliterate(query).toLowerCase();
      } catch {}
    }

    return this.availableBooks().filter(book => {
      const title = (book.title || '').toLowerCase();
      const author = (book.author || '').toLowerCase();
      const id = (book.book_id || '').toLowerCase();

      const matchesQuery = !query ||
        title.includes(query) ||
        author.includes(query) ||
        id.includes(query) ||
        (tamilQ && (title.includes(tamilQ) || author.includes(tamilQ)));

      const matchesAuthor = !authorFilter || author.includes(authorFilter);

      return matchesQuery && matchesAuthor;
    });
  }

  loadMembersAndBooks(): void {
    this.memberService.getMembers(undefined, 'active', undefined, 1, 100).subscribe({
      next: (res) => this.members.set(res.items)
    });

    this.bookService.getBooks(undefined, undefined, undefined, 'available', undefined, 1, 300).subscribe({
      next: (res) => this.availableBooks.set(res.items)
    });

    this.bookService.getAuthors().subscribe({
      next: (authors) => this.authorsList.set(authors || [])
    });
  }

  onSearch(): void {
    this.loadOrders(1);
  }

  // --- Calculations for 12% Rental Fee ---
  get combinedMRP(): number {
    return this.selectedBooks.reduce(
      (sum, b) => sum + (Number(b.price) || 0),
      0
    );
  }

  getItemRentalCharge(book: BackendBook): number {
    return Math.round((Number(book.price) || 0) * 0.12 * 100) / 100;
  }

  get rentalCharge(): number {
    return Math.round(this.combinedMRP * 0.12 * 100) / 100;
  }

  get finalAmountPayable(): number {
    return Math.round(this.rentalCharge);
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
    this.bookSearchQuery = '';
    this.isCreateModalOpen.set(true);
    this.loadMemberPastBooks();
  }

  onMemberSelectChange(): void {
    this.loadMemberPastBooks();
  }

  loadMemberPastBooks(): void {
    if (!this.selectedMemberId) {
      this.memberPastBookIds.set(new Set());
      this.memberPastBooksCount.set(0);
      return;
    }
    this.isLoadingPastBooks.set(true);
    this.memberService.getMemberPreviouslyBorrowedBooks(this.selectedMemberId).subscribe({
      next: (res) => {
        this.memberPastBookIds.set(new Set(res.book_ids || []));
        this.memberPastBooksCount.set(res.total_borrowed_unique_books || 0);
        this.isLoadingPastBooks.set(false);
      },
      error: () => {
        this.memberPastBookIds.set(new Set());
        this.memberPastBooksCount.set(0);
        this.isLoadingPastBooks.set(false);
      }
    });
  }

  isBookPreviouslyBorrowed(bookId: string): boolean {
    return this.memberPastBookIds().has(bookId);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  addBookToOrder(): void {
    if (!this.selectedBookIdToAdd) return;

    // Check if member already borrowed this book previously
    if (this.isBookPreviouslyBorrowed(this.selectedBookIdToAdd)) {
      this.errorMessage.set('Cannot add book: This member has already borrowed this book previously and cannot take the same book again.');
      return;
    }

    // Check if already added to current order
    if (this.selectedBooks.some(b => b.book_id === this.selectedBookIdToAdd)) {
      this.errorMessage.set('Book already added to order.');
      return;
    }

    // Fetch authoritative book info from backend or available list
    const foundBook = this.availableBooks().find(b => b.book_id === this.selectedBookIdToAdd);
    if (foundBook) {
      this.selectedBooks.push(foundBook);
      this.amountPaid = this.finalAmountPayable;
      this.selectedBookIdToAdd = '';
      this.errorMessage.set(null);
    } else {
      // Fetch directly from API
      this.bookService.getBookById(this.selectedBookIdToAdd).subscribe({
        next: (b) => {
          this.selectedBooks.push(b);
          this.amountPaid = this.finalAmountPayable;
          this.selectedBookIdToAdd = '';
          this.errorMessage.set(null);
        },
        error: (err) => this.errorMessage.set(this.errorService.getErrorMessage(err))
      });
    }
  }

  removeBookFromOrder(bookId: string): void {
    this.selectedBooks = this.selectedBooks.filter(
      b => b.book_id !== bookId
    );
    this.amountPaid = this.finalAmountPayable;
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
      items: this.selectedBooks.map(b => ({
        book_id: b.book_id,
        lending_amount: this.getItemRentalCharge(b)
      })),
      borrowed_date: this.borrowedDate,
      due_date: this.dueDate,
      amount_paid: Number(this.amountPaid)
    };

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService.createOrder(payload).subscribe({
      next: (created) => {
        this.showSuccess(`Lending Order ${created.order_id} created successfully! Subtotal Rental Charge: ₹${created.subtotal}`);
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
