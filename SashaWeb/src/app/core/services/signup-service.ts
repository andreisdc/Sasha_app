import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class SignupService {
  constructor() {}

  /**
   * Simulate user signup
   * Replace with real HTTP request when backend is ready
   */
  signup(data: SignupData): Observable<any> {
    console.log('Signing up user:', data);

    // Example: simulate success if email doesn't include "fail"
    if (data.email.includes('fail')) {
      return throwError(() => new Error('Signup failed')).pipe(delay(1000));
    }

    // Simulate success response
    return of({ success: true }).pipe(delay(1000));
  }

  /**
   * Simulate Google signup
   */
  signupWithGoogle(): Observable<any> {
    console.log('Google signup triggered');
    // Simulate a success response
    return of({ success: true, provider: 'Google' }).pipe(delay(1000));
  }
}
