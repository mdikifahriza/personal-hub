'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Plus,
  Pin,
  Archive,
  Trash2,
  Palette,
  Search,
  X,
  ArchiveRestore,
  Edit3,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

const COLORS = [
  { name: 'Default', value: null, bg: 'bg-white', border: 'border-gray-200' },
  { name: 'Red', value: '#f28b82', bg: 'bg-[#f28b82]', border: 'border-[#f28b82]' },
  { name: 'Orange', value: '#fbbc04', bg: 'bg-[#fbbc04]', border: 'border-[#fbbc04]' },
  { name: 'Yellow', value: '#fff475', bg: 'bg-[#fff475]', border: 'border-[#fff475]' },
  { name: 'Green', value: '#ccff90', bg: 'bg-[#ccff90]', border: 'border-[#ccff90]' },
  { name: 'Teal', value: '#a7ffeb', bg: 'bg-[#a7ffeb]', border: 'border-[#a7ffeb]' },
  { name: 'Blue', value: '#cbf0f8', bg: 'bg-[#cbf0f8]', border: 'border-[#cbf0f8]' },
  { name: 'Purple', value: '#d7aefb', bg: 'bg-[#d7aefb]', border: 'border-[#d7aefb]' },
  { name: 'Pink', value: '#fdcfe8', bg: 'bg-[#fdcfe8]', border: 'border-[#fdcfe8]' },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedForm, setExpandedForm] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    color: null as string | null,
  });

  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    loadNotes();
  }, [showArchived, searchQuery]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showArchived) params.append('archived', 'true');
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/notes?${params}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() && !form.content.trim()) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({ title: '', content: '', color: null });
        setExpandedForm(false);
        loadNotes();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (res.ok) {
        loadNotes();
        setViewMode('list');
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Hapus catatan ini?')) return;

    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadNotes();
        setViewMode('list');
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const togglePin = (note: Note) => {
    updateNote(note.id, { is_pinned: !note.is_pinned });
  };

  const toggleArchive = (note: Note) => {
    updateNote(note.id, { is_archived: !note.is_archived });
  };

  const updateColor = (id: string, color: string | null) => {
    updateNote(id, { color });
    setShowColorPicker(null);
  };

  const openViewMode = (note: Note) => {
    setSelectedNote(note);
    setViewMode('view');
  };

  const openEditMode = (note: Note) => {
    setSelectedNote(note);
    setEditForm({
      title: note.title,
      content: note.content,
    });
    setViewMode('edit');
  };

  const saveEdit = () => {
    if (selectedNote) {
      updateNote(selectedNote.id, editForm);
    }
  };

  const closeModal = () => {
    setViewMode('list');
    setSelectedNote(null);
    setEditForm({ title: '', content: '' });
  };

  const truncateContent = (content: string, maxLines: number = 15) => {
    const lines = content.split('\n');
    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join('\n') + '...';
    }
    return content;
  };

  const pinnedNotes = notes.filter((n) => n.is_pinned && !n.is_archived);
  const otherNotes = notes.filter((n) => !n.is_pinned && !n.is_archived);

  const NoteCard = ({ note }: { note: Note }) => {
    const colorData = COLORS.find((c) => c.value === note.color) || COLORS[0];
    const displayContent = truncateContent(note.content, 15);
    const isTruncated = displayContent !== note.content;

    return (
      <div
        className={`rounded-lg border p-4 transition-all hover:shadow-md ${colorData.bg} ${colorData.border}`}
        style={note.color ? { backgroundColor: note.color } : {}}
      >
        <div
          onClick={() => openViewMode(note)}
          className="cursor-pointer mb-3"
        >
          {note.title && (
            <h3 className="font-semibold text-gray-900 mb-2">
              {note.title}
            </h3>
          )}
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {displayContent}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{format(new Date(note.updated_at), 'dd MMM yyyy')}</span>
        </div>

        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => togglePin(note)}
            className={`p-1.5 rounded hover:bg-black/5 transition-colors ${
              note.is_pinned ? 'text-gray-900' : 'text-gray-500'
            }`}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={16} fill={note.is_pinned ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={() =>
              setShowColorPicker(
                showColorPicker === note.id ? null : note.id
              )
            }
            className="p-1.5 rounded hover:bg-black/5 text-gray-500 transition-colors"
            title="Ubah warna"
          >
            <Palette size={16} />
          </button>

          {showColorPicker === note.id && (
            <div className="absolute left-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10 flex gap-1.5">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => updateColor(note.id, color.value)}
                  className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${
                    color.value === note.color
                      ? 'border-gray-900'
                      : 'border-gray-300'
                  }`}
                  style={
                    color.value
                      ? { backgroundColor: color.value }
                      : { backgroundColor: '#fff' }
                  }
                  title={color.name}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => toggleArchive(note)}
            className="p-1.5 rounded hover:bg-black/5 text-gray-500 transition-colors"
            title={note.is_archived ? 'Unarchive' : 'Archive'}
          >
            {note.is_archived ? (
              <ArchiveRestore size={16} />
            ) : (
              <Archive size={16} />
            )}
          </button>

          <button
            onClick={() => deleteNote(note.id)}
            className="p-1.5 rounded hover:bg-black/5 text-red-600 transition-colors ml-auto"
            title="Hapus"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-0">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Notes</h1>
            <p className="text-sm text-gray-600 mt-1">
              Catat Kebutuhan dan Ide Harian Anda
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari catatan..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                showArchived
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {showArchived ? 'Semua Catatan' : 'Arsip'}
            </button>
          </div>

          {/* Quick Add Form */}
          {!showArchived && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {!expandedForm ? (
                <button
                  onClick={() => setExpandedForm(true)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Buat catatan...
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Judul"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <textarea
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                    placeholder="Buat catatan..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    autoFocus
                  />

                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      {COLORS.slice(0, 6).map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setForm({ ...form, color: color.value })}
                          className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                            color.value === form.color
                              ? 'border-gray-900'
                              : 'border-gray-300'
                          }`}
                          style={
                            color.value
                              ? { backgroundColor: color.value }
                              : { backgroundColor: '#fff' }
                          }
                          title={color.name}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => {
                          setForm({ title: '', content: '', color: null });
                          setExpandedForm(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!form.title.trim() && !form.content.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                        Simpan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && !showArchived && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Dipasangi Pin
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pinnedNotes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Notes */}
              {otherNotes.length > 0 && !showArchived && (
                <div>
                  {pinnedNotes.length > 0 && (
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Lainnya
                    </h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otherNotes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </div>
                </div>
              )}

              {/* Archived Notes */}
              {showArchived && notes.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Arsip
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {notes.length === 0 && (
                <div className="text-center py-12">
                  <Archive size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    {showArchived
                      ? 'Belum ada catatan yang diarsipkan'
                      : searchQuery
                      ? 'Tidak ada catatan yang ditemukan'
                      : 'Belum ada catatan'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* View/Edit Modal */}
      {(viewMode === 'view' || viewMode === 'edit') && selectedNote && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            style={selectedNote.color ? { backgroundColor: selectedNote.color } : {}}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {viewMode === 'view' ? (
                  <Eye size={20} className="text-gray-600" />
                ) : (
                  <Edit3 size={20} className="text-gray-600" />
                )}
                <h2 className="text-lg font-semibold text-gray-900">
                  {viewMode === 'view' ? 'Lihat Catatan' : 'Edit Catatan'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {viewMode === 'view' && (
                  <button
                    onClick={() => openEditMode(selectedNote)}
                    className="p-2 rounded hover:bg-black/5 text-gray-600 transition-colors"
                    title="Edit"
                  >
                    <Edit3 size={18} />
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="p-2 rounded hover:bg-black/5 text-gray-600 transition-colors"
                  title="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {viewMode === 'view' ? (
                <div className="space-y-4">
                  {selectedNote.title && (
                    <h1 className="text-2xl font-bold text-gray-900">
                      {selectedNote.title}
                    </h1>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedNote.content}
                  </p>
                  <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                    Terakhir diubah: {format(new Date(selectedNote.updated_at), 'dd MMM yyyy, HH:mm')}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    placeholder="Judul"
                    className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <textarea
                    value={editForm.content}
                    onChange={(e) =>
                      setEditForm({ ...editForm, content: e.target.value })
                    }
                    placeholder="Catatan"
                    rows={15}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {viewMode === 'edit' && (
              <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={saveEdit}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
