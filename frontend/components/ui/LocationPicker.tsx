'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface LocationPickerProps {
  value?: Location;
  onChange: (location: Location) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

// Type guard for Google Maps
declare const google: any;

export function LocationPicker({
  value,
  onChange,
  label = 'Service Location',
  error,
  required,
  className,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    // Check if Google Maps is loaded
    if (typeof window !== 'undefined' && window.google) {
      initializeMap();
    } else {
      // Load Google Maps script
      loadGoogleMaps();
    }
  }, []);

  const loadGoogleMaps = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBMockKey123456789';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => initializeMap();
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || typeof google === 'undefined') return;

    const defaultCenter = value 
      ? { lat: value.lat, lng: value.lng }
      : { lat: 37.7749, lng: -122.4194 }; // San Francisco default

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });

    setMap(mapInstance);

    // Initialize services
    autocompleteRef.current = new google.maps.places.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();

    // Add click listener to map
    mapInstance.addListener('click', (e: any) => {
      if (e.latLng) {
        handleMapClick(e.latLng);
      }
    });

    // Add marker if value exists
    if (value) {
      addMarker(defaultCenter, mapInstance);
    }

    // Try to get user's current location
    if (navigator.geolocation && !value) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapInstance.setCenter(pos);
        },
        () => {
          console.log('Location access denied');
        }
      );
    }
  };

  const addMarker = (position: { lat: number; lng: number }, mapInstance?: any) => {
    const targetMap = mapInstance || map;
    if (!targetMap || typeof google === 'undefined') return;

    // Remove existing marker
    if (marker) {
      marker.setMap(null);
    }

    const newMarker = new google.maps.Marker({
      position,
      map: targetMap,
      draggable: true,
      animation: google.maps.Animation.DROP,
    });

    newMarker.addListener('dragend', () => {
      const pos = newMarker.getPosition();
      if (pos) {
        handleMapClick(pos);
      }
    });

    setMarker(newMarker);
  };

  const handleMapClick = async (latLng: any) => {
    const lat = latLng.lat();
    const lng = latLng.lng();

    addMarker({ lat, lng });

    // Reverse geocode to get address
    if (geocoderRef.current) {
      try {
        const result = await geocoderRef.current.geocode({ location: latLng });
        if (result.results[0]) {
          const addressComponents = result.results[0].address_components;
          const location: Location = {
            lat,
            lng,
            address: result.results[0].formatted_address,
          };

          // Parse address components
          addressComponents.forEach((component: any) => {
            if (component.types.includes('locality')) {
              location.city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              location.state = component.short_name;
            }
            if (component.types.includes('postal_code')) {
              location.zipCode = component.long_name;
            }
            if (component.types.includes('country')) {
              location.country = component.short_name;
            }
          });

          onChange(location);
          setSearchQuery(location.address || '');
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        onChange({ lat, lng });
      }
    } else {
      onChange({ lat, lng });
    }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (query.length < 3 || !autocompleteRef.current) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);

    autocompleteRef.current.getPlacePredictions(
      { input: query },
      (predictions: any, status: any) => {
        setIsSearching(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      }
    );
  }, []);

  const handleSelectSuggestion = async (placeId: string) => {
    if (!geocoderRef.current || !map) return;

    try {
      const result = await geocoderRef.current.geocode({ placeId });
      if (result.results[0]) {
        const place = result.results[0];
        const latLng = place.geometry.location;
        
        map.setCenter(latLng);
        map.setZoom(15);
        
        handleMapClick(latLng);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Place selection error:', error);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation && typeof google !== 'undefined') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latLng = new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );
          if (map) {
            map.setCenter(latLng);
            map.setZoom(15);
          }
          handleMapClick(latLng);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enter address manually or click on map.');
        }
      );
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    if (marker) {
      marker.setMap(null);
      setMarker(null);
    }
    onChange({ lat: 0, lng: 0 });
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Search Input */}
      <div className="relative mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for address or place..."
            className="w-full pl-10 pr-24 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCurrentLocation}
              className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              title="Use current location"
            >
              <MapPin className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion.place_id)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-80 rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden"
        />
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm text-gray-600 dark:text-gray-300">
          Click on map to set location or drag the marker
        </div>
      </div>

      {/* Selected Location Info */}
      {value && value.lat !== 0 && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {value.address || 'Selected Location'}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Coordinates: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

// Simpler read-only map display component
interface LocationMapProps {
  location: Location;
  height?: string;
  showMarker?: boolean;
  className?: string;
}

export function LocationMap({
  location,
  height = 'h-64',
  showMarker = true,
  className,
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    if (!mapRef.current || map) return;

    if (typeof window !== 'undefined' && typeof google !== 'undefined') {
      initMap();
    } else {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBMockKey123456789';
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    }
  }, [location]);

  const initMap = () => {
    if (!mapRef.current || typeof google === 'undefined') return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: location.lat, lng: location.lng },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
    });

    if (showMarker) {
      new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: mapInstance,
        title: location.address || 'Service Location',
      });
    }

    setMap(mapInstance);
  };

  return (
    <div className={cn('w-full', className)}>
      <div ref={mapRef} className={cn('w-full rounded-lg overflow-hidden', height)} />
      {location.address && (
        <div className="mt-2 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{location.address}</span>
        </div>
      )}
    </div>
  );
}
