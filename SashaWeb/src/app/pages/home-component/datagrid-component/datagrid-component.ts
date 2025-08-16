import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject, NgModule, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyService } from '../../../core/services/property.service';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPaginationComponent } from "ng-zorro-antd/pagination";

@Component({
  selector: 'app-datagrid-component',
  standalone: true,
  imports: [CommonModule, NzTableModule],
  templateUrl: './datagrid-component.html',
  styleUrl: './datagrid-component.less'
})

export class DatagridComponent implements OnInit {

  private propertyService=inject(PropertyService);
  properties: any[]=[];
  
  pageIndex = 1;
  pageSize = 8; 
  total = this.properties.length;

  onPageChange(index: number) {
    this.pageIndex = index;
  }

  ngOnInit() {
    this.propertyService.getProperties().subscribe(data => {
      this.properties = data;
      this.total = data.length;
    });
  }

}
