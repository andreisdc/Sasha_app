import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs/internal/Observable";
import properties from '../../../assets/properties.json';
import { BehaviorSubject, of } from "rxjs";

@Injectable({
    providedIn: "root"
})

export class PropertyService {
    private selectedCategorySubject = new BehaviorSubject<string>('All Categories');
    selectedCategory$ = this.selectedCategorySubject.asObservable();

    constructor(private http: HttpClient) {}
    // getProperties(): Observable<any[]> {
    // return this.http.get<any[]>('/assets/properties.json');
    getProperties(): Observable<any[]> {
      return of(properties);
    }

    getFilteredProperties(allProperties: Property[], category: string): Property[] {
      if (category === "All Categories") {
        return allProperties;
      }
      return allProperties.filter(value => value.type === category);
    }

    setSelectedCategory(category: string): void {
      this.selectedCategorySubject.next(category);
    }
  }
    
