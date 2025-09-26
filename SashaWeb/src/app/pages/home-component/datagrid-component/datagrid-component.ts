import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PropertyService } from '../../../core/services/property.service';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { Property } from '../../../core/interfaces/property.interface';

@Component({
  selector: 'app-datagrid-component',

  imports: [
    CommonModule,
    NgOptimizedImage,
    NzTableModule,
    NzPaginationModule,
    NzCardModule,
    NzGridModule,
    NzIconModule,
    NzButtonModule,
    NzAvatarModule,
    NzSpinModule,
    NzCarouselModule,
  ],
  templateUrl: './datagrid-component.html',
  styleUrl: './datagrid-component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatagridComponent {
  private propertyService = inject(PropertyService);

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

  get properties(): Property[] {
    const start = (this._pageIndex() - 1) * this._pageSize();
    const end = this._pageIndex() * this._pageSize();
    return this._filteredProperties().slice(start, end);
  }

  get pageIndex(): number {
    return this._pageIndex();
  }

  get pageSize(): number {
    return this._pageSize();
  }

  get total(): number {
    return this._filteredProperties().length;
  }

  get loading(): boolean {
    return this._allProperties() === null;
  }

  onPageChange(page: number): void {
    this._pageIndex.set(page);
  }

  next(prop: Property) {
    const id = prop.id;
    this._currentIndex.update((ci) => {
      const cur = ci[id] ?? 0;
      return { ...ci, [id]: (cur + 1) % prop.images.length };
    });
  }

  prev(prop: Property) {
    const id = prop.id;
    this._currentIndex.update((ci) => {
      const cur = ci[id] ?? 0;
      return {
        ...ci,
        [id]: (cur - 1 + prop.images.length) % prop.images.length,
      };
    });
  }

  toggleLike(property: Property) {
    property.liked = !property.liked;
    console.log(
      `Property with ID ${property.id} liked status: ${property.liked}`,
    );
  }

  scrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }
}
