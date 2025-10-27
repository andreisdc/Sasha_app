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
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { Property } from '../../../core/interfaces/property.interface';
import { RouterModule } from '@angular/router';

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
    NzCarouselModule,
    RouterModule
  ],
  templateUrl: './datagrid-component.html',
  styleUrl: './datagrid-component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatagridComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private router = inject(Router);

  // local UI state as signals
  private readonly _currentIndex = signal<Record<number, number>>({});
  get currentIndex(): Record<number, number> {
    return this._currentIndex();
  }

  private readonly _hovered = signal<number | null>(null);
  get hovered(): number | null {
    return this._hovered();
  }
  set hovered(value: number | null) {
    this._hovered.set(value);
  }

  private readonly _pageIndex = signal(1);
  private readonly _pageSize = signal(15);

  // data streams bridged to signals
  private readonly _allProperties = toSignal<Property[] | null>(
    this.propertyService.getProperties(),
    { initialValue: null },
  );

  private readonly _selectedCategory = toSignal(
    this.propertyService.selectedCategory$,
    { initialValue: 'All Categories' },
  );

  // derived state
  private readonly _filteredProperties = computed(() => {
    const all = this._allProperties();
    const category = this._selectedCategory();
    return all ? this.propertyService.getFilteredProperties(all, category) : [];
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

  onCardClick(id: number) 
  {
    this.router.navigate(['/property', id]);
    console.log('Navigating to property with ID: ${id}');
  }

  next(prop: Property) {
    const id = prop.id;
    this._currentIndex.update((ci) => {
      const cur = ci[id] ?? 0;
      return { ...ci, [id]: (cur + 1) % prop.images.length };
    });
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