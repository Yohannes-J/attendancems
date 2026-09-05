"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";

interface School { _id: string; name: string; address?: string; }

function ActionBtns({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-3">
      <button onClick={onEdit} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Edit</button>
      <button onClick={onDelete} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>
    </div>
  );
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [form, setForm] = useState({ name: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/schools");
    setSchools(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm({ name: "", address: "" }); setError(""); setModalOpen(true); }
  function openEdit(s: School) { setEditing(s); setForm({ name: s.name, address: s.address ?? "" }); setError(""); setModalOpen(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const url = editing ? `/api/schools/${editing._id}` : "/api/schools";
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); toast.error(d.error ?? "Failed"); return; }
    toast.success(editing ? "School updated" : "School added"); setModalOpen(false); load();
  }
  async function handleDelete(id: string) {
    if (!confirm("Delete this school?")) return;
    const res = await fetch(`/api/schools/${id}`, { method: "DELETE" });
    res.ok ? (toast.success("Deleted"), load()) : toast.error("Failed to delete");
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Schools</h1><p className="text-sm text-gray-500">Manage registered schools</p></div>
        <button onClick={openAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 w-full sm:w-auto justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add School
        </button>
      </div>

      {loading ? <div className="text-center py-16 text-gray-400">Loading…</div>
        : schools.length === 0 ? <div className="text-center py-16 text-gray-400">No schools yet.</div>
        : <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">#</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">University</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {schools.map((s, i) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-3 text-gray-500">{s.address ?? "—"}</td>
                    <td className="px-6 py-3 text-right"><ActionBtns onEdit={() => openEdit(s)} onDelete={() => handleDelete(s._id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {schools.map((s) => (
              <div key={s._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-semibold text-gray-900">{s.name}</p><p className="text-sm text-gray-500 mt-0.5">{s.address ?? "—"}</p></div>
                  <ActionBtns onEdit={() => openEdit(s)} onDelete={() => handleDelete(s._id)} />
                </div>
              </div>
            ))}
          </div>
        </>}

      <Modal open={modalOpen} title={editing ? "Edit School" : "Add School"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">School / Faculty Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. School of Computing" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">University Name *</label>
            <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Addis Ababa University" /></div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
