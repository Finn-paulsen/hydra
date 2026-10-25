/**
 * HiveMindArchive Component
 * Integriert HIVE-MIND Mapping in GOV-ARCHIVE
 * Zeigt geografische Daten aus der Polizei-Datenbank
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import './HiveMindArchive.css';

const DEFAULT_CENTER = [51.1657, 10.4515]; // Germanys center
const DEFAULT_ZOOM = 6;

// Mock Daten für Polizei-Standorte mit echten deutschen Koordinaten
const POLICE_LOCATIONS = [
  {
    id: 'poli_001',
    name: 'Polizeipräsidium Berlin',
    type: 'police',
    lat: 52.5200,
    lng: 13.4050,
    activeInvestigations: 12,
    status: 'active',
    cases: ['4711', '4712', '4713']
  },
  {
    id: 'poli_002',
    name: 'BKA München',
    type: 'bka',
    lat: 48.1351,
    lng: 11.5820,
    activeInvestigations: 8,
    status: 'active',
    cases: ['5001', '5002']
  },
  {
    id: 'poli_003',
    name: 'Polizei Köln',
    type: 'police',
    lat: 50.9365,
    lng: 6.9589,
    activeInvestigations: 5,
    status: 'active',
    cases: ['6001']
  },
  {
    id: 'poli_004',
    name: 'Polizei Hamburg',
    type: 'police',
    lat: 53.5511,
    lng: 9.9937,
    activeInvestigations: 15,
    status: 'active',
    cases: ['7001', '7002', '7003']
  },
  {
    id: 'poli_005',
    name: 'Cybercrime Unit Frankfurt',
    type: 'cyber',
    lat: 50.1109,
    lng: 8.6821,
    activeInvestigations: 20,
    status: 'critical',
    cases: ['8001', '8002', '8003', '8004']
  }
];

export default function HiveMindArchive({ onLocationSelect, onCaseOpen }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const filteredLocations = POLICE_LOCATIONS.filter(loc => 
    filterType === 'all' || loc.type === filterType
  );

  const handleLocationClick = useCallback((location) => {
    setSelectedLocation(location);
    setShowLocationDetails(true);
    onLocationSelect?.(location);
  }, [onLocationSelect]);

  const handleCaseClick = useCallback((caseId) => {
    onCaseOpen?.(caseId);
  }, [onCaseOpen]);

  const getLocationColor = (location) => {
    switch (location.status) {
      case 'critical': return '#ff0000';
      case 'warning': return '#ff9900';
      case 'active': return '#00cc00';
      default: return '#0066cc';
    }
  };

  const getLocationIcon = (type) => {
    const icons = {
      police: '🚔',
      bka: '🏛️',
      cyber: '🔒'
    };
    return icons[type] || '📍';
  };

  return (
    <div className="hivemind-archive-container">
      {/* Sidebar Controls */}
      <div className="hivemind-sidebar">
        <h3>Geografische Fallverfolgung</h3>
        
        {/* Filter */}
        <div className="filter-group">
          <label>Filtertyp:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Alle Behörden</option>
            <option value="police">Polizei</option>
            <option value="bka">BKA</option>
            <option value="cyber">Cybercrime</option>
          </select>
        </div>

        {/* Location List */}
        <div className="location-list">
          <h4>Aktive Standorte ({filteredLocations.length})</h4>
          {filteredLocations.map(location => (
            <div
              key={location.id}
              className={`location-item ${selectedLocation?.id === location.id ? 'selected' : ''}`}
              onClick={() => handleLocationClick(location)}
            >
              <div className="location-icon">{getLocationIcon(location.type)}</div>
              <div className="location-info">
                <div className="location-name">{location.name}</div>
                <div className="location-cases">
                  {location.activeInvestigations} aktive Fälle
                </div>
              </div>
              <div className={`status-badge ${location.status}`}>
                {location.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Area */}
      <div className="hivemind-map-area">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '100%', width: '100%' }}
        >
          {/* OpenStreetMap Tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Location Markers */}
          {filteredLocations.map(location => (
            <CircleMarker
              key={location.id}
              center={[location.lat, location.lng]}
              radius={8}
              fillColor={getLocationColor(location)}
              color={getLocationColor(location)}
              weight={2}
              opacity={0.8}
              fillOpacity={0.7}
              eventHandlers={{
                click: () => handleLocationClick(location)
              }}
            >
              <Popup>
                <div className="location-popup">
                  <h4>{location.name}</h4>
                  <p>Fälle: {location.cases.length}</p>
                  <p>Status: {location.status}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Details Panel */}
        {showLocationDetails && selectedLocation && (
          <div className="location-details-panel">
            <button 
              className="close-btn" 
              onClick={() => setShowLocationDetails(false)}
            >
              ✕
            </button>
            
            <h3>{selectedLocation.name}</h3>
            <div className="detail-section">
              <label>Typ:</label>
              <span>{selectedLocation.type.toUpperCase()}</span>
            </div>
            
            <div className="detail-section">
              <label>Status:</label>
              <span className={`status-badge ${selectedLocation.status}`}>
                {selectedLocation.status}
              </span>
            </div>

            <div className="detail-section">
              <label>Aktive Untersuchungen:</label>
              <span>{selectedLocation.activeInvestigations}</span>
            </div>

            <div className="detail-section">
              <label>Verbundene Fälle:</label>
              <div className="cases-list">
                {selectedLocation.cases.map(caseId => (
                  <div 
                    key={caseId}
                    className="case-tag"
                    onClick={() => handleCaseClick(caseId)}
                  >
                    {caseId}
                  </div>
                ))}
              </div>
            </div>

            <button className="query-btn">
              Datenbankabfrage starten
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
