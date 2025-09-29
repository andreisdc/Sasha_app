import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DropdownMenu } from './dropdown-menu/dropdown-menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-search-section',
  imports: [
    NzIconModule,
    DropdownMenu,
    NgOptimizedImage,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
  ],
  templateUrl: './search-section.html',
  styleUrl: './search-section.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchSection {
  // TODO: Migrate <img [src]="searchImgPath" /> to NgOptimizedImage with ngSrc in the template
  searchImgPath = 'assets/images/search-bar-bg.jpg';

  scrollDown() {
    window.scrollBy({
      top: window.innerHeight,
      left: 0,
      behavior: 'smooth',
    });
  }

  showGuestDropdown = signal(false);
  adultsCount = 0;
  childrenCount = 0;
  infantsCount = 0;
  petsCount = 0;
  get guestsTotal(): number {
    return (
      this.adultsCount + this.childrenCount + this.infantsCount + this.petsCount
    );
  }

  get guestsPlaceholder(): string {
    return this.guestsTotal === 0
      ? 'How many guests...'
      : `${this.guestsTotal} guests`;
  }

  toggleGuestDropdown() {
    this.showGuestDropdown.update((value) => !value);
    console.log('Guest dropdown toggled!');
  }
}
