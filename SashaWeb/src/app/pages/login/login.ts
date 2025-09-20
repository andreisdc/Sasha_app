import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../core/login/login.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.less',
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loginService: LoginService,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      console.log('Form submitted:', this.loginForm.value);
      this.loginService.login(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error('Login failed:', error);
          // TODO: Show error message or smth
          this.loginForm.reset(); // Reset the form on error
        },
      });
    } else {
      console.log('Form is invalid');
      this.markFormGroupTouched();
    }
  }

  onGoogleSignin() {
    console.log('Google signup clicked :P');
    // TODO: Login prin google (nu e necesar).
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
