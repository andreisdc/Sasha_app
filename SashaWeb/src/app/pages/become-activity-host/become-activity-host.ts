// become-activity-host.component.ts
import { Component, OnInit, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { ToastService } from '../../core/services/toast';
import { ToastComponent } from '../../components/toast/toast';

interface Step {
  number: number;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
}

interface FormData {
  firstName: string;
  lastName: string;
  address: string;
  cnp: string;
  idDocument: File | null;
}

@Component({
  selector: 'app-become-activity-host',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './become-activity-host.html',
  styleUrls: ['./become-activity-host.less']
})
export class BecomeActivityHostComponent implements OnInit {
  private toastService = inject(ToastService);
  
  currentStep = 1;
  acceptedGdpr = false;
  acceptedHostAgreement = false;
  isSubmitting = false;
  submitError = '';
  isDragging = false;

  formData: FormData = {
    firstName: '',
    lastName: '',
    address: '',
    cnp: '',
    idDocument: null,
  };

  steps: Step[] = [
    { 
      number: 1, 
      title: 'Host Requirements', 
      description: 'Understand what it takes',
      status: 'active' 
    },
    { 
      number: 2, 
      title: 'Personal Info', 
      description: 'Tell us about yourself',
      status: 'upcoming' 
    },
    { 
      number: 3, 
      title: 'ID Verification', 
      description: 'Verify your identity',
      status: 'upcoming' 
    },
    { 
      number: 4, 
      title: 'Get Started', 
      description: 'Start creating activities',
      status: 'upcoming' 
    }
  ];

  hostRequirements = [
    {
      icon: '⭐',
      title: 'Passion & Expertise',
      description: 'Deep knowledge and genuine enthusiasm for your activity'
    },
    {
      icon: '🗣️',
      title: 'Communication Skills', 
      description: 'Ability to engage and guide participants effectively'
    },
    {
      icon: '📅',
      title: 'Time Commitment',
      description: 'Reliable availability for your scheduled activities'
    },
    {
      icon: '🛡️',
      title: 'Safety Awareness',
      description: 'Priority for participant safety and well-being'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  private loadUserData() {
    this.ngZone.run(() => {
      try {
        const user = this.authService.getCurrentUser();
        if (user) {
          this.formData.firstName = user.firstName || '';
          this.formData.lastName = user.lastName || '';
          this.toastService.info('Welcome! Ready to become an activity host?');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        this.toastService.error('Failed to load user data');
      }
    });
  }

  // Navigation between steps
  goToStep(stepNumber: number) {
    this.ngZone.run(() => {
      if (stepNumber < this.currentStep) {
        this.currentStep = stepNumber;
        this.updateStepStatus();
        this.toastService.info(`Returned to ${this.steps[stepNumber - 1].title}`);
      }
    });
  }

  onFileSelected(event: Event) {
    this.ngZone.run(() => {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file && this.validateFile(file)) {
        this.formData.idDocument = file;
        this.toastService.success('ID document uploaded successfully!');
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.ngZone.run(() => {
      this.isDragging = false;
      
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (this.validateFile(file)) {
          this.formData.idDocument = file;
          this.toastService.success('ID document uploaded successfully!');
        }
      }
    });
  }

  private validateFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      this.toastService.error('Please upload a JPG, PNG, or PDF file');
      return false;
    }

    if (file.size > maxSize) {
      this.toastService.error('File size must be less than 5MB');
      return false;
    }

    return true;
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 1: return this.acceptedGdpr && this.acceptedHostAgreement;
      case 2: return this.canProceedToStep3();
      case 3: return this.canSubmitVerification();
      default: return true;
    }
  }

  canProceedToStep3(): boolean {
    return !!(this.formData.firstName?.trim() && 
              this.formData.lastName?.trim() && 
              this.formData.address?.trim() && 
              this.formData.cnp?.trim());
  }

  canSubmitVerification(): boolean {
    return !!this.formData.idDocument && !this.isSubmitting;
  }

  nextStep(): void {
    this.ngZone.run(() => {
      if (this.currentStep < 4 && this.canProceedToNextStep()) {
        this.updateStepStatus(this.currentStep, 'completed');
        this.currentStep++;
        this.updateStepStatus(this.currentStep, 'active');
        
        switch (this.currentStep) {
          case 2:
            this.toastService.info('Please fill in your personal information');
            break;
          case 3:
            this.toastService.info('Upload your ID for verification');
            break;
          case 4:
            this.toastService.success('Verification complete! Welcome to our host community!');
            break;
        }
      } else if (!this.canProceedToNextStep()) {
        this.showStepValidationError();
      }
    });
  }

  private showStepValidationError() {
    switch (this.currentStep) {
      case 1:
        this.toastService.warning('Please accept both agreements to continue');
        break;
      case 2:
        this.toastService.warning('Please fill in all required fields');
        break;
      case 3:
        this.toastService.warning('Please upload your ID document');
        break;
    }
  }

  previousStep(): void {
    this.ngZone.run(() => {
      if (this.currentStep > 1) {
        this.updateStepStatus(this.currentStep, 'upcoming');
        this.currentStep--;
        this.updateStepStatus(this.currentStep, 'active');
        this.submitError = '';
        this.toastService.info(`Returned to ${this.steps[this.currentStep - 1].title}`);
      }
    });
  }

  async submitVerification(): Promise<void> {
    if (!this.canSubmitVerification()) {
      this.toastService.warning('Please complete all requirements before submitting');
      return;
    }

    this.ngZone.run(() => {
      this.isSubmitting = true;
      this.submitError = '';
    });

    try {
      this.toastService.info('Submitting your host verification...');

      const currentUser = await this.authService.me().toPromise();
      if (!currentUser?.id) {
        throw new Error('You must be logged in to submit verification');
      }

      // Aici vine apelul API pentru a verifica userul ca activity host
      // await this.hostService.verifyAsActivityHost(currentUser.id, this.formData).toPromise();
      
      // Simulăm succes pentru moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.ngZone.run(() => {
        this.isSubmitting = false;
        this.toastService.success('You are now verified as an Activity Host! 🎉');
        this.nextStep();
      });

    } catch (error: any) {
      this.ngZone.run(() => {
        this.isSubmitting = false;
        const errorMessage = error.error?.message || error.message || 'Failed to submit verification';
        this.submitError = errorMessage;
        this.toastService.error(errorMessage);
      });
    }
  }

  startCreatingActivities(): void {
    this.ngZone.run(() => {
      this.toastService.success('Welcome! Start creating your first activity.');
      setTimeout(() => {
        this.router.navigate(['/create-activity']);
      }, 1000);
    });
  }

  goToDashboard(): void {
    this.ngZone.run(() => {
      this.router.navigate(['/dashboard']);
    });
  }

  private updateStepStatus(stepNumber?: number, status?: Step['status']): void {
    this.ngZone.run(() => {
      if (stepNumber && status) {
        const step = this.steps.find(s => s.number === stepNumber);
        if (step) {
          step.status = status;
        }
      } else {
        this.steps.forEach(step => {
          if (step.number < this.currentStep) {
            step.status = 'completed';
          } else if (step.number === this.currentStep) {
            step.status = 'active';
          } else {
            step.status = 'upcoming';
          }
        });
      }
    });
  }

  validateCNP(): void {
    this.ngZone.run(() => {
      if (!this.formData.cnp) return;
      
      const cnp = this.formData.cnp.trim();
      if (cnp.length !== 13) {
        this.toastService.warning('CNP must be exactly 13 digits');
        return;
      }
      
      if (!/^\d+$/.test(cnp)) {
        this.toastService.warning('CNP must contain only digits');
        return;
      }
      
      this.toastService.success('CNP format is valid');
    });
  }

  validateNames(): void {
    this.ngZone.run(() => {
      if (!this.formData.firstName?.trim() || !this.formData.lastName?.trim()) {
        return;
      }
      
      const nameRegex = /^[a-zA-ZăâîșțĂÂÎȘȚ\s-]+$/;
      if (!nameRegex.test(this.formData.firstName) || !nameRegex.test(this.formData.lastName)) {
        this.toastService.warning('Names should contain only letters and valid characters');
        return;
      }
      
      this.toastService.success('Names are valid');
    });
  }
}