import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Sri Krishna Lending Library | Read, Learn & Grow',
    data: {
      description: 'Welcome to Sri Krishna Lending Library. Explore thousands of books in fiction, non-fiction, spirituality, self-help, children, history, and science.',
      keywords: 'Sri Krishna Lending Library, book library, borrow books, library catalog, reading community, home library'
    }
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent),
    title: 'About Us | Sri Krishna Lending Library',
    data: {
      description: 'Learn about the history, mission, and community values of Sri Krishna Lending Library. Fostering a passion for reading and lifelong learning.',
      keywords: 'about Sri Krishna Lending Library, library mission, book community, library history'
    }
  },
  {
    path: 'books',
    loadComponent: () => import('./pages/books/books.component').then(m => m.BooksComponent),
    title: 'Explore Book Collection | Sri Krishna Lending Library',
    data: {
      description: 'Browse our complete catalog of books across multiple genres and languages. Search, filter, and discover your next great read.',
      keywords: 'book catalog, search books, fiction books, spiritual books, non-fiction, lending library collection'
    }
  },
  {
    path: 'books/:id',
    loadComponent: () => import('./pages/book-details/book-details.component').then(m => m.BookDetailsComponent),
    title: 'Book Details | Sri Krishna Lending Library',
    data: {
      description: 'View detailed information, author bio, availability status, and summary of books available at Sri Krishna Lending Library.',
      keywords: 'book details, author, ISBN, book synopsis, borrow status'
    }
  },
  {
    path: 'rules',
    loadComponent: () => import('./pages/rules/rules.component').then(m => m.RulesComponent),
    title: 'Membership & Library Rules | Sri Krishna Lending Library',
    data: {
      description: 'Read the membership guidelines, borrowing limits, book return policies, and library etiquette for Sri Krishna Lending Library.',
      keywords: 'library rules, borrowing policy, membership guidelines, return policy, library fees'
    }
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact & Location | Sri Krishna Lending Library',
    data: {
      description: 'Get in touch with Sri Krishna Lending Library. View opening hours, address, phone number, email, and location map.',
      keywords: 'contact library, library location, library address, opening hours, phone number'
    }
  },

  // --- Admin Routes ---
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin/login/login.component').then(m => m.AdminLoginComponent),
    title: 'Admin Portal Sign In | Sri Krishna Lending Library'
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Admin Dashboard | Sri Krishna Lending Library'
      },
      {
        path: 'books',
        loadComponent: () => import('./pages/admin/admin-books/admin-books.component').then(m => m.AdminBooksComponent),
        title: 'Admin Book Management | Sri Krishna Lending Library'
      },
      {
        path: 'members',
        loadComponent: () => import('./pages/admin/admin-members/admin-members.component').then(m => m.AdminMembersComponent),
        title: 'Admin Member Management | Sri Krishna Lending Library'
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./pages/admin/admin-subscriptions/admin-subscriptions.component').then(m => m.AdminSubscriptionsComponent),
        title: 'Admin Subscriptions | Sri Krishna Lending Library'
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/admin/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent),
        title: 'Admin Lending Orders & Returns | Sri Krishna Lending Library'
      },
      {
        path: 'due-soon',
        loadComponent: () => import('./pages/admin/due-soon/due-soon.component').then(m => m.DueSoonComponent),
        title: 'Due Soon Loans | Sri Krishna Lending Library'
      },
      {
        path: 'overdue',
        loadComponent: () => import('./pages/admin/overdue/overdue.component').then(m => m.OverdueComponent),
        title: 'Overdue Loans | Sri Krishna Lending Library'
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/admin/reports/reports.component').then(m => m.ReportsComponent),
        title: 'Reports & Analytics | Sri Krishna Lending Library'
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];
