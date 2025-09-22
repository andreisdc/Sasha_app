import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { SignUpForm } from './sign-up-form/sign-up-form';

@Component({
  selector: 'app-sign-up-page',
  imports: [SignUpForm, NgOptimizedImage],
  templateUrl: './sign-up-page.html',
  styleUrl: './sign-up-page.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpPage {
  imagePath = 'assets/images/sign-up-bg.jpg';
}
