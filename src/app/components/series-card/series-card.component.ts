import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { SeriesGroup } from '../../models/book.model';

@Component({
  selector: 'app-series-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './series-card.component.html',
  styleUrl: './series-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeriesCardComponent {

  @Input({ required: true })
  series!: SeriesGroup;

  imgError = signal(false);

  onImgError(): void {
    this.imgError.set(true);
  }
}