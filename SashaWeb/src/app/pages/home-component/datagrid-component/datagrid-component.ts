import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  OnInit,
} from '@angular/core';
import { PropertyService, Property } from '../../../core/services/property-service'; // 👈 Importă Property de aici
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-datagrid-component',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    FormsModule,
    NzPaginationModule,
    NzCardModule,
    NzIconModule,
    NzButtonModule,
    NzSpinModule,
    NzTagModule,
    NzRateModule,
  ],
  templateUrl: './datagrid-component.html',
  styleUrl: './datagrid-component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatagridComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private router = inject(Router);

  // Signals - folosim Property din serviciu
  properties = signal<Property[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  pageIndex = signal(1);
  pageSize = signal(12);
  totalProperties = signal(0);

  // Computed
  paginatedProperties = computed(() => {
    const startIndex = (this.pageIndex() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return this.properties().slice(startIndex, endIndex);
  });

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties() {
    this.loading.set(true);
    this.error.set(null);

    this.propertyService.getAllVerifiedProperties().subscribe({
      next: (properties) => {
        this.properties.set(properties);
        this.totalProperties.set(properties.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load properties. Please try again.');
        this.loading.set(false);
        console.error('Error loading properties:', err);
      }
    });
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateToProperty(propertyId: string): void {
    this.router.navigate(['/property', propertyId]);
  }

  toggleLike(property: Property, event: Event): void {
    event.stopPropagation();
  }

  formatPrice(price: number): string {
    return `€${price.toLocaleString()}`;
  }

  getPropertyTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'apartment': 'home',
      'hotel': 'building',
      'house': 'home',
      'villa': 'crown',
      'cabin': 'tree',
      'cottage': 'tree',
      'chalet': 'tree',
      'studio': 'appstore',
      'loft': 'build',
      'bungalow': 'home'
    };
    return icons[type?.toLowerCase()] || 'home';
  }

  getPropertyTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'apartment': 'Apartment',
      'hotel': 'Hotel',
      'house': 'House',
      'villa': 'Villa',
      'cabin': 'Cabin',
      'cottage': 'Cottage',
      'chalet': 'Chalet',
      'studio': 'Studio',
      'loft': 'Loft',
      'bungalow': 'Bungalow'
    };
    return labels[type?.toLowerCase()] || type;
  }
}