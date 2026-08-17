import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  private readonly defaultTitle = 'Sri Krishna Lending Library | A Place to Read, Learn & Grow';
  private readonly defaultDescription = 'Sri Krishna Lending Library — Discover, borrow, and read thousands of books across fiction, non-fiction, spirituality, science, children, and more. Community library committed to knowledge.';
  private readonly defaultKeywords = 'Sri Krishna Lending Library, lending library, book library, borrow books, library membership, reading room, fiction, non-fiction, spiritual books, kids books';
  private readonly defaultImage = 'https://srikrishnalibrary.in/assets/images/og-image.jpg';
  private readonly siteName = 'Sri Krishna Lending Library';
  private readonly domain = 'https://srikrishnalibrary.in';

  public init(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => route.outlet === 'primary')
    ).subscribe(route => {
      const routeData = route.snapshot.data || {};
      const routeTitle = route.snapshot.title || routeData['title'];
      
      const config: SeoConfig = {
        title: routeTitle ? `${routeTitle}` : this.defaultTitle,
        description: routeData['description'] || this.defaultDescription,
        keywords: routeData['keywords'] || this.defaultKeywords,
        image: routeData['image'] || this.defaultImage,
        type: routeData['type'] || 'website',
        url: `${this.domain}${this.router.url}`
      };

      this.updateSeo(config);
    });
  }

  public updateSeo(config: SeoConfig): void {
    const fullTitle = config.title || this.defaultTitle;
    const description = config.description || this.defaultDescription;
    const keywords = config.keywords || this.defaultKeywords;
    const image = config.image || this.defaultImage;
    const url = config.url || `${this.domain}${this.router.url}`;
    const type = config.type || 'website';

    // Page Title
    this.titleService.setTitle(fullTitle);

    // Standard Meta Tags
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'keywords', content: keywords });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    this.metaService.updateTag({ name: 'author', content: 'Sri Krishna Lending Library' });

    // Open Graph / Facebook / WhatsApp
    this.metaService.updateTag({ property: 'og:site_name', content: this.siteName });
    this.metaService.updateTag({ property: 'og:type', content: type });
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:image', content: image });
    this.metaService.updateTag({ property: 'og:image:alt', content: 'Sri Krishna Lending Library Peacock & Book Logo' });
    this.metaService.updateTag({ property: 'og:url', content: url });

    // Twitter Card
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: image });
    this.metaService.updateTag({ name: 'twitter:image:alt', content: 'Sri Krishna Lending Library Peacock & Book Logo' });

    // Update canonical link element
    this.updateCanonicalUrl(url);
  }

  private updateCanonicalUrl(url: string): void {
    let head = document.getElementsByTagName('head')[0];
    let element: HTMLLinkElement | null = document.querySelector(`link[rel='canonical']`);
    if (element === null) {
      element = document.createElement('link');
      element.setAttribute('rel', 'canonical');
      head.appendChild(element);
    }
    element.setAttribute('href', url);
  }
}
