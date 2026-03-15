'use client';

import { useEffect, useRef } from 'react';

// Declare google as a global variable
declare const google: any;

interface LocationMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  height?: string;
  zoom?: number;
}

/**
 * LocationMap - Read-only Google Maps display component
 * 
 * Shows a location marker on Google Maps with optional address info window.
 * Used for displaying saved locations on request details, job pages, etc.
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param address - Optional address to display in info window
 * @param height - CSS height value (default: '300px')
 * @param zoom - Map zoom level (default: 14)
 */
export default function LocationMap({
  latitude,
  longitude,
  address,
  height = '300px',
  zoom = 14
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Wait for Google Maps to load
    const initMap = () => {
      if (!google?.maps) {
        console.error('Google Maps not loaded');
        return;
      }

      const position = { lat: latitude, lng: longitude };

      // Create map
      mapInstanceRef.current = new google.maps.Map(mapRef.current!, {
        center: position,
        zoom: zoom,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Create marker
      markerRef.current = new google.maps.Marker({
        position: position,
        map: mapInstanceRef.current,
        title: address || 'Service Location',
      });

      // Create info window if address provided
      if (address) {
        infoWindowRef.current = new google.maps.InfoWindow({
          content: `<div style="padding: 8px; max-width: 200px;"><strong>Location</strong><br>${address}</div>`,
        });

        // Show info window on marker click
        markerRef.current.addListener('click', () => {
          infoWindowRef.current.open(mapInstanceRef.current, markerRef.current);
        });

        // Auto-open info window
        infoWindowRef.current.open(mapInstanceRef.current, markerRef.current);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      initMap();
    } else {
      // Wait for the script to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkGoogleMaps);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }

    // Cleanup on unmount
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [latitude, longitude, address, zoom]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ height }} 
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700"
      />
      {!latitude && !longitude && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
          style={{ height }}
        >
          <p className="text-gray-500 dark:text-gray-400">No location available</p>
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    google: any;
  }
}
