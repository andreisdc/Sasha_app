import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
interface Activity {
  id: number;
  icon: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  color: string;
}

@Component({
  selector: 'app-activities-section',
  templateUrl: './activities-section-component.html',
  styleUrls: ['./activities-section-component.less'],
  imports:[CommonModule]
})
export class ActivitiesSectionComponent {
  activities: Activity[] = [
    {
      id: 1,
      icon: 'mountain',
      title: "Carpathian Mountains",
      description: "Hiking in Piatra Craiului and Bucegi Mountains",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
      tags: ["Hiking", "Omu Peak", "Piatra Craiului"],
      color: "forest"
    },
    {
      id: 2,
      icon: 'waves',
      title: "Danube Delta",
      description: "Boat tours through Europe's second largest delta",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400",
      tags: ["Bird Watching", "Boat Tours", "Wildlife"],
      color: "ocean"
    },
    {
      id: 3,
      icon: 'coffee',
      title: "Romanian Cuisine",
      description: "Traditional cooking classes and wine tasting",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
      tags: ["Sarmale", "Palinka", "Mici"],
      color: "sunset"
    },
    {
      id: 4,
      icon: 'shopping-bag',
      title: "Thermal Spas",
      description: "Relax in natural hot springs and wellness centers",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
      tags: ["Felix Spa", "Băile Tușnad", "Wellness"],
      color: "coral"
    },
    {
      id: 5,
      icon: 'camera',
      title: "Castle Photography",
      description: "Capture stunning medieval castles and fortresses",
      image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400",
      tags: ["Bran Castle", "Peleș Castle", "Corvin Castle"],
      color: "primary"
    },
    {
      id: 6,
      icon: 'compass',
      title: "Historic Towns",
      description: "Explore Brașov, Sibiu, and Sighișoara",
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400",
      tags: ["Medieval Towns", "Transylvania", "UNESCO Sites"],
      color: "secondary"
    }
  ];

  getIcon(iconName: string): string {
    const icons: { [key: string]: string } = {
      'mountain': '⛰️',
      'waves': '🌊',
      'coffee': '☕',
      'shopping-bag': '🛍️',
      'camera': '📷',
      'compass': '🧭'
    };
    return icons[iconName] || '📍';
  }
}