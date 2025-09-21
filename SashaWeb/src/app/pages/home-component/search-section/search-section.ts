import { Component } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DropdownMenu } from './dropdown-menu/dropdown-menu';

@Component({
  selector: 'app-search-section',
  imports: [
    NzIconModule,
    DropdownMenu
  ],
  templateUrl: './search-section.html',
  styleUrl: './search-section.less'
})
export class SearchSection {
  searchImgPath = 'assets/images/search-bar-bg.jpg'
  
  scrollDown() {
    window.scrollBy({
      top: window.innerHeight,
      left: 0,
      behavior: 'smooth'
    });
  }
}
