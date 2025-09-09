import { Component } from '@angular/core';
import { SignUpForm } from './sign-up-form/sign-up-form';

@Component({
  selector: 'app-sign-up-page',
  imports: [SignUpForm],
  templateUrl: './sign-up-page.html',
  styleUrl: './sign-up-page.less'
})
export class SignUpPage {

}
