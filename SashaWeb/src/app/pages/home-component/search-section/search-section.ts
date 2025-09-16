import { Component } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-search-section',
  imports: [
    NzIconModule
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
