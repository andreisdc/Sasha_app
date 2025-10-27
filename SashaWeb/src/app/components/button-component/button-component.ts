import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-component.html',
  styleUrls: ['./button-component.less']
})
export class ButtonComponent {
  @Input() variant: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default';
  @Input() size: 'default' | 'sm' | 'lg' = 'default';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() className: string = '';
}