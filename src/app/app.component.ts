import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { SeoService } from './services/seo.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    @if (!isAdminRoute()) {
      <a class="skip-link" href="#main-content">Skip to main content</a>
      <app-navbar></app-navbar>
      <main id="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    main {
      min-height: calc(100vh - 80px);
    }
  `]
})
export class AppComponent implements OnInit {
  private seoService = inject(SeoService);
  private router = inject(Router);

  isAdminRoute = signal<boolean>(false);

  ngOnInit(): void {
    this.seoService.init();

    this.checkAdminRoute(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkAdminRoute(event.urlAfterRedirects || event.url);
      });
  }

  private checkAdminRoute(url: string): void {
    const isAdmin = url.startsWith('/admin');
    this.isAdminRoute.set(isAdmin);
  }
}
