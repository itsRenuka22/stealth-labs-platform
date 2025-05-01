/**
 * Alerting Threshold Configuration
 * Implements SLS-41: Alerting threshold configuration
 *
 * Author: James Okwu
 * Sprint: 2
 */
import { useState } from 'react';

export function AlertingConfig({ serviceId, currentThreshold, onSave }) {
  const [maxLatency, setMaxLatency] = useState(
    currentThreshold?.max_latency_ms ?? 2000
  );
  const [minUptime, setMinUptime] = useState(
    currentThreshold?.min_uptime_percent ?? 99.0
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/health/threshold/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          max_latency_ms: maxLatency,
          min_uptime_percent: minUptime,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onSave?.(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Max Latency (ms)
        </label>
        <input
          type="number"
          min={0}
          value={maxLatency}
          onChange={e => setMaxLatency(Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-36"
        />
        <p className="text-xs text-gray-400 mt-1">
          Service marked "degraded" if response exceeds this value
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Min Uptime (%)
        </label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={minUptime}
          onChange={e => setMinUptime(Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-36"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save thresholds'}
      </button>
    </div>
  );
}
