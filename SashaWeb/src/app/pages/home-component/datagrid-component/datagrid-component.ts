import { CommonModule } from '@angular/common';
import { Component, inject, NgModule, OnInit } from '@angular/core';
import { PropertyService } from '../../../core/services/property.service';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPaginationModule } from "ng-zorro-antd/pagination";
import {NzCardModule} from 'ng-zorro-antd/card';
import {NzGridModule} from 'ng-zorro-antd/grid';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzAvatarModule} from 'ng-zorro-antd/avatar';
import {NzSpinModule} from 'ng-zorro-antd/spin';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';

@Component({
  selector: 'app-datagrid-component',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzPaginationModule, NzCardModule, NzGridModule, NzIconModule, NzButtonModule, NzAvatarModule, NzSpinModule, NzCarouselModule],
  templateUrl: './datagrid-component.html',
  styleUrl: './datagrid-component.less'
})

export class DatagridComponent implements OnInit {
  currentIndex: { [id: number]: number } = {};
  loading: boolean = true;
  hovered: number | null = null;

  property!: Property;
  properties: Property[]=[];
  allProperties: Property[]=[];
  filteredProperties: Property[] = [];
  
  pageIndex: number = 1;
  pageSize: number = 15; 
  total: number = 0;

  constructor(private propertyService: PropertyService) {}

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.updateDisplayData();
  }

  updateDisplayData() 
  {
    this.properties = this.filteredProperties.slice((this.pageIndex - 1) * this.pageSize, this.pageIndex * this.pageSize);
  }

  ngOnInit() {
    this.propertyService.getProperties().subscribe(data => {
      this.allProperties = this.filteredProperties = data;
      this.total = data.length;
      this.updateDisplayData();
      this.loading = false; 
    }, error => {
      console.error('Error fetching properties:', error);
    });

    this.propertyService.selectedCategory$.subscribe(category => {
      this.filteredProperties = this.propertyService.getFilteredProperties(this.allProperties, category);
      this.total = this.filteredProperties.length;
      this.pageIndex = 1;
      this.updateDisplayData();
      this.loading = false;
    });

    this.properties.forEach(prop => this.currentIndex[prop.id] = 0);
  }

  next(prop: Property) {
    const id = prop.id;
    this.currentIndex[id] = (this.currentIndex[id] + 1) % prop.images.length;
  }

  prev(prop: Property) {
    const id = prop.id;
    this.currentIndex[id] = (this.currentIndex[id] - 1 + prop.images.length) % prop.images.length;
  }

  toggleLike(property: Property) {
    property.liked = !property.liked;
    console.log(`Property with ID ${property.id} liked status: ${property.liked}`);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }
}