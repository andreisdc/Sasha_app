import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyCardComponent } from '../property-card-component/property-card-component';
import { BadgeComponent } from '../badge-component/badge-component';
import { ButtonComponent } from '../button-component/button-component';

interface Category {
  id: string;
  label: string;
  icon: string;
  count: number;
}

interface Property {
  id: string;
  title: string;
  location: string;
  image: string;
  price: string;
  rating: number;
  reviews: number;
  category: string;
}

@Component({
  selector: 'app-properties-section',
  standalone: true,
  imports: [
    CommonModule, 
    PropertyCardComponent, 
    BadgeComponent, 
    ButtonComponent
  ],
  templateUrl: './properties-section-component.html',
  styleUrls: ['./properties-section-component.less']
})
export class PropertiesSectionComponent {
  categories: Category[] = [
    { id: 'luxury', label: 'Luxury', icon: 'star', count: 1245 },
    { id: 'beach', label: 'Beachfront', icon: 'waves', count: 892 },
    { id: 'mountain', label: 'Mountain', icon: 'tree-pine', count: 634 },
    { id: 'city', label: 'City Center', icon: 'building', count: 2156 },
    { id: 'villa', label: 'Private Villas', icon: 'home', count: 423 },
    { id: 'trending', label: 'Trending', icon: 'trending-up', count: 789 }
  ];

  properties: Property[] = [
    {
      id: '1',
      title: 'Oceanview Paradise Resort',
      location: 'Maldives',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400',
      price: '450',
      rating: 4.9,
      reviews: 342,
      category: 'Luxury'
    },
    {
      id: '2',
      title: 'Mountain Lodge Retreat',
      location: 'Swiss Alps',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
      price: '280',
      rating: 4.8,
      reviews: 156,
      category: 'Mountain'
    },
    {
      id: '3',
      title: 'Urban Loft Downtown',
      location: 'New York City',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
      price: '195',
      rating: 4.6,
      reviews: 89,
      category: 'City'
    },
    {
      id: '4',
      title: 'Beachside Villa',
      location: 'Santorini, Greece',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400',
      price: '320',
      rating: 4.9,
      reviews: 234,
      category: 'Villa'
    },
    {
      id: '5',
      title: 'Tropical Beach Resort',
      location: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400',
      price: '165',
      rating: 4.7,
      reviews: 412,
      category: 'Beach'
    },
    {
      id: '6',
      title: 'Desert Glamping Experience',
      location: 'Dubai, UAE',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      price: '380',
      rating: 4.8,
      reviews: 98,
      category: 'Trending'
    }
  ];

  getIconSvg(iconName: string): string {
    const icons: { [key: string]: string } = {
      'star': '⭐',
      'waves': '🌊',
      'tree-pine': '🌲',
      'building': '🏢',
      'home': '🏠',
      'trending-up': '📈'
    };
    return icons[iconName] || '●';
  }
}