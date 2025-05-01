/**
 * Search and Filter Component
 * Implements SLS-32: Search and filter for service list
 *
 * Author: James Okwu
 * Sprint: 1
 *
 * Note: The multi-select state management took longer than expected.
 * Had to rewrite the filter logic twice to handle edge cases
 * (empty filter should show all, not nothing).
 */
import { useState, useEffect } from 'react';

export function SearchFilter({ services, onFilter }) {
  // Track what the user has typed in the search box
  const [searchText, setSearchText] = useState('');

  // Track which team is selected in the dropdown
  // Empty string means "show all teams"
  const [selectedTeam, setSelectedTeam] = useState('');

  // Track which language is selected
  const [selectedLanguage, setSelectedLanguage] = useState('');

  // Build the unique list of teams from all services
  // Using Set to remove duplicates, then sort alphabetically
  const allTeams = [...new Set(services.map(s => s.owner_team))].sort();

  // Build the unique list of languages
  const allLanguages = [...new Set(services.map(s => s.language))].sort();

  // Run the filter whenever search text or dropdowns change
  useEffect(() => {
    let results = services;

    // Apply text search — check if name includes the search text
    // Case-insensitive comparison
    if (searchText.trim() !== '') {
      results = results.filter(service =>
        service.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply team filter — only filter if a team is actually selected
    if (selectedTeam !== '') {
      results = results.filter(service => service.owner_team === selectedTeam);
    }

    // Apply language filter
    if (selectedLanguage !== '') {
      results = results.filter(service => service.language === selectedLanguage);
    }

    // Pass the filtered results back up to the parent component
    onFilter(results);
  }, [searchText, selectedTeam, selectedLanguage, services]);

  // Reset all filters back to defaults
  const handleClearFilters = () => {
    setSearchText('');
    setSelectedTeam('');
    setSelectedLanguage('');
  };

  // Check if any filter is active so we can show/hide the clear button
  const hasActiveFilters = searchText !== '' || selectedTeam !== '' || selectedLanguage !== '';

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Text search input */}
      <input
        type="text"
        placeholder="Search by service name..."
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
      />

      {/* Team filter dropdown */}
      <select
        value={selectedTeam}
        onChange={e => setSelectedTeam(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All teams</option>
        {allTeams.map(team => (
          <option key={team} value={team}>{team}</option>
        ))}
      </select>

      {/* Language filter dropdown */}
      <select
        value={selectedLanguage}
        onChange={e => setSelectedLanguage(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All languages</option>
        {allLanguages.map(lang => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>

      {/* Show clear button only when filters are active */}
      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

const PLACEHOLDER_TEXT = 'Search services by name...';
