import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer-component.html',
  styleUrls: ['./footer-component.less']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  quickLinks = [
    { name: 'About', path: '/about' },
    { name: 'Properties', path: '/properties' },
    { name: 'Activities', path: '/activities' },
    { name: 'Guide', path: '/guide' },
    { name: 'Contact', path: '/contact' }
  ];

  contactInfo = [
    { icon: '📞', text: '+40 721 123 456' },
    { icon: '✉️', text: 'contact@romania-travel.ro' },
    { icon: '📍', text: 'Bucharest, Romania' }
  ];

  socialLinks = [
    { name: 'Facebook', icon: '📘', url: '#' },
    { name: 'Instagram', icon: '📷', url: '#' },
    { name: 'Twitter', icon: '🐦', url: '#' },
    { name: 'YouTube', icon: '📺', url: '#' }
  ];

  services = [
    'Rural Tourism',
    'Mountain Trips', 
    'Cultural Tours',
    'Accommodation',
    'Tour Guides'
  ];
}