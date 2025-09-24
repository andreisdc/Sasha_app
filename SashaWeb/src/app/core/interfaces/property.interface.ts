export interface Property {
  id: number;
  name: string;
  pricePerNight: number;
  type: string; //apartament/hotel/house
  description: string;
  location: string;
  area?: string;
  rating: number;
  facilities: string[]; // list of facilities
  food: string[]; // list of food options
  images: string[];
  liked: boolean;
}
