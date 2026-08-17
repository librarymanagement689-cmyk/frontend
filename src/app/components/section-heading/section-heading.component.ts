import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="section-heading" [class.section-heading--center]="centered" [class.section-heading--light]="light">
      @if (eyebrow) {
        <span class="eyebrow">{{ eyebrow }}</span>
      }
      <h2 class="section-heading__title">{{ title }}</h2>
      @if (subtitle) {
        <p class="section-heading__subtitle">{{ subtitle }}</p>
      }
      <div class="section-heading__rule" aria-hidden="true"></div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .section-heading {
      max-width: 620px;

      &--center {
        text-align: center;
        margin-left: auto;
        margin-right: auto;

        .section-heading__rule {
          margin-left: auto;
          margin-right: auto;
        }
      }

      &--light {
        .section-heading__title { color: $color-white; }
        .section-heading__subtitle { color: rgba($color-white, 0.7); }
      }

      &__title {
        @include serif-heading($fs-3xl);
        color: $color-navy;
        margin-bottom: $space-3;

        @include lg {
          font-size: $fs-4xl;
        }
      }

      &__subtitle {
        font-size: $fs-md;
        color: $color-text-muted;
        line-height: 1.6;
        margin-bottom: $space-2;
      }

      &__rule {
        width: 48px;
        height: 2px;
        background: $color-gold;
        border-radius: 99px;
        margin-top: $space-4;
      }
    }
  `]
})
export class SectionHeadingComponent {
  @Input() eyebrow?: string;
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() centered = false;
  @Input() light = false;
}
