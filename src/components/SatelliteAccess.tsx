import React, { useState, useEffect } from 'react';
import './SatelliteAccess.css';

/**
 * SatelliteAccess Component
 * Innere Schicht - Geografische Überwachung und Sateliten-Zugriff
 * Echtzeit-Datenströme, Überwachungszonen, Signalstärke
 */

const SATELLITES = [
  { id: 1, name: 'SENTINEL-1A', status: 'ACTIVE', signal: 95, coverage: 'EU' },
  { id: 2, name: 'SENTINEL-2B', status: 'ACTIVE', signal: 87, coverage: 'EU' },
  { id: 3, name: 'LANDSAT-8', status: 'ACTIVE', signal: 72, coverage: 'GLOBAL' },
  { id: 4, name: 'GOES-16', status: 'STANDBY', signal: 45, coverage: 'NA' },
];

const SURVEILLANCE_ZONES = [
  { id: 1, name: 'Berlin Central', lat: 52.52, lng: 13.405, threat: 'LOW', activity: 34 },
  { id: 2, name: 'Munich District', lat: 48.1351, lng: 11.582, threat: 'MEDIUM', activity: 67 },
  { id: 3, name: 'Hamburg Port', lat: 53.545, lng: 10.0, threat: 'HIGH', activity: 89 },
  { id: 4, name: 'Frankfurt Hub', lat: 50.1109, lng: 8.6821, threat: 'CRITICAL', activity: 156 },
  { id: 5, name: 'Cologne Station', lat: 50.9365, lng: 6.9589, threat: 'MEDIUM', activity: 45 },
];

const DATA_STREAMS = [
  { id: 1, name: 'SIGINT Feed', bandwidth: 2.5, status: 'ACTIVE', packets: 1245000 },
  { id: 2, name: 'IMINT Stream', bandwidth: 5.8, status: 'ACTIVE', packets: 3456000 },
  { id: 3, name: 'COMINT Channel', bandwidth: 1.2, status: 'ACTIVE', packets: 567000 },
  { id: 4, name: 'ELINT Monitor', bandwidth: 0.8, status: 'IDLE', packets: 0 },
];

export default function SatelliteAccess() {
  const [selectedSatellite, setSelectedSatellite] = useState(SATELLITES[0]);
  const [zones, setZones] = useState(SURVEILLANCE_ZONES);
  const [dataStreams, setDataStreams] = useState(DATA_STREAMS);
  const [totalBandwidth, setTotalBandwidth] = useState(0);
  const [recordingActive, setRecordingActive] = useState(false);

  useEffect(() => {
    const total = dataStreams.reduce((sum, stream) => sum + stream.bandwidth, 0);
    setTotalBandwidth(total);

    // Simulate real-time data updates
    const interval = setInterval(() => {
      setDataStreams(prev => prev.map(stream => ({
        ...stream,
        packets: stream.status === 'ACTIVE' ? stream.packets + Math.floor(Math.random() * 10000) : stream.packets,
      })));

      setZones(prev => prev.map(zone => ({
        ...zone,
        activity: Math.max(0, zone.activity + Math.floor((Math.random() - 0.5) * 20)),
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, [dataStreams]);

  const getThreatColor = (threat) => {
    const colors = {
      'LOW': '#4caf50',
      'MEDIUM': '#ffeb3b',
      'HIGH': '#ff9800',
      'CRITICAL': '#ff1744',
    };
    return colors[threat] || '#b0b0b0';
  };

  const handleZoneClick = (zone) => {
    console.log('Zone selected:', zone);
  };

  const handleRecording = () => {
    setRecordingActive(!recordingActive);
  };

  return (
    <div className="satellite-access">
      <div className="sat-header">
        <h2>SATELLITE ACCESS CONTROL</h2>
        <div className="sat-status">
          <span className={`recording-indicator ${recordingActive ? 'recording' : ''}`}></span>
          <span>{recordingActive ? 'RECORDING ACTIVE' : 'STANDBY'}</span>
        </div>
      </div>

      <div className="sat-container">
        {/* Satellite Selection */}
        <div className="satellites-panel">
          <h3>ACTIVE SATELLITES</h3>
          <div className="satellites-list">
            {SATELLITES.map(sat => (
              <div
                key={sat.id}
                className={`satellite-item ${selectedSatellite.id === sat.id ? 'active' : ''}`}
                onClick={() => setSelectedSatellite(sat)}
              >
                <div className="sat-name">{sat.name}</div>
                <div className="sat-info">
                  <span className={`sat-status ${sat.status.toLowerCase()}`}>{sat.status}</span>
                  <span className="sat-signal">Signal: {sat.signal}%</span>
                </div>
                <div className="sat-coverage">{sat.coverage}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Map View */}
        <div className="map-panel">
          <h3>SURVEILLANCE ZONES</h3>
          <div className="map-container">
            <div className="map-grid">
              {zones.map(zone => (
                <div
                  key={zone.id}
                  className="zone-marker"
                  style={{
                    left: `${(zone.lng + 15) * 3}%`,
                    top: `${(55 - zone.lat) * 2}%`,
                    borderColor: getThreatColor(zone.threat),
                  }}
                  onClick={() => handleZoneClick(zone)}
                  title={zone.name}
                >
                  <div className="zone-pulse" style={{ borderColor: getThreatColor(zone.threat) }}></div>
                  <div className="zone-label">{zone.name}</div>
                  <div className="zone-activity">Activity: {zone.activity}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Streams */}
        <div className="streams-panel">
          <h3>DATA STREAMS</h3>
          <div className="streams-info">
            <div className="bandwidth-total">
              Total Bandwidth: <strong>{totalBandwidth.toFixed(1)} Mbps</strong>
            </div>
          </div>
          <div className="streams-list">
            {dataStreams.map(stream => (
              <div key={stream.id} className="stream-item">
                <div className="stream-header">
                  <span className="stream-name">{stream.name}</span>
                  <span className={`stream-status ${stream.status.toLowerCase()}`}>{stream.status}</span>
                </div>
                <div className="stream-bar">
                  <div className="stream-fill" style={{ width: `${(stream.bandwidth / 10) * 100}%` }}></div>
                </div>
                <div className="stream-info">
                  <span>{stream.bandwidth.toFixed(1)} Mbps</span>
                  <span>{(stream.packets / 1000000).toFixed(1)}M packets</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Zone View */}
      <div className="zones-detail">
        <h3>ZONE DETAILS</h3>
        <div className="zones-table">
          <table>
            <thead>
              <tr>
                <th>ZONE NAME</th>
                <th>COORDINATES</th>
                <th>THREAT LEVEL</th>
                <th>ACTIVITY</th>
                <th>SATELLITE</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(zone => (
                <tr key={zone.id}>
                  <td>{zone.name}</td>
                  <td>{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</td>
                  <td>
                    <span className="threat-badge" style={{ color: getThreatColor(zone.threat) }}>
                      {zone.threat}
                    </span>
                  </td>
                  <td>{zone.activity}</td>
                  <td>{selectedSatellite.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Control Panel */}
      <div className="sat-controls">
        <button className="control-btn record-btn" onClick={handleRecording}>
          {recordingActive ? '⏹ STOP RECORDING' : '● START RECORDING'}
        </button>
        <button className="control-btn export-btn">📥 EXPORT DATA</button>
        <button className="control-btn alert-btn">⚠ SET ALERT ZONES</button>
        <button className="control-btn calibrate-btn">🔧 CALIBRATE SENSORS</button>
      </div>
    </div>
  );
}
