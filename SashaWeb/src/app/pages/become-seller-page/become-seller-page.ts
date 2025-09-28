// become-seller-page.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger, keyframes } from '@angular/animations';

interface Step {
  number: number;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface FormData {
  firstName: string;
  lastName: string;
  address: string;
  cnp: string;
  idDocument: File | null;
}

interface Star {
  emoji: string;
  style: any;
}

@Component({
  selector: 'app-become-seller-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './become-seller-page.html',
  styleUrls: ['./become-seller-page.less'],
  animations: [
    trigger('pageTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('0.5s 0.2s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('0.3s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'translateX(-30px)' }))
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s 0.1s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('bounceIn', [
      transition(':enter', [
        animate('0.8s cubic-bezier(0.4, 0, 0.2, 1)', keyframes([
          style({ opacity: 0, transform: 'scale(0.3)', offset: 0 }),
          style({ opacity: 1, transform: 'scale(1.1)', offset: 0.6 }),
          style({ transform: 'scale(0.95)', offset: 0.8 }),
          style({ opacity: 1, transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ]),
    trigger('staggerItem', [
      transition(':enter', [
        query('.feature-item', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger('150ms', [
            animate('0.5s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ])
      ])
    ]),
    trigger('pulse', [
      transition(':enter', [
        style({ transform: 'scale(1)' }),
        animate('2s infinite', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.05)', offset: 0.5 }),
          style({ transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class BecomeSellerPageComponent {
  currentStep = 1;
  acceptedGdpr = false;
  
  formData: FormData = {
    firstName: '',
    lastName: '',
    address: '',
    cnp: '',
    idDocument: null
  };

  stars: Star[] = [
    { emoji: '⭐', style: { top: '15%', left: '5%', animationDelay: '0s' } },
    { emoji: '🌟', style: { top: '25%', right: '10%', animationDelay: '0.3s' } },
    { emoji: '✨', style: { bottom: '35%', left: '15%', animationDelay: '0.6s' } },
    { emoji: '💫', style: { bottom: '15%', right: '20%', animationDelay: '0.9s' } },
    { emoji: '🎊', style: { top: '45%', left: '45%', animationDelay: '1.2s' } }
  ];

  steps: Step[] = [
    { number: 1, title: 'Security', status: 'current' },
    { number: 2, title: 'Personal Info', status: 'upcoming' },
    { number: 3, title: 'ID Upload', status: 'upcoming' },
    { number: 4, title: 'Complete', status: 'upcoming' }
  ];

  getStepCircleClass(step: Step): string {
    return `step-circle step-${step.status}`;
  }

  getStepTextClass(step: Step): string {
    return `step-label label-${step.status}`;
  }

  getConnectorClass(step: Step): string {
    return step.status === 'completed' ? 'step-connector connector-completed' : 'step-connector connector-upcoming';
  }

  getNextButtonClass(): string {
    return this.canProceedToNextStep() ? 'next-button button-enabled' : 'next-button button-disabled';
  }

  getSubmitButtonClass(): string {
    return this.canSubmitVerification() ? 'submit-button button-enabled' : 'submit-button button-disabled';
  }

  onFileSelected(event: any, field: keyof FormData): void {
    const file = event.target.files[0];
    if (file) {
      this.formData[field] = file;
    }
  }

  canProceedToNextStep(): boolean {
    switch(this.currentStep) {
      case 1: return this.acceptedGdpr;
      case 2: return this.canProceedToStep3();
      case 3: return this.canProceedToStep4();
      default: return true;
    }
  }

  canProceedToStep3(): boolean {
    return !!this.formData.firstName && !!this.formData.lastName && !!this.formData.address && !!this.formData.cnp;
  }

  canProceedToStep4(): boolean {
    return !!this.formData.idDocument;
  }

  canSubmitVerification(): boolean {
    return !!this.formData.idDocument;
  }

  hasUploadedFiles(): boolean {
    return !!this.formData.idDocument;
  }

  nextStep(): void {
    if (this.currentStep < 4 && this.canProceedToNextStep()) {
      this.updateStepStatus(this.currentStep, 'completed');
      this.currentStep++;
      this.updateStepStatus(this.currentStep, 'current');
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.updateStepStatus(this.currentStep, 'upcoming');
      this.currentStep--;
      this.updateStepStatus(this.currentStep, 'current');
    }
  }

  submitVerification(): void {
    if (this.canSubmitVerification()) {
      // Here you would typically make an API call
      console.log('Submitting verification:', this.formData);
      this.nextStep();
    }
  }

  startTutorial(): void {
    console.log('Starting tutorial...');
    // Navigate to tutorial or show tutorial modal
  }

  skipTutorial(): void {
    console.log('Skipping tutorial...');
    // Navigate to dashboard or next page
  }

  private updateStepStatus(stepNumber: number, status: Step['status']): void {
    const step = this.steps.find(s => s.number === stepNumber);
    if (step) {
      step.status = status;
    }
  }
}