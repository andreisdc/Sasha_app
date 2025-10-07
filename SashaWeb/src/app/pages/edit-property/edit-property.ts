import { Component, OnInit, inject, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { PropertyService, Property } from '../../core/services/property-service';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-edit-property',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-property.html',
  styleUrl: './edit-property.less'
})
export class EditProperty implements OnInit, OnDestroy {
  propertyForm!: FormGroup;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  propertyId!: string;
  currentProperty!: Property;

  private destroy$ = new Subject<void>();

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id')!;
    
    if (!this.propertyId) {
      this.router.navigate(['/my-properties']);
      return;
    }

    this.initForm();
    this.loadProperty();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.propertyForm = this.fb.group({
      // Basic Information
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000)]],
      propertyType: ['', Validators.required],
      maxGuests: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      bedrooms: [0, [Validators.min(0), Validators.max(20)]],
      bathrooms: [1, [Validators.required, Validators.min(0), Validators.max(10)]],
      livingSpace: [0, [Validators.min(0), Validators.max(1000)]],

      // Location
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      county: [''],
      country: ['Romania', Validators.required],
      postalCode: [''],

      // Pricing & Availability
      pricePerNight: [0, [Validators.required, Validators.min(1), Validators.max(10000)]],
      minNights: [1, [Validators.required, Validators.min(1), Validators.max(30)]],
      maxNights: [30, [Validators.min(1), Validators.max(365)]],
      checkInTime: ['15:00'],
      checkOutTime: ['11:00'],
      instantBook: [false],

      // Property Amenities
      wifi: [false],
      airConditioning: [false],
      heating: [false],
      kitchen: [false],
      tv: [false],
      washer: [false],
      dryer: [false],
      pool: [false],
      parking: [false],
      fireplace: [false],
      balcony: [false],
      garden: [false],
      hotTub: [false],
      wheelchairAccessible: [false],
      bbq: [false],
      breakfastIncluded: [false],

      // Safety Features
      smokeDetector: [false],
      fireExtinguisher: [false],
      carbonMonoxideDetector: [false],

      // Policies
      petFriendly: [false]
    });
  }

  // Adaugă această metodă pentru debugging
checkFormValidity(): void {
  console.log('🔍 Form Validation Check:');
  console.log('Form valid:', this.propertyForm.valid);
  console.log('Form invalid:', this.propertyForm.invalid);
  console.log('Form touched:', this.propertyForm.touched);
  console.log('Form pristine:', this.propertyForm.pristine);
  
  // Verifică fiecare câmp
  Object.keys(this.propertyForm.controls).forEach(key => {
    const control = this.propertyForm.get(key);
    console.log(`${key}:`, {
      valid: control?.valid,
      invalid: control?.invalid,
      errors: control?.errors,
      value: control?.value,
      touched: control?.touched
    });
  });
}

  private loadProperty(): void {
    console.log('🔄 Loading property for editing...');
    
    this.ngZone.run(() => {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    });

    this.propertyService.getPropertyById(this.propertyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (property) => {
          console.log('✅ Property loaded for editing:', property);
          
          this.ngZone.run(() => {
            this.currentProperty = property;
            this.populateForm(property);
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('❌ Error loading property:', error);
          
          this.ngZone.run(() => {
            this.errorMessage = 'Failed to load property details. Please try again.';
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        }
      });
  }

  private populateForm(property: Property): void {
    console.log('📝 Populating form with property data...');
    
    this.propertyForm.patchValue({
      // Basic Information
      title: property.title,
      description: property.description,
      propertyType: property.propertyType || property.locationType,
      maxGuests: property.maxGuests,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      livingSpace: property.livingSpace,

      // Location
      address: property.address,
      city: property.city,
      county: property.county,
      country: property.country,
      postalCode: property.postalCode,

      // Pricing & Availability
      pricePerNight: property.pricePerNight,
      minNights: property.minNights,
      maxNights: property.maxNights,
      checkInTime: this.formatTime(property.checkInTime),
      checkOutTime: this.formatTime(property.checkOutTime),
      instantBook: property.instantBook,

      // Property Amenities
      wifi: property.wifi,
      airConditioning: property.airConditioning,
      heating: property.heating,
      kitchen: property.kitchen,
      tv: property.tv,
      washer: property.washer,
      dryer: property.dryer,
      pool: property.pool,
      parking: property.parking,
      fireplace: property.fireplace,
      balcony: property.balcony,
      garden: property.garden,
      hotTub: property.hotTub,
      wheelchairAccessible: property.wheelchairAccessible,
      bbq: property.bbq,
      breakfastIncluded: property.breakfastIncluded,

      // Safety Features
      smokeDetector: property.smokeDetector,
      fireExtinguisher: property.fireExtinguisher,
      carbonMonoxideDetector: property.carbonMonoxideDetector,

      // Policies
      petFriendly: property.petFriendly
    });

    console.log('✅ Form populated successfully');
  }

  private formatTime(timeString: string): string {
    if (!timeString) return '15:00';
    
    // Handle both "15:00:00" and "15:00" formats
    const timeParts = timeString.split(':');
    return `${timeParts[0]}:${timeParts[1]}`;
  }

  onSubmit(): void {
    if (this.propertyForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    console.log('💾 Submitting property update...');

    this.ngZone.run(() => {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.cdr.detectChanges();
    });

    const formValue = this.propertyForm.value;

    const updateData = {
      // Basic Information
      title: formValue.title,
      description: formValue.description,
      propertyType: formValue.propertyType,
      maxGuests: formValue.maxGuests,
      bedrooms: formValue.bedrooms,
      bathrooms: formValue.bathrooms,
      livingSpace: formValue.livingSpace,

      // Location
      address: formValue.address,
      city: formValue.city,
      county: formValue.county,
      country: formValue.country,
      postalCode: formValue.postalCode,

      // Pricing & Availability
      pricePerNight: formValue.pricePerNight,
      minNights: formValue.minNights,
      maxNights: formValue.maxNights,
      checkInTime: `${formValue.checkInTime}:00`,
      checkOutTime: `${formValue.checkOutTime}:00`,
      instantBook: formValue.instantBook,

      // Property Amenities
      wifi: formValue.wifi,
      airConditioning: formValue.airConditioning,
      heating: formValue.heating,
      kitchen: formValue.kitchen,
      tv: formValue.tv,
      washer: formValue.washer,
      dryer: formValue.dryer,
      pool: formValue.pool,
      parking: formValue.parking,
      fireplace: formValue.fireplace,
      balcony: formValue.balcony,
      garden: formValue.garden,
      hotTub: formValue.hotTub,
      wheelchairAccessible: formValue.wheelchairAccessible,
      bbq: formValue.bbq,
      breakfastIncluded: formValue.breakfastIncluded,

      // Safety Features
      smokeDetector: formValue.smokeDetector,
      fireExtinguisher: formValue.fireExtinguisher,
      carbonMonoxideDetector: formValue.carbonMonoxideDetector,

      // Policies
      petFriendly: formValue.petFriendly
    };

    console.log('📦 Update data:', updateData);

    this.propertyService.updateProperty(this.propertyId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedProperty) => {
          console.log('✅ Property updated successfully:', updatedProperty);
          
          this.ngZone.run(() => {
            this.isSubmitting = false;
            this.successMessage = 'Property updated successfully!';
            this.cdr.detectChanges();
            
            // Redirect after 2 seconds
            setTimeout(() => {
              this.router.navigate(['/property', this.propertyId]);
            }, 2000);
          });
        },
        error: (error) => {
          console.error('❌ Error updating property:', error);
          
          this.ngZone.run(() => {
            this.errorMessage = error.message || 'Failed to update property. Please try again.';
            this.isSubmitting = false;
            this.cdr.detectChanges();
          });
        }
      });
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.propertyForm.controls).forEach(key => {
      const control = this.propertyForm.get(key);
      control?.markAsTouched();
    });

    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  goBack(): void {
    this.router.navigate(['/property', this.propertyId]);
  }

  previewProperty(): void {
    this.router.navigate(['/property', this.propertyId]);
  }

  // Helper methods for template
  getFieldError(fieldName: string): string {
    const field = this.propertyForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    }
    return '';
  }
}