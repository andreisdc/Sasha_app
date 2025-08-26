import { Component, OnInit } from '@angular/core';
import { HomeService } from '../../core/home/home-service';
import { testInterface } from '../../core/home/filter-interface';
import { DatagridComponent } from './datagrid-component/datagrid-component';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-home-component',
  imports: [DatagridComponent, HttpClientModule],
  templateUrl: './home-component.html',
  styleUrl: './home-component.less',
  standalone: true,
})
export class HomeComponent implements OnInit {
  categories: string[] = [];
  cards: testInterface[] = [];
  cardsWithFilter: testInterface[] = [];
  

  constructor(private homeService: HomeService) {}

  ngOnInit(): void {
    // todo: remove this and use the actual service for home :) 
    this.categories = this.homeService.getCategories();
    this.cardsWithFilter = this.cards = this.homeService.getCards();
  }

  GetCategory(category: string): void {
    if (category === "All Categories") {
      this.cardsWithFilter = this.cards;
    }
    else {
      this.cardsWithFilter = this.cards.filter(item => item.category === category)
    }
  }
}
