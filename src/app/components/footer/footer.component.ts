import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  quickLinks = [
    { label: 'Home',         route: '/'        },
    { label: 'About Us',     route: '/about'   },
    { label: 'Books',        route: '/books'   },
    { label: 'Library Rules',route: '/rules'   },
    { label: 'Contact',      route: '/contact' },
  ];

  usefulLinks = [
    { label: 'How to Borrow', route: '/rules'   },
    { label: 'Return Policy', route: '/rules'   },
    { label: 'Book Care',     route: '/rules'   },
    { label: 'FAQs',          route: '/contact' },
  ];
}
