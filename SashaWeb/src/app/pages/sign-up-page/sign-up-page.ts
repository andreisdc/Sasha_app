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
import { AuthService } from '../../core/services/auth-service';
import { SignupRequest } from '../../core/interfaces/signupRequest';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sign-up-page.html',
  styleUrls: ['./sign-up-page.less'],
})
export class SignUpComponent implements OnInit {
  signupForm!: FormGroup;
  showPassword = false;

  signupSuccess = false;
  successMessage = '';
  errorMessage = '';
  successEmail = '';
  countdown = 5;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
  if (this.signupForm.valid) {
    const { firstName, lastName, email, password } = this.signupForm.value;
    const username = `${firstName} ${lastName}`; // generate username

    const payload: SignupRequest = {
      firstName,
      lastName,
      username,   // include username in the payload
      email,
      password,
    };

    this.authService.signup(payload).subscribe({
      next: (res: any) => {
        this.signupSuccess = true;
        this.successMessage = res?.message || 'User registered successfully';
        this.successEmail = email;
        this.errorMessage = '';

        this.signupForm.reset();

        // Countdown redirect
        this.countdown = 3;
        const interval = setInterval(() => {
          this.countdown--;
          if (this.countdown <= 0) {
            clearInterval(interval);
            this.router.navigate(['/home']);
          }
        }, 1000);
      },
      error: (err) => {
        this.signupSuccess = false;
        this.errorMessage = err?.error?.message || 'Signup failed';
      },
    });
  } else {
    this.markAllAsTouched();
  }
}


  private markAllAsTouched() {
    Object.values(this.signupForm.controls).forEach((control) =>
      control.markAsTouched(),
    );
  }

  private passwordMatchValidator(
    group: AbstractControl,
  ): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password && confirm && password === confirm
      ? null
      : { mismatch: true };
  }

  private passwordStrengthValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value || '';
    const hasUpperCase = /[A-Z]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    return hasUpperCase && hasSpecialChar ? null : { weakPassword: true };
  }

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
