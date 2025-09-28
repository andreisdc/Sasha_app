// adventures.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-adventures',
  imports: [CommonModule],
  templateUrl: './adventures.component.html',
  styleUrls: ['./adventures.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdventuresComponent {
  categories = [

    {
      mainTitle: 'Hiking, climbing, and extreme sports',
      activities: ['Hiking', 'Climbing', 'Explore'],
      description: 'Thrilling outdoor adventures for adrenaline seekers'
    },
    {
      mainTitle: 'Adventure Sports',
      activities: ['Diving', 'Surfing', 'Boat Tours', 'Explore'],
      description: 'Diving, surfing, and boat tours'
    },
    {
      mainTitle: 'Food & Culture',
      activities: ['Food Tours', 'Wine Tasting', 'Explore'],
      description: 'Culinary journeys and cultural experiences'
    },
    {
      mainTitle: 'Food & Culture Experiences',
      activities: ['Food Tours', 'Wine Tasting', 'Explore'],
      description: 'Authentic local flavors and traditions'
    }
    ,
    {
      mainTitle: 'Spa treatments and local markets',
      activities: ['Spa', 'Markets', 'Wellness', 'Explore'],
      description: 'Relaxation and local shopping experiences'
    },
    {
      mainTitle: 'Photography Tours',
      activities: ['Photography', 'Tours', 'Workshops', 'Explore'],
      description: 'Capture the perfect moments'
    },


  ];
}