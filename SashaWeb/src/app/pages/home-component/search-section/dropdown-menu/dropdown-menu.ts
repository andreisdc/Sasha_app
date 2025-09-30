import {
  Component,
  ChangeDetectionStrategy,
  Input,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-dropdown-menu',
  imports: [],
  templateUrl: './dropdown-menu.html',
  styleUrl: './dropdown-menu.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownMenu {
  @Input() isGuestsOpen = false;
  @Input() isSearchActive = true;

  adultsCounter = signal(0);
  childrenCounter = signal(0);
  infantsCounter = signal(0);
  petsCounter = signal(0);

  addAdult() {
    this.adultsCounter.update((a) => a + 1);
  }
  addChild() {
    this.childrenCounter.update((a) => a + 1);
  }
  addInfant() {
    this.infantsCounter.update((a) => a + 1);
  }
  addPet() {
    this.petsCounter.update((a) => a + 1);
  }
  removeAdult() {
    this.adultsCounter.update((a) => Math.max(0, a - 1));
  }
  removeChild() {
    this.childrenCounter.update((a) => Math.max(0, a - 1));
  }
  removeInfant() {
    this.infantsCounter.update((a) => Math.max(0, a - 1));
  }
  removePet() {
    this.petsCounter.update((a) => Math.max(0, a - 1));
  }
}
