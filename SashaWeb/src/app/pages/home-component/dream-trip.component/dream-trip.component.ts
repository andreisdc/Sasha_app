// dream-trip.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dream-trip',
  imports: [CommonModule],
  templateUrl: './dream-trip.component.html',
  styleUrls: ['./dream-trip.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DreamTripComponent {
  services = [
    {
      title: 'Restaurant Reservations',
      description: 'We\'ll book the perfect dining experiences based on your taste',
      icon: '🍽️'
    },
    {
      title: 'Event Tickets',
      description: 'Get access to concerts, shows, and local cultural events',
      icon: '🎭'
    },
    {
      title: 'Photo Tours',
      description: 'Capture memories with professional photographers and guides',
      icon: '📸'
    },
    {
      title: 'Transportation',
      description: 'Seamless transfers and local transportation arrangements',
      icon: '🚗'
    }
  ];
}