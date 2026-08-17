import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookService } from '../../services/book.service';
import { BookCardComponent } from '../../components/book-card/book-card.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    BookCardComponent, SearchBarComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private bookService = inject(BookService);

  featuredBooks = signal<Book[]>([]);

  ngOnInit(): void {
    this.bookService.getFeaturedBooks()
      .subscribe(books => this.featuredBooks.set(books));
  }
}
