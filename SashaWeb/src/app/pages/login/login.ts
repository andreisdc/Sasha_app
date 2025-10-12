import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { 
  FormsModule, 
  ReactiveFormsModule, 
  FormBuilder, 
  FormGroup, 
  Validators, 
  AbstractControl, 
  ValidationErrors 
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { SignupRequest } from '../../core/interfaces/signupRequest';
import { CountryCode } from '../../const/countryCode';
import { ToastService } from '../../core/services/toast';
import { ToastComponent } from '../../components/toast/toast';

@Component({
  selector: 'login',
  standalone: true,
  imports: [
    FormsModule, 
    ReactiveFormsModule, 
    RouterModule,
    ToastComponent
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.less']
})
export class LoginComponent implements OnInit, OnDestroy {
  authForm!: FormGroup;
  activeTab: 'signin' | 'signup' = 'signin';
  showPassword = false;
  isLoading = false;
  serverError = '';
  signupSuccess = false;
  successMessage = '';
  successEmail = '';
  countdown = 5;
  private countdownInterval: any;
  
  countryCodes = Object.values(CountryCode);

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  initializeForm(): void {
    const getValidators = () => {
      if (this.activeTab === 'signup') {
        return [this.createPasswordMatchValidator(), this.createPasswordStrengthValidator()];
      }
      return null;
    };

    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
      firstName: [
        '', 
        this.activeTab === 'signup' ? [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[A-Za-z]+$/)
        ] : []
      ],
      lastName: [
        '', 
        this.activeTab === 'signup' ? [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[A-Za-z]+$/)
        ] : []
      ],
      countryCode: [CountryCode.RO],
      phoneNumber: [
        '', 
        this.activeTab === 'signup' ? [
          Validators.required,
          Validators.pattern(/^\d{7,15}$/)
        ] : []
      ],
      confirmPassword: [
        '',
        this.activeTab === 'signup' ? [Validators.required] : []
      ]
    }, { 
      validators: getValidators()
    });
  }

  private createPasswordMatchValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      if (this.activeTab !== 'signup') return null;
      
      const password = group.get('password')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      
      return password && confirmPassword && password === confirmPassword 
        ? null 
        : { mismatch: true };
    };
  }

  private createPasswordStrengthValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      if (this.activeTab !== 'signup') return null;
      
      const password = group.get('password')?.value;
      if (!password) return null;
      
      const hasUpperCase = /[A-Z]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      return hasUpperCase && hasSpecialChar 
        ? null 
        : { weakPassword: true };
    };
  }

  setActiveTab(tab: 'signin' | 'signup'): void {
    this.activeTab = tab;
    this.serverError = '';
    this.signupSuccess = false;
    this.initializeForm();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.serverError = '';
    
    if (this.authForm.valid) {
      this.isLoading = true;
      
      if (this.activeTab === 'signin') {
        this.handleSignIn();
      } else {
        this.handleSignUp();
      }
    } else {
      this.markAllAsTouched();
    }
  }

  private handleSignIn(): void {
    const { email, password, rememberMe } = this.authForm.value;

    this.authService.login(email, password, rememberMe).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.success('Welcome back! Login successful.');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage = err?.error?.message || 'Login failed. Please check your credentials.';
        this.serverError = errorMessage;
        this.toastService.error(errorMessage);
      }
    });
  }

  private handleSignUp(): void {
    const { firstName, lastName, email, password, countryCode, phoneNumber } = this.authForm.value;
    const username = `${firstName} ${lastName}`;
    
    const payload: SignupRequest = {
      firstName,
      lastName,
      username,
      email,
      password,
      phoneNumber: `${countryCode}${phoneNumber}`,
    };

    this.authService.signup(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.signupSuccess = true;
        this.successMessage = res?.message || 'User registered successfully';
        this.successEmail = email;
        this.serverError = '';
        this.authForm.reset();

        this.toastService.success('Account created successfully! Welcome to Wanderlust.');

        this.countdown = 5;
        this.countdownInterval = setInterval(() => {
          this.countdown--;
          if (this.countdown <= 0) {
            clearInterval(this.countdownInterval);
            this.router.navigate(['/home']);
          }
        }, 1000);
      },
      error: (err) => {
        this.isLoading = false;
        this.signupSuccess = false;
        const errorMessage = err?.error?.message || 'Registration failed. Please try again.';
        this.serverError = errorMessage;
        this.toastService.error(errorMessage);
      }
    });
  }

  private markAllAsTouched(): void {
    Object.values(this.authForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  // Getters for template
  get email() { return this.authForm.get('email')!; }
  get password() { return this.authForm.get('password')!; }
  get rememberMe() { return this.authForm.get('rememberMe')!; }
  get firstName() { return this.authForm.get('firstName')!; }
  get lastName() { return this.authForm.get('lastName')!; }
  get countryCode() { return this.authForm.get('countryCode')!; }
  get phoneNumber() { return this.authForm.get('phoneNumber')!; }
  get confirmPassword() { return this.authForm.get('confirmPassword')!; }
}