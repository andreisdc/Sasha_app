import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-page.html',
  styleUrls: ['./admin-page.less']
})
export class AdminPage {
  // Datele pot fi mutate aici dacă vrei să le gestionezi din TypeScript
  // Momentan sunt hardcoded în template pentru simplitate
}