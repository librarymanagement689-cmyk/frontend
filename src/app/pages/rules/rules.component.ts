import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface RuleSection {
  title: string;
  iconPath: string;
  rules: string[];
  note?: string;
}

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rules.component.html',
  styleUrl: './rules.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RulesComponent {
  // REPLACE: Update these rules with the actual library rules from the library owner
  ruleSections: RuleSection[] = [
    {
      title: 'Borrowing Guidelines',
      iconPath: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20',
      rules: [
        'Members may borrow up to [X] books at a time — REPLACE with actual limit.',
        'Books can be borrowed for a period of [X] days — REPLACE with actual duration.',
        'A valid membership card must be presented when borrowing books.',
        'Members are responsible for all books borrowed on their account.',
        'Certain books may be marked as Reference Only and cannot be borrowed.',
      ]
    },
    {
      title: 'Return Policy',
      iconPath: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8',
      rules: [
        'Books must be returned on or before the due date to avoid late fees.',
        'Late returns may incur a fine of ₹[X] per day — REPLACE with actual fine amount.',
        'Books can be renewed if not reserved by another member. Contact us to renew.',
        'Returns can only be made during library opening hours.',
        'Renewing a book more than [X] times may not be permitted — REPLACE with actual limit.',
      ]
    },
    {
      title: 'Book Care',
      iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      rules: [
        'Please handle all books with care and keep them clean.',
        'Do not write in, highlight, or mark library books in any way.',
        'Keep books away from water and extreme conditions.',
        'Use bookmarks instead of folding page corners.',
        'If a book is damaged during your borrowing period, please inform us immediately.',
      ],
      note: 'Members will be charged for the cost of repair or replacement of damaged or lost books.'
    },
    {
      title: 'General Rules',
      iconPath: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-11v5m0-8v2',
      rules: [
        'Please maintain silence and decorum within the library premises.',
        'Food and beverages are not permitted inside the library.',
        'Mobile phones must be kept on silent mode inside the library.',
        'Children must be accompanied by an adult at all times.',
        'The library management reserves the right to revoke membership for misconduct.',
      ]
    },
    {
      title: 'Membership',
      iconPath: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 4h6m-3-3v6',
      rules: [
        'Membership is open to all residents of the community.',
        'A one-time registration fee of ₹[X] is required — REPLACE with actual fee.',
        'Annual membership renewal fee is ₹[X] — REPLACE with actual fee.',
        'Membership cards are non-transferable.',
        'Lost membership cards can be replaced for a nominal fee.',
      ],
      note: 'Please contact us for current membership plans and pricing.'
    },
  ];
}
