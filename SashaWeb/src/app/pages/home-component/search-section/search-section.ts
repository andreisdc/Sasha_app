import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DropdownMenu } from './dropdown-menu/dropdown-menu';

@Component({
  selector: 'app-search-section',
  imports: [NzIconModule, DropdownMenu, NgOptimizedImage],
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

  toggleGuestDropdown() {
    this.showGuestDropdown.update((value) => !value);
    console.log('Guest dropdown toggled!');
  }
}
