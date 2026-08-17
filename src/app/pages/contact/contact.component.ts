import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent {
  private contactService = inject(ContactService);

  onWhatsApp(): void {
    this.contactService.openWhatsApp('Hello! I would like to enquire about Sri Krishna Lending Library.');
  }

  /** Format phone number for tel: links (strips spaces) */
  telLink(phone: string): string {
    return 'tel:' + phone.replace(/\s/g, '');
  }

  mailtoLink(email: string): string {
    return 'mailto:' + email;
  }

  // REPLACE: Update with actual library contact information
  contactInfo = {
    phone: '+91 00000 00000',           // REPLACE with actual phone
    whatsapp: '+91 00000 00000',        // REPLACE with actual WhatsApp number
    email: 'info@srikrishnalibrary.in', // REPLACE with actual email
    address: '[Library Address]\n[City, State — PIN Code]', // REPLACE with actual address
    mapsUrl: 'https://maps.google.com', // REPLACE with actual Google Maps link
    hours: [
      { day: 'Monday – Friday', time: '9:00 AM – 8:00 PM' }, // REPLACE with actual hours
      { day: 'Saturday',        time: '9:00 AM – 8:00 PM' }, // REPLACE with actual hours
      { day: 'Sunday',          time: '10:00 AM – 5:00 PM' },// REPLACE with actual hours
    ]
  };
}
