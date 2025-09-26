import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.less'],
})
export class Navbar {
  constructor(private router: Router) {}

  goToLogin() {
    console.log("AU");
    this.router.navigate(['/login']);
  }
}
