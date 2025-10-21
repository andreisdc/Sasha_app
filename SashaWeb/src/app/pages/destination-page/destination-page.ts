import { Component, OnInit, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';

// Importăm fișierul JSON direct din același folder
import * as locationsData from './data.json';
import { Navbar } from "../../components/navbar/navbar";

interface Location {
  name: string; lat: number; lng: number; slug: string; type: string; image: string;
  description: string; highlights: string[]; bestTime: string; county: string;
  population?: string; founded?: string; traditionalCraft?: string;
  bestMonths?: string[]; 
  seasons?: string[]; 
}

interface MonthOption {
  value: string;
  name: string;
  season: string;
}

// NOU: Interfață pentru detaliile categoriei
interface CategoryDetail {
  name: string; // 'castle', 'nature', etc.
  displayName: string; // 'Castles', 'Natural Wonders'
  description: string;
  image: string; // URL către o imagine reprezentativă
  facts: string[]; // Fapte interesante
}

@Component({
  selector: 'app-destination-page',
  standalone: true,
  imports: [CommonModule, LeafletModule, Navbar],
  templateUrl: './destination-page.html',
  styleUrls: ['./destination-page.less'],
  animations: [
    trigger('slideInOut', [
      state('in', style({ transform: 'translateX(0%)' })),
      state('out', style({ transform: 'translateX(100%)' })),
      transition('out => in', animate('300ms ease-out')),
      transition('in => out', animate('250ms ease-in'))
    ])
  ]
})
export class DestinationPageComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  private markerLayerGroup: L.LayerGroup = L.layerGroup();
  private romaniaOutlineLayer: L.Layer | null = null;
  
 public readonly options = {
    layers: [L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors, &copy; CARTO'
    })],
    zoom: 7, 
    center: L.latLng(45.9432, 24.9668),
    minZoom: 6, 
    maxZoom: 15,
    maxBounds: L.latLngBounds(
      L.latLng(43.5, 20.0),
      L.latLng(48.5, 30.0)
    ),
    maxBoundsViscosity: 1.0,
    zoomControl: false
  };
  public activeFilter: string = 'all';
  public filterTypes: string[] = [];
  public locations: Location[] = [];
  public counties: string[] = [];
  public selectedCounty: string = 'all';

  public selectedSeason: string = 'all';
  public selectedMonth: string = 'all';
  public seasons: string[] = ['all', 'spring', 'summer', 'autumn', 'winter'];
  public months: MonthOption[] = [
    { value: 'all', name: 'Toate lunile', season: 'all' },
    { value: 'january', name: 'Ianuarie', season: 'winter' },
    { value: 'february', name: 'Februarie', season: 'winter' },
    { value: 'march', name: 'Martie', season: 'spring' },
    { value: 'april', name: 'Aprilie', season: 'spring' },
    { value: 'may', name: 'Mai', season: 'spring' },
    { value: 'june', name: 'Iunie', season: 'summer' },
    { value: 'july', name: 'Iulie', season: 'summer' },
    { value: 'august', name: 'August', season: 'summer' },
    { value: 'september', name: 'Septembrie', season: 'autumn' },
    { value: 'october', name: 'Octombrie', season: 'autumn' },
    { value: 'november', name: 'Noiembrie', season: 'autumn' },
    { value: 'december', name: 'Decembrie', season: 'winter' }
  ];

  // MODIFICAT: Starea panoului va gestiona acum ambele tipuri de conținut
  public activePanelContent: Location | CategoryDetail | null = null;
  public panelContentType: 'location' | 'category' | null = null;
  public panelState: 'in' | 'out' = 'out';

  private iconCache: Map<string, L.DivIcon> = new Map();

  // NOU: Datele pentru panoul de categorii
  // Notă: Va trebui să adaugi imaginile corespunzătoare în folderul `assets`
  private categoryDetails: { [key: string]: CategoryDetail } = {
    'castle': {
      name: 'castle',
      displayName: 'Castles & Palaces',
      description: 'Romania is famed for its stunning castles, from medieval strongholds to royal palaces. These structures are rich in history, legend, and architectural beauty, often set in dramatic landscapes.',
      image: 'assets/images/categories/category-castle.jpg', // Asigură-te că ai această imagine
      facts: [
        'Bran Castle is famously (though inaccurately) linked to the Dracula legend.',
        'Peleș Castle was the first in Europe to be fully lit by electricity.',
        'Corvin Castle is one of the largest castles in Europe and a prime example of Gothic architecture.'
      ]
    },
    'nature': {
      name: 'nature',
      displayName: 'Natural Wonders',
      description: 'From the peaks of the Carpathian Mountains to the unique ecosystem of the Danube Delta, Romania offers breathtaking natural diversity. Explore national parks, waterfalls, caves, and pristine forests.',
      image: 'assets/images/categories/category-nature.jpg',
      facts: [
        'The Danube Delta is a UNESCO World Heritage site and a paradise for bird watchers.',
        'The Carpathian Mountains are home to the largest populations of brown bears, wolves, and lynx in Europe.',
        'Bigăr Waterfall is famous for the unique way the water spreads over a moss-covered rock.'
      ]
    },
    'village': {
      name: 'village',
      displayName: 'Traditional Villages',
      description: 'Discover the heart of Romanian culture in its traditional villages. Here, ancient customs, crafts, and a simpler way of life are preserved, offering a unique glimpse into the country\'s soul.',
      image: 'assets/images/categories/category-village.jpg',
      facts: [
        'The painted monasteries of Bucovina are UNESCO World Heritage sites.',
        'Maramureș is famous for its unique wooden churches with towering spires.',
        'Villages like Viscri and Biertan in Transylvania have fortified churches, also part of UNESCO heritage.'
      ]
    },
    'monastery': {
      name: 'monastery',
      displayName: 'Monasteries',
      description: 'Romanian monasteries are centers of spiritual life, art, and history. Many are architectural masterpieces, renowned for their stunning frescoes, peaceful courtyards, and rich collections.',
      image: 'assets/images/categories/category-monastery.jpg',
      facts: [
        'Voroneț Monastery is known as the "Sistine Chapel of the East" for its vibrant blue frescoes.',
        'Many monasteries were built by great rulers like Stephen the Great as a sign of gratitude after battles.',
        'The monasteries in Oltenia (like Horezu) are known for the distinct "Brâncovenesc" architectural style.'
      ]
    },
    'city': {
      name: 'city',
      displayName: 'Historic Cities',
      description: 'Explore Romania\'s vibrant cities, where medieval history blends with modern energy. Discover charming old towns, grand architecture, and a lively cultural scene.',
      image: 'assets/images/categories/category-city.jpg',
      facts: [
        'Sighișoara boasts one of the last inhabited medieval citadels in Europe and is a UNESCO site.',
        'Brașov features the "Black Church", the largest Gothic church between Vienna and Istanbul.',
        'Timișoara was the first city in mainland Europe to have electric street lighting.'
      ]
    },
    'fortress': {
      name: 'fortress',
      displayName: 'Fortresses & Citadels',
      description: 'Standing as silent witnesses to a turbulent history, Romania\'s fortresses range from imposing hilltop citadels to heavily fortified churches built by Saxon settlers in Transylvania.',
      image: 'assets/images/categories/category-fortress.jpg',
      facts: [
        'Râșnov Fortress was built by Teutonic Knights in the 13th century and offered refuge for villagers.',
        'The Alba Carolina Citadel in Alba Iulia is a massive, star-shaped Vauban-style fortress.',
        'Many Transylvanian villages have fortified churches, unique in Europe, built to protect against invasions.'
      ]
    },
    'beach': {
      name: 'beach',
      displayName: 'Black Sea Beaches',
      description: 'Romania\'s Black Sea coast offers sandy beaches, vibrant resorts, and therapeutic mud spas. From the lively atmosphere of Mamaia to the relaxed vibe of Vama Veche, there is a spot for everyone.',
      image: 'assets/images/categories/category-beach.jpg',
      facts: [
        'Techirghiol Lake, near the coast, is famous for its sapropelic mud, known for its healing properties.',
        'Mamaia is one of the oldest and largest resorts, known for its vibrant nightlife.',
        'Vama Veche maintains a bohemian, artistic atmosphere, popular with students and creatives.'
      ]
    },
    'mountain': {
      name: 'mountain',
      displayName: 'Mountain Adventures',
      description: 'The Carpathian Mountains are the green heart of Romania, offering endless opportunities for hiking, wildlife watching, and exploring scenic routes like the Transfăgărășan and Transalpina.',
      image: 'assets/images/categories/category-mountain.jpg',
      facts: [
        'The Transfăgărășan was named "the best road in the world" by Top Gear.',
        'The Carpathians are divided into three main ranges: Eastern, Southern (with the highest peaks), and Western.',
        'Piatra Craiului National Park is a massive limestone ridge, perfect for challenging hikes.'
      ]
    },
    'history': {
      name: 'history',
      displayName: 'Historical Sites',
      description: 'Journey back in time by visiting Romania\'s rich historical sites. From the ruins of the ancient Dacian kingdom to medieval towns and Roman vestiges, the past is always present.',
      image: 'assets/images/categories/category-history.jpg',
      facts: [
        'Sarmizegetusa Regia was the capital and most important military and religious center of the ancient Dacians.',
        'Adamclisi features a grand monument, Tropaeum Traiani, built by Emperor Trajan to celebrate his victory over the Dacians.',
        'The Histria Citadel is the oldest certified town on Romanian territory, founded by Greek colonists.'
      ]
    },
    'ski': {
      name: 'ski',
      displayName: 'Ski Resorts',
      description: 'During winter, Romania\'s mountains transform into a paradise for ski and snowboard enthusiasts. Resorts like Poiana Brașov, Sinaia, and Predeal offer slopes for all skill levels.',
      image: 'assets/images/categories/category-ski.jpg',
      facts: [
        'Poiana Brașov is the largest and one of the most modern ski resorts in Romania.',
        'Sinaia is known as the "Pearl of the Carpathians" and offers high-altitude skiing.',
        'The ski season in Romania generally lasts from December until March or April, depending on the altitude.'
      ]
    }

  };


  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    let data = (locationsData as any).default;

    if (data && data.locations) {
      this.locations = data.locations as Location[];
    } else {
      this.locations = data as Location[];
    }

    const types = Array.from(new Set(this.locations.map(l => l.type))).sort();
    this.filterTypes = ['all', ...types];
    this.counties = ['all', ...Array.from(new Set(this.locations.map(l => l.county))).sort()];
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.removeLayer(this.markerLayerGroup);
      if (this.romaniaOutlineLayer) {
        this.map.removeLayer(this.romaniaOutlineLayer);
      }
      this.map.remove();
      this.iconCache.clear();
    }
  }

  // NOU: Getters pentru a accesa ușor conținutul activ în template
  public get activeLocation(): Location | null {
    return this.panelContentType === 'location' ? (this.activePanelContent as Location) : null;
  }
  
  public get activeCategory(): CategoryDetail | null {
    return this.panelContentType === 'category' ? (this.activePanelContent as CategoryDetail) : null;
  }

  onMapReady($event: L.Map) {
    this.map = $event;
    this.markerLayerGroup.addTo(this.map);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    
    this.updateMapMarkers(); 
    
    this.map.on('zoomend', () => {
      this.refreshMarkers();
    });
  }

  private createFallbackOutline() {
    const romaniaBounds = L.latLngBounds(
      L.latLng(43.5, 20.0),
      L.latLng(48.5, 30.0)
    );
    
    this.romaniaOutlineLayer = L.rectangle(romaniaBounds, {
      color: '#000000',
      weight: 1.5,
      fillColor: 'transparent',
      fillOpacity: 0,
      opacity: 0.8,
      interactive: false
    }).addTo(this.map);
  }

  public onCountyChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    if (selectElement) {
      this.setCounty(selectElement.value);
    }
  }


  public setFilter(type: string) {
    this.activeFilter = type;
    this.updateMapMarkers();
  }

  public setCounty(county: string) {
    this.selectedCounty = county;
    this.updateMapMarkers();
  }

 

  public getFilteredLocations(): Location[] {
    let filtered = this.locations;
    
    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(l => l.type === this.activeFilter);
    }
    
    if (this.selectedCounty !== 'all') {
      filtered = filtered.filter(l => l.county === this.selectedCounty);
    }

    if (this.selectedSeason !== 'all') {
      filtered = filtered.filter(l => 
        l.seasons && l.seasons.includes(this.selectedSeason)
      );
    }

    if (this.selectedMonth !== 'all') {
      filtered = filtered.filter(l => 
        l.bestMonths && l.bestMonths.includes(this.selectedMonth)
      );
    }
    
    return filtered;
  }

  public getSeasonIcon(season: string): string {
    const seasonIcons: { [key: string]: string } = {
      'all': 'fa-solid fa-calendar',
      'spring': 'fa-solid fa-seedling',
      'summer': 'fa-solid fa-sun',
      'autumn': 'fa-solid fa-leaf',
      'winter': 'fa-solid fa-snowflake'
    };
    return seasonIcons[season] || seasonIcons['all'];
  }

  public getSeasonColor(season: string): string {
    const seasonColors: { [key: string]: string } = {
      'all': '#6B7280',
      'spring': '#10B981',
      'summer': '#F59E0B',
      'autumn': '#EA580C',
      'winter': '#3B82F6'
    };
    return seasonColors[season] || seasonColors['all'];
  }

  public getMonthIcon(month: string): string {
    const monthIcons: { [key: string]: string } = {
      'all': 'fa-solid fa-calendar-days',
      'january': 'fa-solid fa-snowflake',
      'february': 'fa-solid fa-snowman',
      'march': 'fa-solid fa-flower',
      'april': 'fa-solid fa-umbrella',
      'may': 'fa-solid fa-leaf',
      'june': 'fa-solid fa-sun',
      'july': 'fa-solid fa-temperature-high',
      'august': 'fa-solid fa-sun',
      'september': 'fa-solid fa-apple-whole',
      'october': 'fa-solid fa-leaf',
      'november': 'fa-solid fa-cloud-rain',
      'december': 'fa-solid fa-snowflake'
    };
    return monthIcons[month] || monthIcons['all'];
  }

  public getMonthColor(month: string): string {
    const monthColors: { [key: string]: string } = {
      'all': '#6B7280',
      'january': '#3B82F6',
      'february': '#60A5FA',
      'march': '#10B981',
      'april': '#34D399',
      'may': '#22C55E',
      'june': '#F59E0B',
      'july': '#F97316',
      'august': '#EA580C',
      'september': '#D97706',
      'october': '#B45309',
      'november': '#6B7280',
      'december': '#1D4ED8'
    };
    return monthColors[month] || monthColors['all'];
  }

  private getIconForLocation(type: string = 'default', zoomLevel?: number): L.DivIcon {
    const cacheKey = `${type}_${zoomLevel || this.map?.getZoom() || 7}`;
    
    if (this.iconCache.has(cacheKey)) {
      return this.iconCache.get(cacheKey)!;
    }

    const iconColor = this.getIconColor(type);
    const currentZoom = zoomLevel || this.map?.getZoom() || 7;
    
    let size, anchorX, anchorY;
    
    if (currentZoom >= 12) {
      size = 48; anchorX = 24; anchorY = 48;
    } else if (currentZoom >= 9) {
      size = 40; anchorX = 20; anchorY = 40;
    } else {
      size = 32; anchorX = 16; anchorY = 32;
    }

    const iconClass = this.getIconClass(type);
    
    const html = `
      <div class="custom-icon-marker" style="
        background-color: ${iconColor}; width: ${size}px; height: ${size}px;
        border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex;
        align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <div class="icon-wrapper" style="
          transform: rotate(45deg); display: flex; align-items: center; justify-content: center;
          width: 100%; height: 100%; color: white; font-size: ${size * 0.4}px;
        ">
          <i class="${iconClass}"></i>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: `custom-icon-marker-container-${type}`, html: html,
      iconSize: [size, size], iconAnchor: [anchorX, anchorY], popupAnchor: [0, -anchorY]
    });

    this.iconCache.set(cacheKey, icon);
    return icon;
  }

  public getIconClass(type: string): string {
    const iconClasses: { [key: string]: string } = {
      'all': 'fa-solid fa-globe-europe',
      'castle': 'fa-solid fa-chess-rook',
      'nature': 'fa-solid fa-tree',
      'village': 'fa-solid fa-house-chimney',
      'monastery': 'fa-solid fa-church',
      'fortress': 'fa-solid fa-tent',
      'beach': 'fa-solid fa-umbrella-beach',
      'city': 'fa-solid fa-city',
      'mountain': 'fa-solid fa-mountain',
      'history': 'fa-solid fa-landmark',
      'default': 'fa-solid fa-location-dot',
      'ski': 'fa-solid fa-person-skiing'
    };
    return iconClasses[type] || iconClasses['default'];
  }

  public getLocationCountByType(type: string): number {
    return this.locations.filter(l => l.type === type).length;
  }

  public getIconColor(type: string): string {
    const colors: { [key: string]: string } = {
      'all': '#3B82F6',
      'castle': '#1E3A8A',
      'nature': '#10B981',
      'village': '#F97316',
      'monastery': '#7C3AED',
      'fortress': '#DC2626',
      'beach': '#00A2D8',
      'city': '#3B82F6',
      'mountain': '#059669',
      'history': '#EA580C',
      'default': '#EA580C',
      'ski': '#cdcdcdff'
    };
    return colors[type] || colors['default'];
  }

  private updateMapMarkers() {
    if (!this.markerLayerGroup || !this.map) return;

    this.markerLayerGroup.clearLayers();
    this.addMarkersToMap();
  }

  private refreshMarkers() {
    if (!this.markerLayerGroup || !this.map) return;
    const existingMarkers: Array<{location: Location, marker: L.Marker}> = [];
    this.markerLayerGroup.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const location = (layer as any).locationData as Location;
        if (location) {
          existingMarkers.push({ location, marker: layer as L.Marker });
        }
      }
    });
    this.markerLayerGroup.clearLayers();
    existingMarkers.forEach(({ location, marker }) => {
      const newIcon = this.getIconForLocation(location.type);
      marker.setIcon(newIcon);
      this.markerLayerGroup.addLayer(marker);
    });
  }

  private addMarkersToMap() {
    const filteredLocations = this.getFilteredLocations();
    filteredLocations.forEach(loc => {
      const icon = this.getIconForLocation(loc.type);
      const marker = L.marker([loc.lat, loc.lng], { icon: icon });
      (marker as any).locationData = loc;
      marker.on('click', () => {
        this.zone.run(() => this.openPanelWithLocation(loc));
      });
      this.markerLayerGroup.addLayer(marker);
    });
  }

  // MODIFICAT: Logica de deschidere panou
  public openPanelWithLocation(location: Location) {
    this.activePanelContent = location;
    this.panelContentType = 'location';
    this.panelState = 'in';
    this.cdr.detectChanges();
  }

  // NOU: Metodă pentru a deschide panoul cu detalii despre categorie
  public openPanelWithCategory(type: string) {
    const categoryData = this.categoryDetails[type];
    if (categoryData) {
      this.activePanelContent = categoryData;
      this.panelContentType = 'category';
      this.panelState = 'in';
      this.cdr.detectChanges();
    } else {
      // Dacă nu avem detalii (ex: 'ski', 'beach' etc.), doar filtrăm
      this.setFilter(type);
    }
  }

  // MODIFICAT: Logica de închidere panou
  public closePanel() {
    this.panelState = 'out';
    this.cdr.detectChanges();
  }

  // MODIFICAT: Logica de resetare după animație
  public onAnimationDone(event: any) {
    if (event.toState === 'out') {
      this.activePanelContent = null;
      this.panelContentType = null;
      this.cdr.detectChanges();
    }
  }

  public navigateToDestination(slug: string) {
    this.closePanel();
    setTimeout(() => {
      this.router.navigate(['/destination', slug]);
    }, 250);
  }

  public getLocationsByCounty(county: string): Location[] {
    return this.locations.filter(l => l.county === county);
  }

  public getSelectedMonthName(): string {
    if (this.selectedMonth === 'all') return '';
    const month = this.months.find(m => m.value === this.selectedMonth);
    return month ? month.name : '';
  }

  // Metodă pentru a obține numele sezonului selectat
  public getSelectedSeasonName(): string {
    if (this.selectedSeason === 'all') return '';
    return this.selectedSeason.charAt(0).toUpperCase() + this.selectedSeason.slice(1);
  }

  // Metodă pentru a obține lunile recomandate pentru o destinație
  public getLocationMonthNames(bestMonths: string[] | undefined): string[] {
    if (!bestMonths) return [];
    return bestMonths.map(month => {
      const monthData = this.months.find(m => m.value === month);
      return monthData ? monthData.name : month;
    });
  }

  public getCountyTypes(county: string): number {
    const locations = this.locations.filter(l => l.county === county);
    return new Set(locations.map(l => l.type)).size;
  }
}