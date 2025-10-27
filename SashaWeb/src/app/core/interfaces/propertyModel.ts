import { PropertyResponse } from "./propertyResponse";

export interface Property extends PropertyResponse {
  propertyType: string;
  bedrooms: number;
  images: string[];
  amenities: string[];
  activities: any[];
}