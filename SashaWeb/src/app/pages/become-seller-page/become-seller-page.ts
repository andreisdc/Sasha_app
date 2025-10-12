// become-seller-page.component.ts
import { Component, OnInit, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PendingApproveService } from '../../core/services/pending-approve-service';
import { AuthService } from '../../core/services/auth-service';
import { ToastService } from '../../core/services/toast';
import { ToastComponent } from '../../components/toast/toast'; // Adaugă această linie

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
  selector: 'app-become-seller-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent], // Adaugă ToastComponent aici
  templateUrl: './become-seller-page.html',
  styleUrls: ['./become-seller-page.less']
})
export class BecomeSellerPageComponent implements OnInit {
  private toastService = inject(ToastService);
  
  currentStep = 1;
  acceptedGdpr = false;
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
      title: 'Security & Privacy', 
      description: 'Learn how we protect your data',
      status: 'active' 
    },
    { 
      number: 2, 
      title: 'Personal Information', 
      description: 'Tell us about yourself',
      status: 'upcoming' 
    },
    { 
      number: 3, 
      title: 'ID Verification', 
      description: 'Upload your ID document',
      status: 'upcoming' 
    },
    { 
      number: 4, 
      title: 'Completion', 
      description: 'Review and submit',
      status: 'upcoming' 
    }
  ];

  constructor(
    private pendingApproveService: PendingApproveService,
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
          this.toastService.info('Welcome back! Your information has been loaded.');
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
      case 1: return this.acceptedGdpr;
      case 2: return this.canProceedToStep3();
      case 3: return this.canSubmitVerification();
      default: return true;
    }
  }

  canProceedToStep3(): boolean {
    const isValid = !!(this.formData.firstName?.trim() && 
                      this.formData.lastName?.trim() && 
                      this.formData.address?.trim() && 
                      this.formData.cnp?.trim());
    
    if (!isValid && this.formData.firstName && this.formData.lastName) {
      this.toastService.warning('Please fill in all required fields');
    }
    
    return isValid;
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
        
        // Toast messages for each step
        switch (this.currentStep) {
          case 2:
            this.toastService.info('Please fill in your personal information');
            break;
          case 3:
            this.toastService.info('Upload your ID document for verification');
            break;
          case 4:
            this.toastService.success('All steps completed! Ready to submit.');
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
        this.toastService.warning('Please accept the security agreement to continue');
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
      this.toastService.info('Submitting your verification...');

      const currentUser = await this.authService.me().toPromise();
      if (!currentUser?.id) {
        throw new Error('You must be logged in to submit verification');
      }

      const formData = new FormData();
      formData.append("UserId", currentUser.id);
      formData.append("FirstName", this.formData.firstName);
      formData.append("LastName", this.formData.lastName);
      formData.append("Address", this.formData.address);
      formData.append("Cnp", this.formData.cnp);
      
      if (this.formData.idDocument) {
        formData.append("Photo", this.formData.idDocument);
      }

      await this.pendingApproveService.createPendingApprove(formData).toPromise();
      
      this.ngZone.run(() => {
        this.isSubmitting = false;
        this.toastService.success('Verification submitted successfully! Welcome to the Wanderlust host community! 🎉');
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

  startTutorial(): void {
    this.ngZone.run(() => {
      this.toastService.info('Starting host tutorial...');
      setTimeout(() => {
        this.router.navigate(['/host/tutorial']);
      }, 1000);
    });
  }

  skipTutorial(): void {
    this.ngZone.run(() => {
      this.toastService.success('Welcome to Wanderlust! Your host journey begins now! 🏠');
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1500);
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
        // Update all steps based on current step
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

  // Validare CNP
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

  // Validare nume
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