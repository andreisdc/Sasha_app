interface Property {
  id: number;
  name: string;
  pricePerNight: string;
  type: string; //apartament/hotel/house
  description: string;
  location: string; //city, area
  rating: number;
  facilities: string[]; // list of facilities
  food: string[]; // list of food options
  images: string[];
  liked: boolean;
}
