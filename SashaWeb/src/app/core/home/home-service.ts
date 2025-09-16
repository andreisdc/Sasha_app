import { Injectable } from '@angular/core';
import { PropertyService } from '../services/property.service';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private categories: Map<string, number>;

  constructor(private propertyService: PropertyService ) {
    //todo: remove the hardcoded data after the real logic is implemented XD
    const maximumCategories = 8;
    this.categories = new Map<string, number>();
    
    this.propertyService.getProperties().subscribe(data => {
      data.forEach(element => {
        const property = element as Property;

        this.categories.set(property.type, (this.categories.get(property.type) || 0) + 1);
      });

      this.categories = new Map([...this.categories.entries()].sort((a, b) => b[1] - a[1]));

      if (this.categories.size > maximumCategories) {
        this.categories = new Map([...this.categories.entries()].slice(0, maximumCategories));
      }
    }, error => {
      console.error('Error fetching properties:', error);
    });
  }

  getCategories(): Map<string, number> {
    return this.categories;
  }
}
