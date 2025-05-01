/**
 * Health Dashboard — Status Grid
 * Implements SLS-38: Real-time health status UI
 *
 * Author: Priya Nair
 * Sprint: 2
 *
 * Note: Tuesday + Wednesday were both fully blocked this sprint.
 * Component done Monday then resumed Thursday. Polling interval is 30s.
 */
import { useState, useEffect, useCallback } from 'react';

const STATUS_CONFIG = {
  healthy: { color: 'bg-green-500', label: 'Healthy', ring: 'ring-green-200' },
  degraded: { color: 'bg-yellow-500', label: 'Degraded', ring: 'ring-yellow-200' },
  down: { color: 'bg-red-500', label: 'Down', ring: 'ring-red-200' },
  unknown: { color: 'bg-gray-400', label: 'Unknown', ring: 'ring-gray-200' },
};

function ServiceCard({ service, health }) {
  const status = health?.status ?? 'unknown';
  const config = STATUS_CONFIG[status];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ring-2 ${config.ring}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900 truncate">{service.name}</h3>
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
          <span className="text-xs text-gray-500">{config.label}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3">{service.owner_team}</p>
      <div className="flex justify-between text-xs text-gray-400">
        <span>
          {health?.latency_ms != null ? `${health.latency_ms}ms` : '—'}
        </span>
        <span>
          {health?.checked_at
            ? new Date(health.checked_at).toLocaleTimeString()
            : 'Never checked'}
        </span>
      </div>
    </div>
  );
}

export function HealthStatus() {
  const [services, setServices] = useState([]);
  const [healthData, setHealthData] = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchHealthData = useCallback(async (serviceList) => {
    const results = await Promise.allSettled(
      serviceList.map(s =>
        fetch(`/api/health/status/${s.id}`).then(r => r.ok ? r.json() : null)
      )
    );
    const updated = {};
    serviceList.forEach((s, i) => {
      if (results[i].status === 'fulfilled' && results[i].value) {
        updated[s.id] = results[i].value;
      }
    });
    setHealthData(updated);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(data => {
        setServices(data);
        fetchHealthData(data);
      });
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    if (services.length === 0) return;
    const interval = setInterval(() => fetchHealthData(services), 30_000);
    return () => clearInterval(interval);
  }, [services, fetchHealthData]);

  const statusCounts = Object.values(healthData).reduce((acc, h) => {
    acc[h.status] = (acc[h.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Health Dashboard</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {lastRefresh && <span>Updated {lastRefresh.toLocaleTimeString()}</span>}
          <span className="text-green-600">{statusCounts.healthy ?? 0} healthy</span>
          <span className="text-yellow-600">{statusCounts.degraded ?? 0} degraded</span>
          <span className="text-red-600">{statusCounts.down ?? 0} down</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            health={healthData[service.id]}
          />
        ))}
      </div>
    </div>
  );
}
