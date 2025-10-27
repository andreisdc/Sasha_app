import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track $index) {
        <div 
          class="toast {{toast.type}}"
          [class.dismissible]="toast.dismissible"
          (mouseenter)="pauseTimer($index)"
          (mouseleave)="resumeTimer($index)">
          
          <div class="toast-content">
            <span class="toast-message">{{ toast.message }}</span>
            
            @if (toast.dismissible) {
              <button 
                class="toast-close" 
                (click)="removeToast($index)">
                ×
              </button>
            }
          </div>
          
          @if (toast.duration && toast.duration > 0) {
            <div 
              class="toast-progress" 
              [style.animation-duration]="toast.duration + 'ms'">
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./toast.less']
})
export class ToastComponent {
  toastService = inject(ToastService);

  removeToast(index: number) {
    this.toastService.removeToast(index);
  }

  pauseTimer(index: number) {
    this.toastService.pauseTimer(index);
  }

  resumeTimer(index: number) {
    this.toastService.resumeTimer(index);
  }
}