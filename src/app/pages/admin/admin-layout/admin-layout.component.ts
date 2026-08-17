import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { GlobalSearchService, GlobalSearchResult } from '../../../services/global-search.service';
import { ToastComponent } from '../../../components/toast/toast.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet, RouterLinkActive, ToastComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  globalSearchService = inject(GlobalSearchService);
  private router = inject(Router);

  isMobileMenuOpen = signal(false);

  // Global Search
  searchQuery = '';
  searchResults = signal<GlobalSearchResult | null>(null);
  isSearching = signal(false);
  showSearchResults = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  onGlobalSearch(): void {
    if (!this.searchQuery || this.searchQuery.trim().length < 2) {
      this.searchResults.set(null);
      this.showSearchResults.set(false);
      return;
    }

    this.isSearching.set(true);
    this.showSearchResults.set(true);

    this.globalSearchService.searchAll(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      },
      error: () => this.isSearching.set(false)
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults.set(null);
    this.showSearchResults.set(false);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
