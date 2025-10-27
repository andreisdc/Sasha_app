import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Navbar } from "../../components/navbar/navbar";

// Import data from JSON
import * as destinationData from './destination-data.json';

interface TravelPreference {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  selected: boolean;
}

interface TravelStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  selected: boolean;
}

interface Season {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  selected: boolean;
}

interface Duration {
  id: string;
  name: string;
  days: number;
  description: string;
  selected: boolean;
}

interface Recommendation {
  id: string;
  name: string;
  county: string;
  type: string;
  image: string;
  description: string;
  matchScore: number;
  reasons: string[];
  bestFor: string[];
  highlights: string[];
}

@Component({
  selector: 'app-destination-county-page',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './destination-county-page.html',
  styleUrls: ['./destination-county-page.less'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'scale(0.9)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class DestinationCountyPage implements OnInit {
  // Selection process steps
  currentStep: number = 1;
  totalSteps: number = 4;
  
  // User data
  preferences: TravelPreference[] = [];
  travelStyles: TravelStyle[] = [];
  seasons: Season[] = [];
  durations: Duration[] = [];
  
  // Results
  recommendations: Recommendation[] = [];
  isLoading: boolean = false;
  showResults: boolean = false;
  
  // Current selections
  selectedPreferences: string[] = [];
  selectedTravelStyle: string = '';
  selectedSeason: string = '';
  selectedDuration: string = '';

  // Mapping between preferences and database activity codes
  private preferenceToActivityMap: { [key: string]: string[] } = {
    'adventure': ['hiking', 'biking', 'climbing', 'kayaking', 'rafting', 'paragliding', 'zipline'],
    'culture': ['museum', 'historical_site', 'art_gallery', 'theatre', 'local_market', 'winery_tour'],
    'nature': ['hiking', 'swimming', 'fishing', 'camping', 'beach'],
    'wellness': ['spa', 'yoga', 'meditation', 'hot_springs'],
    'gastronomy': ['restaurant', 'bar', 'cafe', 'local_food', 'wine_tasting'],
    'photography': ['museum', 'historical_site', 'art_gallery', 'hiking', 'beach'],
    'family': ['playground', 'zoo', 'aquarium', 'amusement_park', 'beach', 'swimming'],
    'romantic': ['restaurant', 'wine_tasting', 'spa', 'beach', 'hot_springs']
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    // Load data from JSON
    const data = (destinationData as any).default || destinationData;
    
    this.preferences = data.preferences.map((pref: any) => ({
      ...pref,
      selected: false
    }));
    
    this.travelStyles = data.travelStyles.map((style: any) => ({
      ...style,
      selected: false
    }));
    
    this.seasons = data.seasons.map((season: any) => ({
      ...season,
      selected: false
    }));
    
    this.durations = data.durations.map((duration: any) => ({
      ...duration,
      selected: false
    }));
  }

  // Navigation between steps
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Preferences selection (multiple)
  togglePreference(preferenceId: string) {
    const preference = this.preferences.find(p => p.id === preferenceId);
    if (preference) {
      preference.selected = !preference.selected;
      
      if (preference.selected) {
        this.selectedPreferences.push(preferenceId);
      } else {
        this.selectedPreferences = this.selectedPreferences.filter(id => id !== preferenceId);
      }
    }
  }

  // Travel style selection (single)
  selectTravelStyle(styleId: string) {
    this.travelStyles.forEach(style => {
      style.selected = style.id === styleId;
    });
    this.selectedTravelStyle = styleId;
  }

  // Season selection (single)
  selectSeason(seasonId: string) {
    this.seasons.forEach(season => {
      season.selected = season.id === seasonId;
    });
    this.selectedSeason = seasonId;
  }

  // Duration selection (single)
  selectDuration(durationId: string) {
    this.durations.forEach(duration => {
      duration.selected = duration.id === durationId;
    });
    this.selectedDuration = durationId;
  }

  // Check if current step is complete
  isStepComplete(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.selectedPreferences.length > 0;
      case 2:
        return this.selectedTravelStyle !== '';
      case 3:
        return this.selectedSeason !== '';
      case 4:
        return this.selectedDuration !== '';
      default:
        return false;
    }
  }

  // Generate recommendations
  generateRecommendations() {
    this.isLoading = true;
    this.showResults = false;
    
    // Simulate delay to show loading
    setTimeout(() => {
      const data = (destinationData as any).default || destinationData;
      this.recommendations = this.calculateRecommendations(data.recommendations);
      this.isLoading = false;
      this.showResults = true;
      this.cdr.detectChanges();

      // After 5 seconds, navigate to /properties with all parameters
      setTimeout(() => {
        this.navigateToProperties();
      }, 5000);

    }, 1500);
  }

  private calculateRecommendations(allRecommendations: any[]): Recommendation[] {
    return allRecommendations
      .map(rec => {
        let score = 0;
        const reasons: string[] = [];
        const bestFor: string[] = [];

        // Calculate score based on preferences
        this.selectedPreferences.forEach(pref => {
          if (rec.tags.includes(pref)) {
            score += 25;
            reasons.push(`Perfect for ${this.getPreferenceName(pref)}`);
            bestFor.push(this.getPreferenceName(pref));
          }
        });

        // Bonus for travel style
        if (rec.travelStyles.includes(this.selectedTravelStyle)) {
          score += 20;
          reasons.push(`Ideal for ${this.getTravelStyleName(this.selectedTravelStyle)}`);
        }

        // Bonus for season
        if (rec.bestSeasons.includes(this.selectedSeason)) {
          score += 15;
          reasons.push(`Excellent in ${this.getSeasonName(this.selectedSeason)}`);
        }

        // Bonus for duration
        if (rec.recommendedDuration === this.selectedDuration) {
          score += 10;
          reasons.push(`Perfect for a ${this.getDurationName(this.selectedDuration)} getaway`);
        }

        return {
          ...rec,
          matchScore: Math.min(score, 100),
          reasons: reasons.slice(0, 3), // Max 3 reasons
          bestFor: bestFor.slice(0, 2) // Max 2 categories
        };
      })
      .filter(rec => rec.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6); // Top 6 recommendations
  }

  // Helper methods to get names from IDs
  private getPreferenceName(prefId: string): string {
    return this.preferences.find(p => p.id === prefId)?.name || prefId;
  }

  private getTravelStyleName(styleId: string): string {
    return this.travelStyles.find(s => s.id === styleId)?.name || styleId;
  }

  private getSeasonName(seasonId: string): string {
    return this.seasons.find(s => s.id === seasonId)?.name || seasonId;
  }

  private getDurationName(durationId: string): string {
    return this.durations.find(d => d.id === durationId)?.name || durationId;
  }

  // Helper for match colors
  getMatchColor(score: number): string {
    if (score >= 80) return '#10B981'; // Green for excellent match
    if (score >= 60) return '#3B82F6'; // Blue for good match
    if (score >= 40) return '#F97316'; // Orange for medium match
    return '#6B7280'; // Gray for poor match
  }

  // Navigate to destination details
  navigateToDestination(slug: string) {
    this.router.navigate(['/destinations', slug]);
  }

  // Navigate to properties page with all selected parameters
  private navigateToProperties() {
    // Get activity codes based on selected preferences
    const activityCodes = this.getActivityCodesFromPreferences();
    
    // Prepare query parameters
    const queryParams: any = {
      source: 'destination-finder'
    };

    // Add preferences as activities
    if (activityCodes.length > 0) {
      queryParams.activities = activityCodes.join(',');
    }

    // Add travel style
    if (this.selectedTravelStyle) {
      queryParams.travelStyle = this.selectedTravelStyle;
    }

    // Add season
    if (this.selectedSeason) {
      queryParams.season = this.selectedSeason;
    }

    // Add duration
    if (this.selectedDuration) {
      const durationDays = this.getDurationDays(this.selectedDuration);
      if (durationDays) {
        queryParams.duration = durationDays;
      }
    }

    // Add selected preferences for display
    if (this.selectedPreferences.length > 0) {
      queryParams.preferences = this.selectedPreferences.join(',');
    }

    console.log('Navigating to properties with params:', queryParams);
    
    // Navigate to properties page
    this.router.navigate(['/properties'], { queryParams: queryParams });
  }

  // Map preferences to activity codes from database
  private getActivityCodesFromPreferences(): string[] {
    const activityCodes: string[] = [];
    
    this.selectedPreferences.forEach(preferenceId => {
      const codes = this.preferenceToActivityMap[preferenceId];
      if (codes) {
        activityCodes.push(...codes);
      }
    });

    // Remove duplicates and return
    return [...new Set(activityCodes)];
  }

  // Get duration in days
  private getDurationDays(durationId: string): number {
    const duration = this.durations.find(d => d.id === durationId);
    return duration ? duration.days : 0;
  }

  // Restart process
  restartSelection() {
    this.currentStep = 1;
    this.showResults = false;
    this.selectedPreferences = [];
    this.selectedTravelStyle = '';
    this.selectedSeason = '';
    this.selectedDuration = '';
    
    // Reset all selections
    this.preferences.forEach(p => p.selected = false);
    this.travelStyles.forEach(s => s.selected = false);
    this.seasons.forEach(s => s.selected = false);
    this.durations.forEach(d => d.selected = false);
  }

  // Getter for progress
  get progressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  // Getter for current step title
  get currentStepTitle(): string {
    const titles = [
      '',
      'What type of experience are you looking for?',
      'How do you like to travel?',
      'When do you want to go?',
      'How much time do you have?'
    ];
    return titles[this.currentStep];
  }

  // Getter for current step description
  get currentStepDescription(): string {
    const descriptions = [
      '',
      'Choose the types of activities and attractions that interest you',
      'Select your preferred travel style',
      'Choose the season you plan to travel',
      'Tell us how many days you want to spend'
    ];
    return descriptions[this.currentStep];
  }
}