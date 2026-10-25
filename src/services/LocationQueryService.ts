/**
 * Location Query Service
 * Ermöglicht geografische Abfragen auf der Polizei-Datenbank
 */

// Mock Datenbank mit geografischen Daten
const MOCK_DATABASE = {
  cases: [
    {
      id: '4711',
      title: '[GEHEIM] Operation Merkur',
      location: { lat: 52.5200, lng: 13.4050, name: 'Berlin' },
      status: 'active',
      priority: 'high',
      persons: 3,
      createdAt: '2026-01-15'
    },
    {
      id: '4712',
      title: '[VS-NfD] Cyberkriminalität Ring',
      location: { lat: 52.5200, lng: 13.4050, name: 'Berlin' },
      status: 'active',
      priority: 'critical',
      persons: 7,
      createdAt: '2026-02-01'
    },
    {
      id: '4713',
      title: 'Drogenhandel Nord',
      location: { lat: 52.5200, lng: 13.4050, name: 'Berlin' },
      status: 'inactive',
      priority: 'medium',
      persons: 2,
      createdAt: '2025-12-20'
    },
    {
      id: '5001',
      title: '[STRENG GEHEIM] Finanzermittlungen',
      location: { lat: 48.1351, lng: 11.5820, name: 'München' },
      status: 'active',
      priority: 'critical',
      persons: 5,
      createdAt: '2026-01-30'
    },
    {
      id: '5002',
      title: 'Organisierte Kriminalität',
      location: { lat: 48.1351, lng: 11.5820, name: 'München' },
      status: 'active',
      priority: 'high',
      persons: 12,
      createdAt: '2025-11-10'
    },
    {
      id: '6001',
      title: 'Kunstdiebstahl Ermittlung',
      location: { lat: 50.9365, lng: 6.9589, name: 'Köln' },
      status: 'closed',
      priority: 'medium',
      persons: 1,
      createdAt: '2025-10-05'
    },
    {
      id: '7001',
      title: '[VS-NfD] Hafenermittlungen',
      location: { lat: 53.5511, lng: 9.9937, name: 'Hamburg' },
      status: 'active',
      priority: 'high',
      persons: 8,
      createdAt: '2026-01-22'
    },
    {
      id: '7002',
      title: 'Schmugglerring Dekryptierung',
      location: { lat: 53.5511, lng: 9.9937, name: 'Hamburg' },
      status: 'active',
      priority: 'high',
      persons: 6,
      createdAt: '2026-02-10'
    },
    {
      id: '7003',
      title: 'Betrug im Hafen',
      location: { lat: 53.5511, lng: 9.9937, name: 'Hamburg' },
      status: 'active',
      priority: 'low',
      persons: 2,
      createdAt: '2026-02-15'
    },
    {
      id: '8001',
      title: '[STRENG GEHEIM] Botnet-Netzwerk',
      location: { lat: 50.1109, lng: 8.6821, name: 'Frankfurt' },
      status: 'active',
      priority: 'critical',
      persons: 15,
      createdAt: '2025-09-01'
    },
    {
      id: '8002',
      title: 'Ransomware-Syndikate',
      location: { lat: 50.1109, lng: 8.6821, name: 'Frankfurt' },
      status: 'active',
      priority: 'critical',
      persons: 9,
      createdAt: '2026-01-05'
    },
    {
      id: '8003',
      title: 'Darknet-Marktplatz Analyse',
      location: { lat: 50.1109, lng: 8.6821, name: 'Frankfurt' },
      status: 'active',
      priority: 'high',
      persons: 20,
      createdAt: '2025-08-15'
    },
    {
      id: '8004',
      title: 'Zero-Day Exploit Market',
      location: { lat: 50.1109, lng: 8.6821, name: 'Frankfurt' },
      status: 'active',
      priority: 'critical',
      persons: 11,
      createdAt: '2026-02-01'
    }
  ],
  persons: [
    { id: 'p001', name: 'Unbekannt', caseId: '4711', location: 'Berlin', status: 'wanted' },
    { id: 'p002', name: 'Unbekannt', caseId: '4712', location: 'Berlin', status: 'wanted' },
    { id: 'p003', name: 'Unbekannt', caseId: '5001', location: 'München', status: 'wanted' },
    { id: 'p004', name: 'Unbekannt', caseId: '7001', location: 'Hamburg', status: 'wanted' },
    // ... weitere Personen
  ]
};

/**
 * Query-Klasse für Location-basierte Abfragen
 */
export class LocationQueryService {
  /**
   * Findet alle Fälle in einer geografischen Region
   * @param {number} lat - Breitengerad
   * @param {number} lng - Längenggrad
   * @param {number} radiusKm - Suchradius in Kilometern
   */
  static findCasesByLocation(lat, lng, radiusKm = 50) {
    return MOCK_DATABASE.cases.filter(caseData => {
      const distance = this._calculateDistance(
        lat, lng,
        caseData.location.lat, caseData.location.lng
      );
      return distance <= radiusKm;
    });
  }

  /**
   * Findet Fälle nach Behörde
   */
  static findCasesByPoliceStation(locationName) {
    return MOCK_DATABASE.cases.filter(caseData => 
      caseData.location.name === locationName
    );
  }

  /**
   * Suche nach aktiven Fällen in einer Region
   */
  static findActiveCases(lat, lng, radiusKm = 100) {
    return this.findCasesByLocation(lat, lng, radiusKm)
      .filter(caseData => caseData.status === 'active')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  /**
   * Findet kritische/hochpriorite Fälle
   */
  static findCriticalCases(lat, lng, radiusKm = 200) {
    return this.findCasesByLocation(lat, lng, radiusKm)
      .filter(caseData => 
        caseData.priority === 'critical' || caseData.priority === 'high'
      )
      .sort((a, b) => b.persons - a.persons);
  }

  /**
   * Gibt statistiken für eine Region
   */
  static getRegionStats(lat, lng, radiusKm = 100) {
    const cases = this.findCasesByLocation(lat, lng, radiusKm);
    
    return {
      totalCases: cases.length,
      activeCases: cases.filter(c => c.status === 'active').length,
      closedCases: cases.filter(c => c.status === 'closed').length,
      inactiveCases: cases.filter(c => c.status === 'inactive').length,
      totalPersons: cases.reduce((sum, c) => sum + c.persons, 0),
      criticalCases: cases.filter(c => c.priority === 'critical').length,
      casificationLevel: this._calculateClassificationLevel(cases),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Korreliert Fälle zwischen verschiedenen Regionen
   */
  static correlateRegionalCases(location1, location2, radiusKm = 100) {
    const cases1 = this.findCasesByLocation(location1.lat, location1.lng, radiusKm);
    const cases2 = this.findCasesByLocation(location2.lat, location2.lng, radiusKm);
    
    // Suche nach Überschneidungen (z.B. gleiche Personen, ähnliche Muster)
    const correlations = [];
    cases1.forEach(c1 => {
      cases2.forEach(c2 => {
        // Mock: Wenn Personen-Count ähnlich - könnte Zusammenhang sein
        if (Math.abs(c1.persons - c2.persons) <= 3) {
          correlations.push({
            case1: c1.id,
            case2: c2.id,
            similarity: 0.7,
            reason: 'Ähnliche Struktur/Personenanzahl'
          });
        }
      });
    });
    
    return {
      correlationCount: correlations.length,
      correlations: correlations,
      confidence: correlations.length > 0 ? 0.65 : 0
    };
  }

  /**
   * Exportiert Abfrageergebnis
   */
  static exportQueryResult(caseList) {
    return {
      queriedAt: new Date().toISOString(),
      resultCount: caseList.length,
      cases: caseList.map(c => ({
        id: c.id,
        title: c.title,
        location: c.location.name,
        status: c.status,
        priority: c.priority,
        persons: c.persons,
        created: c.createdAt
      })),
      classification: '[VS-NfD]'
    };
  }

  /**
   * Hilfsfunktion: Berechnet Entfernung zwischen zwei Geopunkten (Haversine)
   */
  static _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Erdradius in Kilometern
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Bestimmt die Klassifikationsstufe basierend auf Fallanzahl/typ
   */
  static _calculateClassificationLevel(cases) {
    const criticalCount = cases.filter(c => c.priority === 'critical').length;
    if (criticalCount >= 3) return '[STRENG GEHEIM]';
    if (criticalCount >= 1 || cases.length >= 5) return '[GEHEIM]';
    return '[VS-NfD]';
  }
}

export default LocationQueryService;
