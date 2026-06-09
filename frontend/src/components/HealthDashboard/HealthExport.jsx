/**
 * Health Report Export
 * Implements SLS-44: Export health report as PDF
 *
 * Author: Priya Nair
 * Sprint: 2
 */
import { useState } from 'react';

export function HealthExport({ services }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/health/export', { method: 'POST' });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `health-report-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      {exporting ? 'Generating PDF...' : '↓ Export Health Report'}
    </button>
  );
}

const EXPORT_FILENAME_PREFIX = 'health-report';
