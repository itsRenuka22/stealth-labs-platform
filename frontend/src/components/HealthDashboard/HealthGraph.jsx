/**
 * Health History Graph
 * Implements SLS-39: Health history graph component
 *
 * Author: James Okwu
 * Sprint: 2
 */
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function FailureDot(props) {
  const { cx, cy, payload } = props;
  if (payload.status !== 'down') return null;
  return <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="white" strokeWidth={2} />;
}

export function HealthGraph({ serviceId, threshold }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`/api/health/history/${serviceId}`)
      .then(r => r.json())
      .then(data => {
        setHistory(data.map(h => ({
          time: new Date(h.checked_at).toLocaleTimeString(),
          latency: h.latency_ms,
          status: h.status,
        })));
      });
  }, [serviceId]);

  if (history.length === 0) {
    return <div className="text-sm text-gray-400 text-center py-8">No health data yet</div>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} unit="ms" width={50} />
          <Tooltip formatter={(v) => [`${v}ms`, 'Latency']} />
          {threshold && (
            <ReferenceLine y={threshold} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Threshold', fontSize: 11 }} />
          )}
          <Line
            type="monotone"
            dataKey="latency"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={<FailureDot />}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
