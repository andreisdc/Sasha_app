import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs/internal/Observable";
import properties from '../../../assets/properties.json';
import { of } from "rxjs";

@Injectable({
    providedIn: "root"
})

export class PropertyService {
    constructor(private http: HttpClient) {}
    // getProperties(): Observable<any[]> {
    // return this.http.get<any[]>('/assets/properties.json');
    getProperties(): Observable<any[]> {
      return of(properties);
    }
  }
    
