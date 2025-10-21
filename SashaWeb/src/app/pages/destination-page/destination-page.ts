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
  bestMonths?: string[]; // Adăugat: luni recomandate pentru vizită
  seasons?: string[]; // Adăugat: sezoane recomandate
}

interface MonthOption {
  value: string;
  name: string;
  season: string;
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
    maxZoom: 12,
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

  // Filtre noi pentru sezon și lună
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

  public activeLocation: Location | null = null;
  public panelState: 'in' | 'out' = 'out';

  private iconCache: Map<string, L.DivIcon> = new Map();

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

    // Filtrare după sezon
    if (this.selectedSeason !== 'all') {
      filtered = filtered.filter(l => 
        l.seasons && l.seasons.includes(this.selectedSeason)
      );
    }

    // Filtrare după lună
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

  // Restul metodelor rămân la fel...
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

  public openPanelWithLocation(location: Location) {
    this.activeLocation = location;
    this.panelState = 'in';
    this.cdr.detectChanges();
  }

  public closePanel() {
    this.panelState = 'out';
    this.cdr.detectChanges();
  }

  public onAnimationDone(event: any) {
    if (event.toState === 'out') {
      this.activeLocation = null;
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