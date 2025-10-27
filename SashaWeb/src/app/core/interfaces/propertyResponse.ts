// property.interface.ts

// Interface pentru răspunsul de la backend
export interface PropertyResponse {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  locationType: string;
  address: string;
  city: string;
  county: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  status: string;
  pricePerNight: number;
  minNights: number;
  maxNights: number;
  checkInTime: string;
  checkOutTime: string;
  maxGuests: number;
  bathrooms: number;
  kitchen: boolean;
  livingSpace: number;
  petFriendly: boolean;
  smokeDetector: boolean;
  fireExtinguisher: boolean;
  carbonMonoxideDetector: boolean;
  lockType: string;
  averageRating: number;
  reviewCount: number;
  neighborhoodDescription: string;
  tags: string[];
  instantBook: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface pentru frontend - extinde PropertyResponse și adaugă câmpurile necesare
export interface Property extends PropertyResponse {
  propertyType: string;
  bedrooms: number;
  images: string[];
  amenities: string[];
  activities: any[];
}

// Interface pentru crearea proprietății
export interface CreatePropertyRequest {
  ownerId: string | undefined;
  title: string;
  description: string;
  locationType: string;
  address: string;
  city: string;
  county: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  minNights: number;
  maxNights: number;
  checkInTime: string;
  checkOutTime: string;
  maxGuests: number;
  bathrooms: number;
  kitchen: boolean;
  livingSpace: number;
  petFriendly: boolean;
  smokeDetector: boolean;
  fireExtinguisher: boolean;
  carbonMonoxideDetector: boolean;
  lockType: string;
  neighborhoodDescription: string;
  tags: string[];
  instantBook: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UploadPhotosResponse {
  success: boolean;
  message: string;
  data: string[];
}