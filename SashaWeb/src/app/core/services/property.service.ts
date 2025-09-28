import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of, map } from 'rxjs';
import properties from '../../../assets/properties.json';
import { Property } from '../interfaces/property.interface';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  selectedCategory = signal<string>('All Categories');
  selectedCategory$ = toObservable(this.selectedCategory);

  // getProperties(): Observable<any[]> {
  // return this.http.get<any[]>('/assets/properties.json');
  getProperties(): Observable<Property[]> {
    return of(properties).pipe(
      map((items) =>
        items.map((item) => ({ ...item, liked: false }) as Property),
      ),
    );
  }

  getPropertyById(id: number): Observable<any> {
    const property = properties.find(prop => prop.id === id);
     return of(property);
  }

  
  getFilteredProperties(
    allProperties: Property[],
    category: string,
  ): Property[] {
    if (category === 'All Categories') {
      return allProperties;
    }
    return allProperties.filter((value) => value.type === category);
  }

  setSelectedCategory(category: string): void {
    this.selectedCategory.set(category);
  }
}
