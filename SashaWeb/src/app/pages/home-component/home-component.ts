import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { HomeService } from '../../core/home/home-service';
import { DatagridComponent } from './datagrid-component/datagrid-component';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../core/services/property.service';
import { SearchSection } from "./search-section/search-section";

@Component({
  selector: 'app-home-component',
  imports: [CommonModule, DatagridComponent, HttpClientModule, SearchSection],
  templateUrl: './home-component.html',
  styleUrls: ['./home-component.less'],
  standalone: true,
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('categoriesRow', { static: false })
  categoriesRow!: ElementRef<HTMLElement>;

  leftDisabled = true;
  rightDisabled = false;
  selectedCategory: string | null = 'All Categories';

  private categoryEmojis: Map<string, number> = new Map([
    ['🏖️ apartament', 6],
    ['🏔️ villa', 4],
    ['🏙️ house', 4],
    ['🌲 guesthouse', 4],
    ['🏞️ chalet', 3],
    ['🏜️ hotel', 3],
    ['🏝️ hostel', 3],
    ['🏘️ suite', 3],
  ]);

  constructor(
    private homeService: HomeService,
    private propertyService: PropertyService,
  ) {}

  ngOnInit(): void {
    // Categories are now defined in categoryEmojis
  }

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
    this.leftDisabled = el.scrollLeft <= 0;
    this.rightDisabled = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
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
    this.selectedCategory = category;
    this.propertyService.setSelectedCategory(category);
  }
}
