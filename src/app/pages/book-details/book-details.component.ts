import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap, catchError, of } from 'rxjs';
import { BookService } from '../../services/book.service';
import { ContactService } from '../../services/contact.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './book-details.component.html',
  styleUrl: './book-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private contactService = inject(ContactService);

  book = signal<Book | null>(null);
  notFound = signal(false);
  imgError = signal(false);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id') || '';
        return this.bookService.getBookById(id).pipe(catchError(() => of(undefined)));
      })
    ).subscribe(book => {
      if (book) {
        this.book.set(book);
      } else {
        this.notFound.set(true);
      }
    });
  }

  onEnquire(): void {
    const b = this.book();
    if (!b) return;
    const msg = `Hello! I'm interested in borrowing the book: "${b.title}"${b.author ? ' by ' + b.author : ''}. Could you please let me know if it's available?`;
    this.contactService.openWhatsApp(msg);
  }

  onImgError(): void {
    this.imgError.set(true);
  }
}
