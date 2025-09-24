import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SignupService } from '../../core/services/signup-service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sign-up-page.html',
  styleUrls: ['./sign-up-page.less'],
})
export class SignUp implements OnInit {
  signupForm!: FormGroup;
  showPassword = false;
  signupSuccess = false;
  successEmail = '';

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private signupService = inject(SignupService);

  ngOnInit(): void {
    this.signupForm = this.fb.group(
      {
        firstName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(/^[A-Za-z]+$/),
          ],
        ],
        lastName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(/^[A-Za-z]+$/),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            this.passwordStrengthValidator,
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Submit form
  onSubmit() {
    if (this.signupForm.valid) {
      const { firstName, lastName, email, password } = this.signupForm.value;

      this.signupService
        .signup({ firstName, lastName, email, password })
        .subscribe({
          next: () => {
            this.successEmail = email;
            this.signupSuccess = true;
            this.sendConfirmationEmail(email);
            this.signupForm.reset();
          },
          error: (err) => {
            console.error('Signup failed:', err);
            this.signupForm.reset();
          },
        });
    } else {
      this.markAllAsTouched();
    }
  }

  onGoogleSignup() {
    console.log('Google signup clicked');
  }

  // Mark all fields as touched to show validation errors
  private markAllAsTouched() {
    Object.values(this.signupForm.controls).forEach((control) =>
      control.markAsTouched(),
    );
  }

  // Password match validator
  private passwordMatchValidator(
    group: AbstractControl,
  ): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password && confirm && password === confirm
      ? null
      : { mismatch: true };
  }

  // Password strength validator
  private passwordStrengthValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value || '';
    const hasUpperCase = /[A-Z]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const hasMinLength = value.length >= 8;
    return hasUpperCase && hasSpecialChar && hasMinLength
      ? null
      : { weakPassword: true };
  }

  // Send confirmation email (mock)
  private sendConfirmationEmail(email: string) {
    console.log(`Sending confirmation email to ${email}`);
    // TODO: integrate real email service
  }

  // Getter shortcuts
  get firstName() {
    return this.signupForm.get('firstName')!;
  }
  get lastName() {
    return this.signupForm.get('lastName')!;
  }
  get email() {
    return this.signupForm.get('email')!;
  }
  get password() {
    return this.signupForm.get('password')!;
  }
  get confirmPassword() {
    return this.signupForm.get('confirmPassword')!;
  }
}
