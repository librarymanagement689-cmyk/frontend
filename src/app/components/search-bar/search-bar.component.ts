import {
  Component, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy,
  signal, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { BookService } from '../../services/book.service';
import { BookFilter } from '../../models/book.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<BookFilter>();

  private bookService = inject(BookService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private queryChange$ = new Subject<string>();

  query = '';
  selectedCategory = '';
  selectedLanguage = '';

  categories = signal<string[]>([]);
  languages = signal<string[]>([]);

  ngOnInit(): void {
    this.bookService.getCategories().pipe(takeUntil(this.destroy$))
      .subscribe(cats => this.categories.set(cats.map(c => c.name)));

    this.bookService.getLanguages().pipe(takeUntil(this.destroy$))
      .subscribe(langs => this.languages.set(langs));

    this.queryChange$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.emit(q));
  }

  onQueryChange(val: string): void {
    this.queryChange$.next(val);
  }

  onSearch(): void {
    this.router.navigate(['/books'], {
      queryParams: this.buildParams()
    });
  }

  private emit(q: string): void {
    this.search.emit({
      query: q,
      category: this.selectedCategory || undefined,
      language: this.selectedLanguage || undefined
    });
  }

  private buildParams(): Record<string, string> {
    const p: Record<string, string> = {};
    if (this.query)            p['q'] = this.query;
    if (this.selectedCategory) p['category'] = this.selectedCategory;
    if (this.selectedLanguage) p['language'] = this.selectedLanguage;
    return p;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
