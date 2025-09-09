import { Component } from '@angular/core';
import { DatagridComponent } from "./datagrid-component/datagrid-component";
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-home-component',
  imports: [DatagridComponent, HttpClientModule],
  templateUrl: './home-component.html',
  styleUrl: './home-component.less',
  standalone: true,
})

export class HomeComponent {}
