import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  dismissible?: boolean;
  timerId?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(toast: Toast) {
    const newToast: Toast = {
      duration: 3000, // 5 secunde default
      dismissible: true,
      ...toast
    };

    // Limitează durata maximă la 5 secunde
    if (newToast.duration && newToast.duration > 3000) {
      newToast.duration = 3000;
    }

    // Adaugă toast-ul
    this.toasts.update(toasts => [...toasts, newToast]);

    // Setează timer pentru auto-remove
    if (newToast.duration && newToast.duration > 0) {
      newToast.timerId = setTimeout(() => {
        this.removeToast(this.toasts().indexOf(newToast));
      }, newToast.duration);
    }

    return newToast;
  }

  success(message: string, duration: number = 5000) {
    return this.show({ message, type: 'success', duration });
  }

  error(message: string, duration: number = 5000) {
    return this.show({ message, type: 'error', duration });
  }

  info(message: string, duration: number = 5000) {
    return this.show({ message, type: 'info', duration });
  }

  warning(message: string, duration: number = 5000) {
    return this.show({ message, type: 'warning', duration });
  }

  removeToast(index: number) {
    if (index < 0 || index >= this.toasts().length) return;
    
    const toast = this.toasts()[index];
    if (toast?.timerId) {
      clearTimeout(toast.timerId);
    }
    
    this.toasts.update(toasts => toasts.filter((_, i) => i !== index));
  }

  pauseTimer(index: number) {
    if (index < 0 || index >= this.toasts().length) return;
    
    const toast = this.toasts()[index];
    if (toast?.timerId) {
      clearTimeout(toast.timerId);
    }
  }

  resumeTimer(index: number) {
    if (index < 0 || index >= this.toasts().length) return;
    
    const toast = this.toasts()[index];
    if (toast?.duration && toast.duration > 0) {
      toast.timerId = setTimeout(() => {
        this.removeToast(index);
      }, toast.duration);
    }
  }

  clear() {
    this.toasts().forEach(toast => {
      if (toast.timerId) {
        clearTimeout(toast.timerId);
      }
    });
    this.toasts.set([]);
  }
}