import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionHeadingComponent } from '../../components/section-heading/section-heading.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, SectionHeadingComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent {
  highlights = [
    { value: '4000+',    label: 'Books in Collection',    icon: 'book'   },
    { value: '7+',       label: 'Book Categories',         icon: 'layers' },
    { value: 'Multiple', label: 'Languages',               icon: 'globe'  },
    { value: 'Trusted',  label: 'Reading Community',       icon: 'heart'  },
  ];
}
