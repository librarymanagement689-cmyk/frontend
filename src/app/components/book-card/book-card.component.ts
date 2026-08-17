import {
  Component, Input, ChangeDetectionStrategy, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookCardComponent implements OnInit {
  @Input({ required: true }) book!: Book;
  @Input() showLink = true;

  imgError = signal(false);

  ngOnInit(): void {
    this.imgError.set(false);
  }

  onImgError(): void {
    this.imgError.set(true);
  }
}
