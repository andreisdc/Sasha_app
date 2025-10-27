import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { HomeService } from '../../core/home/home-service';
import { DatagridComponent } from './datagrid-component/datagrid-component';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../core/services/property.service';
import { SearchSection } from './search-section/search-section';
import { Navbar } from "../../components/navbar/navbar";
import { HeroSectionComponent } from "../../components/hero-section-component/hero-section-component";
import { PropertiesSectionComponent } from "../../components/properties-section-component/properties-section-component";
import { ActivitiesSectionComponent } from "../../components/activities-section-component/activities-section-component";
import { FooterComponent } from "../../components/footer-component/footer-component";

@Component({
  selector: 'app-home-component',
  imports: [CommonModule, DatagridComponent, SearchSection, Navbar, HeroSectionComponent, PropertiesSectionComponent, ActivitiesSectionComponent, FooterComponent],
  templateUrl: './home-component.html',
  styleUrls: ['./home-component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('categoriesRow', { static: false })
  categoriesRow!: ElementRef<HTMLElement>;

  private readonly _leftDisabled = signal(true);
  private readonly _rightDisabled = signal(false);
  private readonly _selectedCategory = signal<string>('All Categories');

  get leftDisabled(): boolean {
    return this._leftDisabled();
  }
  get rightDisabled(): boolean {
    return this._rightDisabled();
  }
  get selectedCategory(): string {
    return this._selectedCategory();
  }

  private categoryEmojis: Map<string, number> = new Map<string, number>([
    ['🏖️ apartament', 6],
    ['🏔️ villa', 4],
    ['🏙️ house', 4],
    ['🌲 guesthouse', 4],
    ['🏞️ chalet', 3],
    ['🏜️ hotel', 3],
    ['🏝️ hostel', 3],
    ['🏘️ suite', 3],
  ]);

  private readonly homeService = inject(HomeService);
  private readonly propertyService = inject(PropertyService);

  originalOrder = (): number => 0;

  ngAfterViewInit(): void {
    setTimeout(() => this.updateButtons(), 0);
  }

  scrollLeft(): void {
    const el = this.categoriesRow?.nativeElement;
    if (!el) return;
    this.scrollBySmooth(el, -240, 420);
  }

  scrollRight(): void {
    const el = this.categoriesRow?.nativeElement;
    if (!el) return;
    this.scrollBySmooth(el, 240, 420);
  }

  get categoriesArray() {
    return [...this.categoryEmojis.entries()].map(([key, value]) => ({
      key,
      value,
    }));
  }

  updateButtons(): void {
    const el = this.categoriesRow?.nativeElement;
    if (!el) return;
    this._leftDisabled.set(el.scrollLeft <= 0);
    this._rightDisabled.set(
      el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    );
  }

  private scrollBySmooth(el: HTMLElement, delta: number, duration = 360): void {
    const start = el.scrollLeft;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.max(0, Math.min(start + delta, maxScroll));
    const change = target - start;
    const startTime = performance.now();

    const ease = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      el.scrollLeft = start + change * ease(t);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        el.scrollLeft = target;
        this.updateButtons();
      }
    };

    requestAnimationFrame(step);
  }

  GetCategory(category: string): void {
    this._selectedCategory.set(category);
    this.propertyService.setSelectedCategory(category);
  }
}
