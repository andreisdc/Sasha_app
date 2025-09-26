import { Injectable } from '@angular/core';
import { PropertyService } from '../services/property.service';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private categories: Set<string>;

  constructor(private propertyService: PropertyService ) {
    this.categories = new Set<string>();
    
    this.propertyService.getProperties().subscribe(data => {
      data.forEach(element => {
        const property = element as Property;

        this.categories.add(property.type);
      });

    }, error => {
      console.error('Error fetching properties:', error);
    });

  }

  getCategories(): Set<string> {
    return this.categories;
  }
}
