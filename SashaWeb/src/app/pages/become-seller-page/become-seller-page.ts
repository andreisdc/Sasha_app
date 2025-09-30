// become-seller-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  keyframes,
} from '@angular/animations';
import { PendingApproveService } from '../../core/services/pending-approve-service';
import { AuthService } from '../../core/services/auth-service';

interface Step {
  number: number;
  title: string;
  status: 'completed' | 'current' | 'upcoming' | 'error';
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
        animate(
          '0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate(
          '0.5s 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateX(0)' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateX(-30px)' }),
        ),
      ]),
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '0.6s 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
    trigger('bounceIn', [
      transition(':enter', [
        animate(
          '0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          keyframes([
            style({ opacity: 0, transform: 'scale(0.3)', offset: 0 }),
            style({ opacity: 1, transform: 'scale(1.1)', offset: 0.6 }),
            style({ transform: 'scale(0.95)', offset: 0.8 }),
            style({ opacity: 1, transform: 'scale(1)', offset: 1 }),
          ]),
        ),
      ]),
    ]),
    trigger('staggerItem', [
      transition(':enter', [
        query('.feature-item', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger('150ms', [
            animate(
              '0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              style({ opacity: 1, transform: 'translateX(0)' }),
            ),
          ]),
        ]),
      ]),
    ]),
    trigger('pulse', [
      transition(':enter', [
        style({ transform: 'scale(1)' }),
        animate(
          '2s infinite',
          keyframes([
            style({ transform: 'scale(1)', offset: 0 }),
            style({ transform: 'scale(1.05)', offset: 0.5 }),
            style({ transform: 'scale(1)', offset: 1 }),
          ]),
        ),
      ]),
    ]),
    trigger('shake', [
      transition(':enter', [
        animate(
          '0.5s ease-in-out',
          keyframes([
            style({ transform: 'translateX(0)', offset: 0 }),
            style({ transform: 'translateX(-10px)', offset: 0.1 }),
            style({ transform: 'translateX(10px)', offset: 0.2 }),
            style({ transform: 'translateX(-10px)', offset: 0.3 }),
            style({ transform: 'translateX(10px)', offset: 0.4 }),
            style({ transform: 'translateX(-10px)', offset: 0.5 }),
            style({ transform: 'translateX(10px)', offset: 0.6 }),
            style({ transform: 'translateX(-10px)', offset: 0.7 }),
            style({ transform: 'translateX(10px)', offset: 0.8 }),
            style({ transform: 'translateX(-10px)', offset: 0.9 }),
            style({ transform: 'translateX(0)', offset: 1 }),
          ]),
        ),
      ]),
    ]),
  ],
})
export class BecomeSellerPageComponent implements OnInit {
  currentStep = 1;
  acceptedGdpr = false;
  isSubmitting = false;
  submitError = '';
  submissionStatus: 'idle' | 'success' | 'error' = 'idle';

  formData: FormData = {
    firstName: '',
    lastName: '',
    address: '',
    cnp: '',
    idDocument: null,
  };

  stars: Star[] = [
    { emoji: '⭐', style: { top: '15%', left: '5%', animationDelay: '0s' } },
    {
      emoji: '🌟',
      style: { top: '25%', right: '10%', animationDelay: '0.3s' },
    },
    {
      emoji: '✨',
      style: { bottom: '35%', left: '15%', animationDelay: '0.6s' },
    },
    {
      emoji: '💫',
      style: { bottom: '15%', right: '20%', animationDelay: '0.9s' },
    },
    { emoji: '🎊', style: { top: '45%', left: '45%', animationDelay: '1.2s' } },
  ];

  errorStars: Star[] = [
    { emoji: '❌', style: { top: '10%', left: '10%', animationDelay: '0s' } },
    {
      emoji: '⚠️',
      style: { top: '20%', right: '15%', animationDelay: '0.3s' },
    },
    {
      emoji: '🚫',
      style: { bottom: '30%', left: '20%', animationDelay: '0.6s' },
    },
    {
      emoji: '🔴',
      style: { bottom: '20%', right: '25%', animationDelay: '0.9s' },
    },
    { emoji: '💥', style: { top: '40%', left: '50%', animationDelay: '1.2s' } },
  ];

  steps: Step[] = [
    { number: 1, title: 'Security', status: 'current' },
    { number: 2, title: 'Personal Info', status: 'upcoming' },
    { number: 3, title: 'ID Upload', status: 'upcoming' },
    { number: 4, title: 'Complete', status: 'upcoming' },
  ];

  constructor(
    private pendingApproveService: PendingApproveService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    // Pre-populează datele dacă sunt disponibile
  }

  getStepCircleClass(step: Step): string {
    if (this.submissionStatus === 'error' && step.number === 4) {
      return 'step-circle step-error';
    }
    return `step-circle step-${step.status}`;
  }

  getStepTextClass(step: Step): string {
    if (this.submissionStatus === 'error' && step.number === 4) {
      return 'step-label label-error';
    }
    return `step-label label-${step.status}`;
  }

  getConnectorClass(step: Step): string {
    if (this.submissionStatus === 'error' && step.number === 3) {
      return 'step-connector connector-error';
    }
    return step.status === 'completed'
      ? 'step-connector connector-completed'
      : 'step-connector connector-upcoming';
  }

  getNextButtonClass(): string {
    return this.canProceedToNextStep()
      ? 'next-button button-enabled'
      : 'next-button button-disabled';
  }

  getSubmitButtonClass(): string {
    return this.canSubmitVerification() && !this.isSubmitting
      ? 'submit-button button-enabled'
      : 'submit-button button-disabled';
  }

  onFileSelected(event: any, field: keyof FormData): void {
    const file = event.target.files[0];
    if (file) {
      this.formData[field] = file;
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.acceptedGdpr;
      case 2:
        return this.canProceedToStep3();
      case 3:
        return this.canProceedToStep4();
      default:
        return true;
    }
  }

  canProceedToStep3(): boolean {
    return (
      !!this.formData.firstName &&
      !!this.formData.lastName &&
      !!this.formData.address &&
      !!this.formData.cnp
    );
  }

  canProceedToStep4(): boolean {
    return !!this.formData.idDocument;
  }

  canSubmitVerification(): boolean {
    return !!this.formData.idDocument && !this.isSubmitting;
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
      this.submissionStatus = 'idle'; // Reset status when going back
    }
  }

  async submitVerification(): Promise<void> {
  if (!this.canSubmitVerification()) return;

  this.isSubmitting = true;
  this.submitError = '';
  this.submissionStatus = 'idle';

  try {
    console.log('Starting verification submission...');

    // ia user-ul curent
    const currentUser = await this.authService.me().toPromise();
    if (!currentUser || !currentUser.id) {
      throw new Error('You must be logged in to submit verification');
    }

    const userId = currentUser.id;
    console.log('User ID:', userId);

    // pregătim FormData
    const formData = new FormData();
    formData.append("UserId", userId);
    formData.append("FirstName", this.formData.firstName);
    formData.append("LastName", this.formData.lastName);
    formData.append("Cnp", this.formData.cnp);
    if (this.formData.idDocument) {
      formData.append("Photo", this.formData.idDocument);
    }

    console.log("Sending form data:", formData);

    await this.pendingApproveService.createPendingApprove(formData).toPromise();

    // succes
    this.submissionStatus = 'success';
    this.nextStep();
  } catch (error: any) {
    console.error('Error submitting verification:', error);

    if (error.error) {
      this.submitError = error.error.message || error.message;
    } else {
      this.submitError = error.message || 'Failed to submit verification.';
    }

    this.submissionStatus = 'error';
    this.nextStep();
  } finally {
    this.isSubmitting = false;
  }
}


  retrySubmission(): void {
    this.currentStep = 3;
    this.updateStepStatus(3, 'current');
    this.updateStepStatus(4, 'upcoming');
    this.submissionStatus = 'idle';
    this.submitError = '';
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data || base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  private generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  startTutorial(): void {
    this.router.navigate(['/tutorial']);
  }

  skipTutorial(): void {
    this.router.navigate(['/dashboard']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private updateStepStatus(stepNumber: number, status: Step['status']): void {
    const step = this.steps.find((s) => s.number === stepNumber);
    if (step) {
      step.status = status;
    }
  }
}
