import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject, NgModule, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyService } from '../../../core/services/property.service';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPaginationModule } from "ng-zorro-antd/pagination";
import {NzCardModule} from 'ng-zorro-antd/card';
import {NzGridModule} from 'ng-zorro-antd/grid';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzAvatarModule} from 'ng-zorro-antd/avatar';
import {NzSpinModule} from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-datagrid-component',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzPaginationModule, NzCardModule, NzGridModule, NzIconModule, NzButtonModule, NzAvatarModule, NzSpinModule],
  templateUrl: './datagrid-component.html',
  styleUrl: './datagrid-component.less'
})

export class DatagridComponent implements OnInit {
  loading: boolean = true;

  constructor(private propertyService: PropertyService) {}
  properties: Property[]=[];
  allProperties: Property[]=[];
  filteredProperties: Property[] = [];
  
  pageIndex:number = 1;
  pageSize:number = 15; 
  total:number = 0;

 onPageChange(page: number):void {
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
  }

  toggleLike(property: Property) {
    property.liked = !property.liked;
    console.log(`Property with ID ${property.id} liked status: ${property.liked}`);
  }
}