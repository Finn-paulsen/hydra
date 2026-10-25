import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './ReactorControl.css';

/**
 * ReactorControl Component
 * Innere Schicht - HIVE-MIND Reaktor-Steuerung
 * Echtzeit-Monitoring von Systemressourcen, Prozessen und Systemlast
 */

export default function ReactorControl() {
  const [systemMetrics, setSystemMetrics] = useState({
    cpuLoad: 42,
    memoryUsage: 67,
    diskUsage: 54,
    networkTraffic: 38,
    processCount: 247,
    systemTemp: 58,
    uptime: '23d 14h 32m',
  });

  const [processes, setProcesses] = useState([
    { id: 1, name: 'HIVE-MIND.exe', cpu: 12.5, memory: 234, status: 'RUNNING' },
    { id: 2, name: 'SURVEILLANCE.sys', cpu: 8.3, memory: 156, status: 'RUNNING' },
    { id: 3, name: 'ARCHIVE.service', cpu: 5.1, memory: 98, status: 'RUNNING' },
    { id: 4, name: 'NETWORK.daemon', cpu: 3.2, memory: 67, status: 'RUNNING' },
    { id: 5, name: 'ENCRYPTION.worker', cpu: 2.8, memory: 45, status: 'IDLE' },
  ]);

  const [alerts, setAlerts] = useState([
    { id: 1, level: 'WARNING', message: 'CPU Load approaching threshold', time: '14:32:15' },
    { id: 2, level: 'INFO', message: 'Memory optimization completed', time: '14:31:42' },
    { id: 3, level: 'CRITICAL', message: 'Disk space critically low on /archive', time: '14:30:18' },
  ]);

  const [overloadMode, setOverloadMode] = useState(false);

  // Simuliere Systemmetriken-Updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        cpuLoad: Math.max(20, Math.min(95, prev.cpuLoad + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(40, Math.min(90, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        networkTraffic: Math.max(10, Math.min(100, prev.networkTraffic + (Math.random() - 0.5) * 15)),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleOverload = () => {
    setOverloadMode(!overloadMode);
    if (!overloadMode) {
      setSystemMetrics(prev => ({
        ...prev,
        cpuLoad: 95,
        memoryUsage: 88,
        networkTraffic: 92,
      }));
      setAlerts(prev => [
        { id: Date.now(), level: 'CRITICAL', message: 'OVERLOAD MODE ACTIVATED', time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    }
  };

  const handleKillProcess = (id) => {
    setProcesses(prev => prev.filter(p => p.id !== id));
    setAlerts(prev => [
      { id: Date.now(), level: 'INFO', message: `Process terminated: ${processes.find(p => p.id === id)?.name}`, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  const getMetricColor = (value, thresholds = { warning: 70, critical: 85 }) => {
    if (value >= thresholds.critical) return '#ff1744';
    if (value >= thresholds.warning) return '#ff9800';
    return '#4caf50';
  };

  return (
    <div className="reactor-control">
      <div className="reactor-header">
        <h2>HIVE-MIND REAKTOR-STEUERUNG</h2>
        <div className="reactor-status">
          <span className={`status-indicator ${overloadMode ? 'critical' : 'normal'}`}></span>
          <span>{overloadMode ? 'OVERLOAD MODE' : 'NORMAL OPERATION'}</span>
        </div>
      </div>

      {/* Hauptmetriken */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">CPU LOAD</div>
          <div className="metric-gauge">
            <CircularProgressbar
              value={systemMetrics.cpuLoad}
              text={`${Math.round(systemMetrics.cpuLoad)}%`}
              styles={buildStyles({
                rotation: 0.25,
                strokeLinecap: 'round',
                textSize: '16px',
                pathTransitionDuration: 0.5,
                pathColor: getMetricColor(systemMetrics.cpuLoad),
                textColor: getMetricColor(systemMetrics.cpuLoad),
                trailColor: '#2a2a2a',
                backgroundColor: '#1a1a1a',
              })}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">MEMORY</div>
          <div className="metric-gauge">
            <CircularProgressbar
              value={systemMetrics.memoryUsage}
              text={`${Math.round(systemMetrics.memoryUsage)}%`}
              styles={buildStyles({
                rotation: 0.25,
                strokeLinecap: 'round',
                textSize: '16px',
                pathTransitionDuration: 0.5,
                pathColor: getMetricColor(systemMetrics.memoryUsage),
                textColor: getMetricColor(systemMetrics.memoryUsage),
                trailColor: '#2a2a2a',
                backgroundColor: '#1a1a1a',
              })}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">DISK USAGE</div>
          <div className="metric-gauge">
            <CircularProgressbar
              value={systemMetrics.diskUsage}
              text={`${Math.round(systemMetrics.diskUsage)}%`}
              styles={buildStyles({
                rotation: 0.25,
                strokeLinecap: 'round',
                textSize: '16px',
                pathTransitionDuration: 0.5,
                pathColor: getMetricColor(systemMetrics.diskUsage),
                textColor: getMetricColor(systemMetrics.diskUsage),
                trailColor: '#2a2a2a',
                backgroundColor: '#1a1a1a',
              })}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">NETWORK</div>
          <div className="metric-gauge">
            <CircularProgressbar
              value={systemMetrics.networkTraffic}
              text={`${Math.round(systemMetrics.networkTraffic)}%`}
              styles={buildStyles({
                rotation: 0.25,
                strokeLinecap: 'round',
                textSize: '16px',
                pathTransitionDuration: 0.5,
                pathColor: getMetricColor(systemMetrics.networkTraffic),
                textColor: getMetricColor(systemMetrics.networkTraffic),
                trailColor: '#2a2a2a',
                backgroundColor: '#1a1a1a',
              })}
            />
          </div>
        </div>
      </div>

      {/* Systeminfo */}
      <div className="system-info">
        <div className="info-row">
          <span className="info-label">SYSTEM TEMPERATURE:</span>
          <span className="info-value">{systemMetrics.systemTemp}°C</span>
        </div>
        <div className="info-row">
          <span className="info-label">ACTIVE PROCESSES:</span>
          <span className="info-value">{systemMetrics.processCount}</span>
        </div>
        <div className="info-row">
          <span className="info-label">UPTIME:</span>
          <span className="info-value">{systemMetrics.uptime}</span>
        </div>
      </div>

      {/* Prozessliste */}
      <div className="processes-section">
        <h3>ACTIVE PROCESSES</h3>
        <div className="process-list">
          {processes.map(proc => (
            <div key={proc.id} className="process-item">
              <div className="process-info">
                <span className="process-name">{proc.name}</span>
                <span className={`process-status ${proc.status.toLowerCase()}`}>{proc.status}</span>
              </div>
              <div className="process-metrics">
                <span>CPU: {proc.cpu.toFixed(1)}%</span>
                <span>MEM: {proc.memory}MB</span>
              </div>
              <button className="kill-btn" onClick={() => handleKillProcess(proc.id)}>KILL</button>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="alerts-section">
        <h3>SYSTEM ALERTS</h3>
        <div className="alerts-list">
          {alerts.slice(0, 5).map(alert => (
            <div key={alert.id} className={`alert-item alert-${alert.level.toLowerCase()}`}>
              <span className="alert-time">[{alert.time}]</span>
              <span className="alert-level">{alert.level}</span>
              <span className="alert-message">{alert.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kontrollpanel */}
      <div className="control-panel">
        <button 
          className={`control-btn overload-btn ${overloadMode ? 'active' : ''}`}
          onClick={handleOverload}
        >
          {overloadMode ? '⚠ OVERLOAD MODE: ON' : '⚠ OVERLOAD MODE: OFF'}
        </button>
        <button className="control-btn restart-btn">RESTART REACTOR</button>
        <button className="control-btn emergency-btn">EMERGENCY SHUTDOWN</button>
      </div>
    </div>
  );
}
