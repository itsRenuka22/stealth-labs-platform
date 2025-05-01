/**
 * Deployment Status Dashboard
 * Implements SLS-48: Deployment status UI
 *
 * Author: Priya Nair
 * Sprint: 3 — IN PROGRESS
 *
 * Current state: Basic layout and status table done (Monday work).
 * Tuesday + Wednesday blocked by sprint kickoff, product syncs,
 * and design review. Resuming Thursday.
 * Still needed: trigger button wiring, polling for live updates.
 */
import { useState, useEffect } from 'react';

const STATUS_BADGES = {
  deployed:  'bg-green-100 text-green-800',
  deploying: 'bg-blue-100 text-blue-800 animate-pulse',
  failed:    'bg-red-100 text-red-800',
  queued:    'bg-yellow-100 text-yellow-800',
};

export function DeploymentStatus() {
  const [services, setServices] = useState([]);
  const [deployments, setDeployments] = useState({});

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(data => setServices(data));
  }, []);

  // TODO: fetch deployment status per service — wiring in progress
  // Will use GET /deployments/{serviceId} once SLS-47 is merged

  const handleTrigger = async (serviceId) => {
    // Trigger deployment button — not yet implemented
    // Waiting on SLS-47 (deployment trigger API) to merge first
    console.log('Trigger deployment for service', serviceId);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Deployment Manager</h1>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Service</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Version</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Last Deploy</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.map(service => {
              const deployment = deployments[service.id];
              return (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{service.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[deployment?.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {deployment?.status ?? 'never deployed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {deployment?.image_tag ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {deployment?.completed_at
                      ? new Date(deployment.completed_at).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleTrigger(service.id)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Deploy
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
