import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { transliterate } from '@piraisoodan/tanglish';
import { AdminMemberService } from '../../../services/admin-member.service';
import { AdminSubscriptionService } from '../../../services/admin-subscription.service';
import { AdminBookService } from '../../../services/admin-book.service';
import { ErrorService } from '../../../services/error.service';
import { Member, MemberCreate, Order, Subscription, PastBookItem, BackendBook, PreviouslyBorrowedBookRecord } from '../../../models/book.model';

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
  private bookService = inject(AdminBookService);
  private errorService = inject(ErrorService);

  members = signal<Member[]>([]);
  subscriptions = signal<Subscription[]>([]);
  availableBooks = signal<BackendBook[]>([]);
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

  // Form past books state
  pastBookSearchQuery = '';
  selectedBookToAddAsPast = '';
  selectedAuthorForForm = '';
  booksByAuthorForForm = signal<BackendBook[]>([]);
  isLoadingAuthorBooksForForm = signal(false);
  pastBooksFormList: PastBookItem[] = [];

  // Member Form Model
  memberForm: MemberCreate = {
    name: '',
    phone: '',
    email: '',
    subscription_type_id: '',
    subscription_start_date: new Date().toISOString().split('T')[0],
    subscription_end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    join_date: new Date().toISOString().split('T')[0],
    discontinued_date: '',
    security_deposit_amount: 0,
    security_deposit_returned: false,
    security_deposit_returned_date: '',
    security_deposit_notes: '',
    past_books: [],
    status: 'active'
  };

  // History Modal State
  isHistoryModalOpen = signal(false);
  selectedMemberForHistory = signal<Member | null>(null);
  selectedMemberDetails = signal<any>(null);
  memberHistory = signal<Order[]>([]);
  previouslyBorrowedRecords = signal<PreviouslyBorrowedBookRecord[]>([]);
  totalUniqueBooksBorrowed = signal(0);
  isLoadingHistory = signal(false);
  historyActiveTab = signal<'all_borrowed' | 'orders'>('all_borrowed');

  // Authors List & Selection
  authorsList = signal<string[]>([]);
  selectedAuthorInHistory = '';
  booksByAuthorInHistory = signal<BackendBook[]>([]);
  isLoadingAuthorBooksInHistory = signal(false);

  // New past book in history modal
  historyBookSearchQuery = '';
  historySelectedBookToAdd = '';
  historyPastBookDate = new Date().toISOString().split('T')[0];
  historyPastBookNotes = '';

  ngOnInit(): void {
    this.loadSubscriptions();
    this.loadMembers();
    this.loadAvailableBooks();
    this.loadAuthors();
  }

  loadAuthors(): void {
    this.bookService.getAuthors().subscribe({
      next: (authors) => this.authorsList.set(authors || []),
      error: () => {}
    });
  }

  loadAvailableBooks(): void {
    this.bookService.getBooks(undefined, undefined, undefined, undefined, undefined, 1, 200).subscribe({
      next: (res) => this.availableBooks.set(res.items || []),
      error: () => {}
    });
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
    
    this.pastBooksFormList = [];
    this.pastBookSearchQuery = '';
    this.selectedBookToAddAsPast = '';

    this.memberForm = {
      name: '',
      phone: '',
      email: '',
      subscription_type_id: defaultSub,
      subscription_start_date: today,
      subscription_end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      join_date: today,
      discontinued_date: '',
      security_deposit_amount: 0,
      security_deposit_returned: false,
      security_deposit_returned_date: '',
      security_deposit_notes: '',
      past_books: [],
      status: 'active'
    };
    this.onSubscriptionChange();
    this.isModalOpen.set(true);
  }

  openEditModal(member: Member): void {
    this.isEditing.set(true);
    this.editingMemberId.set(member.member_id);
    this.pastBooksFormList = Array.isArray(member.past_books) ? [...member.past_books] : [];
    this.pastBookSearchQuery = '';
    this.selectedBookToAddAsPast = '';

    this.memberForm = {
      name: member.name,
      phone: member.phone,
      email: member.email,
      subscription_type_id: member.subscription_type_id,
      subscription_start_date: member.subscription_start_date,
      subscription_end_date: member.subscription_end_date,
      join_date: member.join_date || member.subscription_start_date,
      discontinued_date: member.discontinued_date || '',
      security_deposit_amount: member.security_deposit_amount || 0,
      security_deposit_returned: member.security_deposit_returned || false,
      security_deposit_returned_date: member.security_deposit_returned_date || '',
      security_deposit_notes: member.security_deposit_notes || '',
      past_books: this.pastBooksFormList,
      status: member.status as 'active' | 'inactive' | 'expired'
    };
    this.isModalOpen.set(true);
  }

  get filteredBooksForPast(): BackendBook[] {
    const q = this.pastBookSearchQuery.trim().toLowerCase();
    if (!q) return this.availableBooks().slice(0, 10);
    let tamilQ = '';
    if (/[a-zA-Z]/.test(q)) {
      try {
        tamilQ = transliterate(q).toLowerCase();
      } catch {}
    }
    return this.availableBooks().filter(b => {
      const title = (b.title || '').toLowerCase();
      const author = (b.author || '').toLowerCase();
      const id = (b.book_id || '').toLowerCase();
      return title.includes(q) || author.includes(q) || id.includes(q) ||
        (tamilQ && (title.includes(tamilQ) || author.includes(tamilQ)));
    }).slice(0, 20);
  }

  onAuthorChangeForForm(author: string): void {
    this.selectedAuthorForForm = author;
    if (!author) {
      this.booksByAuthorForForm.set([]);
      return;
    }
    this.isLoadingAuthorBooksForForm.set(true);
    this.bookService.getBooks(undefined, undefined, undefined, undefined, undefined, 1, 100, undefined, author).subscribe({
      next: (res) => {
        this.booksByAuthorForForm.set(res.items || []);
        this.isLoadingAuthorBooksForForm.set(false);
      },
      error: () => this.isLoadingAuthorBooksForForm.set(false)
    });
  }

  addAllAuthorBooksToForm(): void {
    const books = this.booksByAuthorForForm();
    let addedCount = 0;
    books.forEach(b => {
      if (!this.pastBooksFormList.some(pb => pb.book_id === b.book_id)) {
        this.pastBooksFormList.push({
          book_id: b.book_id,
          title: b.title,
          date_borrowed: new Date().toISOString().split('T')[0]
        });
        addedCount++;
      }
    });
    this.showSuccess(`Added ${addedCount} book(s) by ${this.selectedAuthorForForm} to member's past record.`);
  }

  onAuthorChangeInHistory(author: string): void {
    this.selectedAuthorInHistory = author;
    if (!author) {
      this.booksByAuthorInHistory.set([]);
      return;
    }
    this.isLoadingAuthorBooksInHistory.set(true);
    this.bookService.getBooks(undefined, undefined, undefined, undefined, undefined, 1, 100, undefined, author).subscribe({
      next: (res) => {
        this.booksByAuthorInHistory.set(res.items || []);
        this.isLoadingAuthorBooksInHistory.set(false);
      },
      error: () => this.isLoadingAuthorBooksInHistory.set(false)
    });
  }

  addAllAuthorBooksToMemberHistory(): void {
    const mem = this.selectedMemberForHistory();
    if (!mem || !this.selectedAuthorInHistory) return;
    const books = this.booksByAuthorInHistory();
    const existingIds = new Set(this.previouslyBorrowedRecords().map(r => r.book_id));
    const booksToAdd = books.filter(b => !existingIds.has(b.book_id));
    if (booksToAdd.length === 0) {
      this.errorMessage.set('All books by this author are already in this member\'s history.');
      return;
    }

    let completed = 0;
    booksToAdd.forEach(b => {
      const payload: PastBookItem = {
        book_id: b.book_id,
        title: b.title,
        date_borrowed: this.historyPastBookDate,
        notes: `All books by ${this.selectedAuthorInHistory}`
      };
      this.memberService.addPastBook(mem.member_id, payload).subscribe({
        next: () => {
          completed++;
          if (completed === booksToAdd.length) {
            this.showSuccess(`Added ${completed} book(s) by ${this.selectedAuthorInHistory} to ${mem.name}'s history.`);
            this.loadMemberCompleteHistory(mem.member_id);
            this.loadMembers(this.currentPage);
          }
        }
      });
    });
  }

  isBookInFormPastList(bookId: string): boolean {
    return this.pastBooksFormList.some(pb => pb.book_id === bookId);
  }

  isBookInHistoryRecords(bookId: string): boolean {
    return this.previouslyBorrowedRecords().some(r => r.book_id === bookId);
  }

  addBookToFormPastBooks(book: BackendBook): void {
    if (this.pastBooksFormList.some(pb => pb.book_id === book.book_id)) {
      this.errorMessage.set(`Book ${book.book_id} is already in the past books list.`);
      return;
    }
    this.pastBooksFormList.push({
      book_id: book.book_id,
      title: book.title,
      date_borrowed: new Date().toISOString().split('T')[0]
    });
    this.pastBookSearchQuery = '';
  }

  removeBookFromFormPastBooks(bookId: string): void {
    this.pastBooksFormList = this.pastBooksFormList.filter(pb => pb.book_id !== bookId);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveMember(): void {
    if (!this.memberForm.name || !this.memberForm.phone || !this.memberForm.email || !this.memberForm.subscription_type_id) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    this.memberForm.past_books = this.pastBooksFormList;
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
    this.selectedMemberDetails.set(member);
    this.isLoadingHistory.set(true);
    this.isHistoryModalOpen.set(true);
    this.historyActiveTab.set('all_borrowed');
    this.historyBookSearchQuery = '';
    this.historySelectedBookToAdd = '';

    this.loadMemberCompleteHistory(member.member_id);
  }

  loadMemberCompleteHistory(memberId: string): void {
    this.memberService.getMemberBorrowingHistory(memberId).subscribe({
      next: (res) => {
        const orderList = Array.isArray(res) ? res : (res?.orders || []);
        if (res?.member) {
          this.selectedMemberDetails.set(res.member);
        }
        this.memberHistory.set(orderList);
      },
      error: (err) => {
        this.errorMessage.set(this.errorService.getErrorMessage(err));
      }
    });

    this.memberService.getMemberPreviouslyBorrowedBooks(memberId).subscribe({
      next: (res) => {
        this.previouslyBorrowedRecords.set(res.items || []);
        this.totalUniqueBooksBorrowed.set(res.total_borrowed_unique_books || 0);
        this.isLoadingHistory.set(false);
      },
      error: (err) => {
        this.isLoadingHistory.set(false);
        this.errorMessage.set(this.errorService.getErrorMessage(err));
      }
    });
  }

  get filteredBooksForHistorySearch(): BackendBook[] {
    const q = this.historyBookSearchQuery.trim().toLowerCase();
    if (!q) return [];
    let tamilQ = '';
    if (/[a-zA-Z]/.test(q)) {
      try {
        tamilQ = transliterate(q).toLowerCase();
      } catch {}
    }
    return this.availableBooks().filter(b => {
      const title = (b.title || '').toLowerCase();
      const author = (b.author || '').toLowerCase();
      const id = (b.book_id || '').toLowerCase();
      return title.includes(q) || author.includes(q) || id.includes(q) ||
        (tamilQ && (title.includes(tamilQ) || author.includes(tamilQ)));
    }).slice(0, 15);
  }

  addPastBookToExistingMember(book: BackendBook): void {
    const mem = this.selectedMemberForHistory();
    if (!mem) return;

    if (this.previouslyBorrowedRecords().some(r => r.book_id === book.book_id)) {
      this.errorMessage.set(`Book ${book.title} (${book.book_id}) is already recorded in member's borrowed history.`);
      return;
    }

    const payload: PastBookItem = {
      book_id: book.book_id,
      title: book.title,
      date_borrowed: this.historyPastBookDate,
      notes: this.historyPastBookNotes || 'Added to previous history'
    };

    this.memberService.addPastBook(mem.member_id, payload).subscribe({
      next: () => {
        this.showSuccess(`Added "${book.title}" to ${mem.name}'s prior reading history.`);
        this.historyBookSearchQuery = '';
        this.historyPastBookNotes = '';
        this.loadMemberCompleteHistory(mem.member_id);
        this.loadMembers(this.currentPage);
      },
      error: (err) => this.errorMessage.set(this.errorService.getErrorMessage(err))
    });
  }

  removePastBookFromExistingMember(bookId: string): void {
    const mem = this.selectedMemberForHistory();
    if (!mem) return;

    if (!confirm(`Remove this book record from member's history?`)) return;

    this.memberService.removePastBook(mem.member_id, bookId).subscribe({
      next: () => {
        this.showSuccess(`Removed book from member's past record.`);
        this.loadMemberCompleteHistory(mem.member_id);
        this.loadMembers(this.currentPage);
      },
      error: (err) => this.errorMessage.set(this.errorService.getErrorMessage(err))
    });
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen.set(false);
    this.selectedMemberForHistory.set(null);
    this.selectedMemberDetails.set(null);
  }

  toggleDepositRefundInModal(returnedStatus: boolean): void {
    const mem = this.selectedMemberForHistory();
    if (!mem) return;

    const today = new Date().toISOString().split('T')[0];
    const notes = returnedStatus ? 'Deposit refunded to member' : '';

    this.memberService.toggleDepositRefund(mem.member_id, {
      security_deposit_returned: returnedStatus,
      security_deposit_returned_date: returnedStatus ? today : undefined,
      security_deposit_notes: notes
    }).subscribe({
      next: (updatedMember) => {
        this.showSuccess(`Security deposit status updated for member ${mem.member_id}.`);
        this.selectedMemberDetails.update(prev => ({
          ...prev,
          security_deposit_returned: updatedMember.security_deposit_returned,
          security_deposit_returned_date: updatedMember.security_deposit_returned_date,
          security_deposit_notes: updatedMember.security_deposit_notes
        }));
        this.loadMembers(this.currentPage);
      },
      error: (err) => {
        this.errorMessage.set(this.errorService.getErrorMessage(err));
      }
    });
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
