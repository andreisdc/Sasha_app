import { Injectable } from '@angular/core';
import { testInterface } from './filter-interface';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private categories: string[] = [
    "cat1", 
    "cat2",
    "cat3",
    "cat4",
  ]
  
  private cards: testInterface[] = [
    {data: "data1", category: "cat1"},
    {data: "data2", category: "cat1"},
    {data: "data3", category: "cat1"},
    {data: "data4", category: "cat1"},
    {data: "data1", category: "cat2"},
    {data: "data2", category: "cat2"},
    {data: "data3", category: "cat2"},
    {data: "data4", category: "cat2"},
    {data: "data1", category: "cat3"},
    {data: "data2", category: "cat3"},
    {data: "data3", category: "cat3"},
    {data: "data4", category: "cat3"},
    {data: "data1", category: "cat4"},
    {data: "data2", category: "cat4"},
    {data: "data3", category: "cat4"},
    {data: "data4", category: "cat4"},
  ]

  getCategories(): string[] {
    return this.categories;
  }

  getCards(): testInterface[] {
    return this.cards;
  }
}
