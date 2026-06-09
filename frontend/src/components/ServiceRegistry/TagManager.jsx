/**
 * Tag Manager Component
 * Implements SLS-33: Service tagging and metadata
 *
 * Author: James Okwu
 * Sprint: 1
 */
import { useState } from 'react';

export function TagManager({ serviceId, initialTags = [] }) {
  const [tags, setTags] = useState(initialTags);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const addTag = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    const tag = { key: newKey.trim(), value: newValue.trim() };
    const updated = [...tags, tag];
    setSaving(true);
    try {
      await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updated }),
      });
      setTags(updated);
      setNewKey('');
      setNewValue('');
    } finally {
      setSaving(false);
    }
  };

  const removeTag = async (index) => {
    const updated = tags.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updated }),
      });
      setTags(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
          >
            <span className="font-medium">{tag.key}:</span>
            <span>{tag.value}</span>
            <button
              onClick={() => removeTag(i)}
              className="ml-1 text-blue-400 hover:text-blue-700"
              disabled={saving}
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-sm text-gray-400">No tags yet</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Key"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
        />
        <input
          type="text"
          placeholder="Value"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
        />
        <button
          onClick={addTag}
          disabled={saving || !newKey.trim() || !newValue.trim()}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

const MAX_TAG_LENGTH = 64;

function validateTag(key, value) {
  return key.length > 0 && value.length <= MAX_TAG_LENGTH;
}
