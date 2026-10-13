import React, { useState, useEffect, useRef } from 'react';

const BUILDINGS = [
  'Academic Building',
  'Innovation Building',
  'WHU-DUKE Research',
  'Library',
  'Conference Center',
  'Water Pavilion',
  'Admin',
  'Visitor Center',
  'Residence Hall',
  '15A',
  '15B',
  '15C',
  '15D',
  '15E',
  '15F',
  '15G',
  '15H',
  'Graduate Center',
  'Faculty Housing',
  'Service I',
  'Service II',
  'Community Center W',
  'Community Center E',
  'Employee Center North',
  'Employee Center South',
  'Sports Complex',
  'Soccer Field',
  'Tennis Courts',
  'Lake',
  'Campus Square',
];

const FLOORS = ['B2', 'B1', '1F', '2F', '3F', '4F', '5F', '6F', 'Rooftop'];

export default function Admin() {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ building_name: '', floor: '', hint: '' });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editing, setEditing] = useState(null); // { id, building_name, floor, hint }
  const fileRef = useRef();

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rounds');
      const data = await res.json();
      setRounds(Array.isArray(data) ? data : []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load rounds.' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchRounds(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) { setMessage({ type: 'error', text: 'Please select an image.' }); return; }
    if (!form.building_name) { setMessage({ type: 'error', text: 'Select a building.' }); return; }
    if (!form.floor) { setMessage({ type: 'error', text: 'Select a floor.' }); return; }

    setSubmitting(true);
    setMessage(null);

    const fd = new FormData();
    fd.append('image', imageFile);
    fd.append('building_name', form.building_name);
    fd.append('floor', form.floor);
    if (form.hint) fd.append('hint', form.hint);

    try {
      const res = await fetch('/api/admin/rounds', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setMessage({ type: 'success', text: `Added round: ${data.building_name} / ${data.floor}` });
      setForm({ building_name: '', floor: '', hint: '' });
      setImageFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchRounds();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setSubmitting(false);
  };

  const handleSaveEdit = async () => {
    if (!editing.building_name || !editing.floor) {
      setMessage({ type: 'error', text: 'Select a building and floor.' });
      return;
    }
    try {
      const res = await fetch(`/api/admin/rounds/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ building_name: editing.building_name, floor: editing.floor, hint: editing.hint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMessage({ type: 'success', text: `Updated round ${data.id}: ${data.building_name} / ${data.floor}` });
      setEditing(null);
      fetchRounds();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/rounds/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setMessage({ type: 'success', text: 'Round deleted.' });
      setDeleteConfirm(null);
      fetchRounds();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-dku-blue text-white px-4 py-4 flex items-center justify-between shadow">
        <div>
          <h1 className="text-xl font-bold">DKU GeoGuesser — Admin</h1>
          <p className="text-blue-200 text-sm">{rounds.length} round{rounds.length !== 1 ? 's' : ''} in database</p>
        </div>
        <a href="/" className="text-blue-200 hover:text-white text-sm underline-offset-2 hover:underline">
          ← Play Game
        </a>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-2">
        {/* Add Round Form */}
        <div className="card">
          <h2 className="text-lg font-bold text-dku-blue mb-4">Add New Round</h2>

          {message && (
            <div className={`p-3 rounded-lg text-sm mb-4 ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Photo *</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-dku-blue file:text-white file:text-sm file:font-semibold hover:file:bg-dku-blue-light cursor-pointer"
              />
              {preview && (
                <div className="mt-2 relative">
                  <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => { setPreview(null); setImageFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >✕</button>
                </div>
              )}
            </div>

            {/* Building */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Building *</label>
              <select
                value={form.building_name}
                onChange={(e) => setForm((f) => ({ ...f, building_name: e.target.value }))}
                className="w-full border-2 border-gray-200 focus:border-dku-blue rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="">Select building…</option>
                {BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Floor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Floor *</label>
              <select
                value={form.floor}
                onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                className="w-full border-2 border-gray-200 focus:border-dku-blue rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="">Select floor…</option>
                {FLOORS.map((fl) => <option key={fl} value={fl}>{fl}</option>)}
              </select>
            </div>

            {/* Hint */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Hint <span className="font-normal text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={form.hint}
                onChange={(e) => setForm((f) => ({ ...f, hint: e.target.value }))}
                placeholder="Helpful clue shown after 10s…"
                className="w-full border-2 border-gray-200 focus:border-dku-blue rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5"
            >
              {submitting ? 'Uploading…' : 'Add Round'}
            </button>
          </form>
        </div>

        {/* Rounds list */}
        <div className="card">
          <h2 className="text-lg font-bold text-dku-blue mb-4">All Rounds</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
          ) : rounds.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No rounds yet. Add one using the form.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {rounds.map((round) => (
                <div key={round.id} className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  {/* Thumbnail */}
                  <img
                    src={round.image_path}
                    alt=""
                    className="w-16 h-12 object-cover rounded-md flex-shrink-0 bg-gray-100"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />

                  {/* Info / edit form */}
                  {editing?.id === round.id ? (
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <select
                        value={editing.building_name}
                        onChange={(e) => setEditing((ed) => ({ ...ed, building_name: e.target.value }))}
                        className="w-full border-2 border-gray-200 focus:border-dku-blue rounded-lg px-2 py-1 text-sm outline-none"
                      >
                        {!BUILDINGS.includes(editing.building_name) && (
                          <option value={editing.building_name}>{editing.building_name || 'Select building…'}</option>
                        )}
                        {BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <select
                        value={editing.floor}
                        onChange={(e) => setEditing((ed) => ({ ...ed, floor: e.target.value }))}
                        className="w-full border-2 border-gray-200 focus:border-dku-blue rounded-lg px-2 py-1 text-sm outline-none"
                      >
                        {!FLOORS.includes(editing.floor) && <option value={editing.floor}>{editing.floor || 'Select floor…'}</option>}
                        {FLOORS.map((fl) => <option key={fl} value={fl}>{fl}</option>)}
                      </select>
                      <input
                        type="text"
                        value={editing.hint}
                        onChange={(e) => setEditing((ed) => ({ ...ed, hint: e.target.value }))}
                        placeholder="Hint (optional)"
                        className="w-full border-2 border-gray-200 focus:border-dku-blue rounded-lg px-2 py-1 text-sm outline-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} className="text-xs bg-dku-blue text-white px-3 py-1 rounded hover:bg-dku-blue-light">Save</button>
                        <button onClick={() => setEditing(null)} className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded hover:bg-gray-300">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 truncate">{round.building_name}</div>
                      <div className="text-xs text-gray-500">Floor: {round.floor}</div>
                      {round.hint && <div className="text-xs text-amber-600 truncate mt-0.5">💡 {round.hint}</div>}
                      <div className="text-xs text-gray-400 mt-0.5">ID: {round.id}</div>
                    </div>
                  )}

                  {/* Edit */}
                  {editing?.id !== round.id && deleteConfirm !== round.id && (
                    <button
                      onClick={() => { setEditing({ id: round.id, building_name: round.building_name, floor: round.floor, hint: round.hint || '' }); setDeleteConfirm(null); }}
                      className="text-gray-400 hover:text-dku-blue flex-shrink-0 self-start text-sm transition-colors"
                      title="Edit building / floor"
                    >✏️</button>
                  )}

                  {/* Delete (hidden while editing) */}
                  {editing?.id === round.id ? null : deleteConfirm === round.id ? (
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleDelete(round.id)}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >Confirm</button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-300"
                      >Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(round.id)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0 self-start text-sm transition-colors"
                      title="Delete round"
                    >🗑</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
