import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from './auth.service';
import { SignUpForm } from './sign-up-form/sign-up-form';
import { User } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-sign-up-page',
  imports: [SignUpForm],
  templateUrl: './sign-up-page.html',
  styleUrl: './sign-up-page.less'
})
export class SignUpPage {
  signupForm: FormGroup;
  signupSuccess = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }


  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.signupForm.valid) {
      const formValue = this.signupForm.value;
      const newUser: User = {
        id: uuidv4(),
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone,
        password: formValue.password, // Note: In production, hash this password
        createdAt: new Date()
      };

      if (this.authService.signUp(newUser)) {
        this.signupSuccess = true;
        this.errorMessage = '';
        this.signupForm.reset();
      } else {
        this.errorMessage = 'Email or phone number already exists';
      }
    }
  }
}
