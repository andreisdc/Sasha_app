import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-card-component.html',
  styleUrls: ['./property-card-component.less']
})
export class PropertyCardComponent {
  @Input() id!: string;
  @Input() title!: string;
  @Input() location!: string;
  @Input() image!: string;
  @Input() price!: string;
  @Input() rating!: number;
  @Input() reviews!: number;
  @Input() category!: string;
  @Input() className: string = '';
}