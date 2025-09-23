import { Component, OnInit } from '@angular/core';
import { PropertyService } from '../../core/services/property.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [RouterModule, AsyncPipe],
  templateUrl: './property-details.html',
  styleUrl: './property-details.less'
})
export class PropertyDetails implements OnInit {
  property$!: Observable<Property>;
  constructor(private propertyService: PropertyService, private route: ActivatedRoute) {}
  ngOnInit() {
    this.property$=this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          return this.propertyService.getPropertyById(Number(id));
        } else {
          throw new Error('No property ID provided');
        }
      })
    );
  }

  trackByIndex(index: number, item: any): number {
    return item.index;
  }

  getThumbnails(property: Property): { src: string; index: number }[] {
    return property.images.map((image, index) => ({
      src: image,
      index: index
    })).slice(1, 5);
  }
}
