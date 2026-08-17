import {
  Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { BookService, mapBackendBookToBook } from '../../services/book.service';
import { ErrorService } from '../../services/error.service';
import { BookCardComponent } from '../../components/book-card/book-card.component';
import { SeriesCardComponent } from '../../components/series-card/series-card.component';
import { SectionHeadingComponent } from '../../components/section-heading/section-heading.component';
import { Book, BookFilter, CatalogItem, SeriesGroup, StandaloneBook } from '../../models/book.model';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BookCardComponent, SeriesCardComponent, SectionHeadingComponent],
  templateUrl: './books.component.html',
  styleUrl: './books.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BooksComponent implements OnInit, OnDestroy {
  private bookService = inject(BookService);
  private errorService = inject(ErrorService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();
  private queryChange$ = new Subject<string>();

  // Filter state
  searchQuery = '';
  selectedCategory = '';
  selectedLanguage = '';
  selectedAvailability: 'all' | 'available' | 'unavailable' = 'all';

  // Catalog items (mixed: series + standalone)
  catalogItems = signal<CatalogItem[]>([]);
  categories = signal<string[]>([]);
  languages = signal<string[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Summary counts
  totalCount = signal(0);
  seriesCount = signal(0);
  standaloneCount = signal(0);

  // Computed: filter catalog items by availability for standalone books
  displayedItems = computed<CatalogItem[]>(() => {
    const items = this.catalogItems();
    const avail = this.selectedAvailability;
    if (avail === 'all') return items;

    return items.filter(item => {
      if (item.type === 'series') {
        const s = item as SeriesGroup;
        if (avail === 'available') return s.available_count > 0;
        if (avail === 'unavailable') return s.available_count === 0;
        return true;
      } else {
        const b = item as StandaloneBook;
        if (avail === 'available') return b.available;
        if (avail === 'unavailable') return !b.available;
        return true;
      }
    });
  });

  ngOnInit(): void {
    // Load category and language options from backend
    this.bookService.getCategories().pipe(takeUntil(this.destroy$))
      .subscribe(cats => this.categories.set(cats.map(c => c.name)));

    this.bookService.getLanguages().pipe(takeUntil(this.destroy$))
      .subscribe(langs => this.languages.set(langs));

    // Handle query params from hero search
    this.route.queryParams.pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.searchQuery = params['q'] || '';
        this.selectedCategory = params['category'] || '';
        this.selectedLanguage = params['language'] || '';
        this.applyFilters();
      });

    // Debounced search
    this.queryChange$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());
  }

  onQueryChange(): void {
    this.queryChange$.next(this.searchQuery);
  }

  applyFilters(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filter: BookFilter = {
      query: this.searchQuery || undefined,
      category: this.selectedCategory || undefined,
      language: this.selectedLanguage || undefined,
    };

    this.fetchCatalog(filter);
  }

  fetchCatalog(filter: BookFilter): void {
    this.bookService.getPublicCatalog(filter, 200).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        this.catalogItems.set(res.items);
        this.totalCount.set(res.total);
        this.seriesCount.set(res.series_count);
        this.standaloneCount.set(res.standalone_count);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.errorService.getErrorMessage(err));
      }
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedLanguage = '';
    this.selectedAvailability = 'all';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedCategory || this.selectedLanguage || this.selectedAvailability !== 'all');
  }

  // Type guards for template
  isSeries(item: CatalogItem): item is SeriesGroup {
    return item.type === 'series';
  }

  isBook(item: CatalogItem): item is StandaloneBook {
    return item.type === 'book';
  }

  // Convert standalone book to Book shape for BookCardComponent
  toBook(item: StandaloneBook): Book {
    return {
      id: item.book_id,
      book_id: item.book_id,
      title: item.title,
      author: item.author,
      category: item.category,
      language: item.language,
      status: item.status,
      available: item.available,
      imageUrl: item.image_url,
      image_url: item.image_url,
      price: item.price,
    };
  }

  trackItem(_: number, item: CatalogItem): string {
    if (item.type === 'series') return 'series:' + (item as SeriesGroup).series_name;
    return 'book:' + (item as StandaloneBook).book_id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
