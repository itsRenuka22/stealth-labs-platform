/**
 * Service Registry — Detail Page
 * Implements SLS-31: Service registry UI detail page
 *
 * Author: Priya Nair
 * Sprint: 1
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TagManager } from './TagManager';

export function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services/${id}`)
      .then(res => res.json())
      .then(data => {
        setService(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!service) return <div className="p-8 text-center text-red-500">Service not found.</div>;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/services" className="hover:text-blue-600">Services</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{service.name}</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{service.name}</h1>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Details</h2>
          <dl className="space-y-2">
            {[
              ['Owner Team', service.owner_team],
              ['Language', service.language],
              ['Environment', service.environment],
              ['Status', service.status ?? 'active'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Repository</h2>
          <a
            href={service.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 break-all"
          >
            {service.repo_url}
          </a>
          {service.description && (
            <p className="mt-3 text-sm text-gray-600">{service.description}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Tags</h2>
        <TagManager serviceId={service.id} initialTags={service.tags} />
      </div>
    </div>
  );
}

/**
 * ServiceDetail — single service view with metadata, owner, repo link.
 */

function DetailRow({ label, value }) {
  return (
  <div className="flex justify-between py-2">
    <span className="font-medium">{label}</span>
    <span>{value}</span>
  </div>
  );
}

const TAG_COLORS = {
  production: 'bg-green-100 text-green-800',
  staging: 'bg-yellow-100 text-yellow-800',
  development: 'bg-blue-100 text-blue-800',
};
