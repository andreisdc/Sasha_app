import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Component({
  selector: 'app-destination-page',
  standalone: true,
  imports: [
    LeafletModule
  ],
  templateUrl: './destination-page.html',
  styleUrl: './destination-page.less'
})
export class DestinationPage implements OnInit {
onMapReady // Date extinse pentru locații cu imagini și descrieri
($event: L.Map) {
throw new Error('Method not implemented.');
}

  romaniaBounds = L.latLngBounds(
    L.latLng(43.5, 20.0),
    L.latLng(48.5, 30.0)
  );

  options = {
    layers: [
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      })
    ],
    zoom: 7,
    center: L.latLng(45.9432, 24.9668),
    maxBounds: this.romaniaBounds,
    minZoom: 7,
    maxBoundsViscosity: 1.0
  };

  layers: L.Layer[] = [];
  hoverModal: any = null;
  currentLocation: any = null;

  // Date extinse pentru locații cu imagini și descrieri
  locations = [
    { 
      name: 'Sinaia (Peleș Castle)', 
      lat: 45.3600, 
      lng: 25.5428, 
      slug: 'sinaia',
      image: 'https://images.unsplash.com/photo-1598366833090-ec0c89f6c5d6?w=400&h=300&fit=crop',
      description: 'A stunning Neo-Renaissance castle nestled in the Carpathian Mountains, former summer residence of Romanian royalty.',
      highlights: ['Peleș Castle', 'Sinaia Monastery', 'Carpathian Mountains', 'Cable car rides'],
      bestTime: 'May - October'
    },
    { 
      name: 'Brașov (Old Center)', 
      lat: 45.6427, 
      lng: 25.5887, 
      slug: 'brasov',
      image: 'https://images.unsplash.com/photo-1584646098377-6ac4e4e53e52?w=400&h=300&fit=crop',
      description: 'Medieval Saxon city surrounded by mountains, famous for the Black Church and picturesque old town.',
      highlights: ['Black Church', 'Council Square', 'Tâmpa Mountain', 'Rope Street'],
      bestTime: 'Year-round'
    },
    { 
      name: 'Sibiu (Grand Square)', 
      lat: 45.7983, 
      lng: 24.1521, 
      slug: 'sibiu',
      image: 'https://images.unsplash.com/photo-1591183481091-b0e8bed7e8c7?w=400&h=300&fit=crop',
      description: 'European Capital of Culture in 2007, known for its Germanic architecture and the eyes of Sibiu.',
      highlights: ['Grand Square', 'Liars Bridge', 'ASTRA Museum', 'Evangelical Cathedral'],
      bestTime: 'April - September'
    },
    { 
      name: 'Cluj-Napoca', 
      lat: 46.7712, 
      lng: 23.6236, 
      slug: 'cluj-napoca',
      image: 'https://images.unsplash.com/photo-1580136607996-b692c65ed1c1?w=400&h=300&fit=crop',
      description: 'The heart of Transylvania, a vibrant university city with rich history and modern cultural scene.',
      highlights: ['St. Michael Church', 'Central Park', 'Ethnographic Museum', 'Botanical Garden'],
      bestTime: 'Year-round'
    },
    { 
      name: 'Danube Delta (Tulcea)', 
      lat: 45.1763, 
      lng: 28.8024, 
      slug: 'delta-dunarii',
      image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&h=300&fit=crop',
      description: 'UNESCO Biosphere Reserve, the second largest river delta in Europe with unique biodiversity.',
      highlights: ['Bird watching', 'Boat tours', 'Fishing villages', 'Lily pads'],
      bestTime: 'April - September'
    },
    { 
      name: 'Transfăgărășan (Bâlea Lake)', 
      lat: 45.6041, 
      lng: 24.6163, 
      slug: 'transfagarasan',
      image: 'https://images.unsplash.com/photo-1506905925340-14faa3c85743?w=400&h=300&fit=crop',
      description: 'One of the most spectacular mountain roads in the world, crossing the Făgăraș Mountains.',
      highlights: ['Bâlea Lake', 'Bâlea Waterfall', 'Vidraru Dam', 'Mountain hiking'],
      bestTime: 'June - September'
    }
  ];

  // Iconiță custom îmbunătățită
  customMarkerIcon = L.divIcon({
    className: 'custom-marker-icon',
    html: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                  fill="#e65100" stroke="white" stroke-width="1"/>
           </svg>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  });

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadMapLayers();
  }

  loadMapLayers() {
    const markerLayers = this.locations.map(loc => {
      const marker = L.marker([loc.lat, loc.lng], { icon: this.customMarkerIcon });

      // Eveniment mouseover pentru afișarea modalului
      marker.on('mouseover', (e) => {
        this.showHoverModal(e, loc);
      });

      // Eveniment mouseout pentru ascunderea modalului
      marker.on('mouseout', () => {
        this.hideHoverModal();
      });

      // Eveniment click pentru navigare
      marker.on('click', () => {
        this.router.navigate(['/destination', loc.slug]);
      });

      return marker;
    });

    // Încarcă conturul țării
    this.http.get('assets/data/romania.geojson').subscribe({
      next: (geojsonData: any) => {
        const contourStyle = {
          color: "#003399",
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.1,
          fillColor: "#003399"
        };
        const geoJsonLayer = L.geoJSON(geojsonData, { style: contourStyle });
        this.layers = [geoJsonLayer, ...markerLayers];
      },
      error: (err) => {
        console.error('EROARE: Nu s-a putut încărca fișierul romania.geojson.', err);
        this.layers = markerLayers;
      }
    });
  }

  showHoverModal(e: any, location: any) {
    this.hideHoverModal(); // Ascunde orice modal existent
    
    this.currentLocation = location;
    
    // Creează elementul modal
    this.hoverModal = L.popup({
      className: 'custom-hover-popup',
      closeButton: false,
      autoClose: false,
      closeOnEscapeKey: false,
      closeOnClick: false
    })
    .setLatLng(e.latlng)
    .setContent(this.createPopupContent(location))
    .openOn(e.target._map);
  }

  hideHoverModal() {
    if (this.hoverModal) {
      this.hoverModal.remove();
      this.hoverModal = null;
    }
  }

  createPopupContent(location: any): string {
    return `
      <div class="location-popup">
        <div class="popup-image">
          <img src="${location.image}" alt="${location.name}" onerror="this.src='https://images.unsplash.com/photo-1506905925340-14faa3c85743?w=400&h=300&fit=crop'">
          <div class="popup-overlay"></div>
        </div>
        <div class="popup-content">
          <h3 class="popup-title">${location.name}</h3>
          <p class="popup-description">${location.description}</p>
          
          <div class="popup-details">
            <div class="detail-section">
              <h4>🏔️ Highlights</h4>
              <ul class="highlights-list">
                ${location.highlights.map((highlight: string) => `<li>${highlight}</li>`).join('')}
              </ul>
            </div>
            
            <div class="detail-section">
              <h4>📅 Best Time to Visit</h4>
              <span class="best-time">${location.bestTime}</span>
            </div>
          </div>
          
          <button class="explore-btn" onclick="this.closest('.location-popup').dispatchEvent(new CustomEvent('explore', {bubbles: true}))">
            Explore Destination →
          </button>
        </div>
      </div>
    `;
  }

  // Metodă pentru a naviga la destinație (folosită din template)
  navigateToDestination(slug: string) {
    this.router.navigate(['/destination', slug]);
  }
}