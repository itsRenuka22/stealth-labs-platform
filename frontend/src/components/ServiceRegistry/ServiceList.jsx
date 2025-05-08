/**
 * Service Registry — List View
 * Implements SLS-30: Service registry UI list view
 *
 * Author: Priya Nair
 * Sprint: 1
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchFilter } from './SearchFilter';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  deprecated: 'bg-red-100 text-red-800',
};

const LANGUAGE_ICONS = {
  python: '🐍',
  javascript: '🟨',
  typescript: '🔷',
  go: '🐹',
  java: '☕',
};

export function ServiceList() {
  const [services, setServices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load services');
        setLoading(false);
      });
  }, []);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortBy] ?? '';
    const valB = b[sortBy] ?? '';
    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading services...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Service Registry</h1>
        <span className="text-sm text-gray-500">{services.length} services registered</span>
      </div>

      <SearchFilter services={services} onFilter={setFiltered} />

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['name', 'owner_team', 'language', 'environment', 'status'].map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                >
                  {col.replace('_', ' ')}
                  {sortBy === col && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map(service => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    to={`/services/${service.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {service.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{service.owner_team}</td>
                <td className="px-4 py-3 text-gray-600">
                  {LANGUAGE_ICONS[service.language] ?? ''} {service.language}
                </td>
                <td className="px-4 py-3 text-gray-600">{service.environment}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[service.status] ?? STATUS_COLORS.active}`}>
                    {service.status ?? 'active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * ServiceList — displays all registered services in a sortable table.
 * Columns: name, owner team, language, environment, status.
 */

function SortIcon({ direction }) {
  return <span>{direction === 'asc' ? '▲' : '▼'}</span>;
}
