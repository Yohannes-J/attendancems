"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";

interface Semester {
  _id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Semester | null>(null);
  const [form, setForm] = useState({
    name: "", academicYear: "", startDate: "", endDate: "", isActive: false,
  });
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [activateMsg, setActivateMsg] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/semesters");
    if (res.ok) setSemesters(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", academicYear: "", startDate: "", endDate: "", isActive: false });
    setError("");
    setModalOpen(true);
  }

  function openEdit(s: Semester) {
    setEditing(s);
    setForm({
      name: s.name,
      academicYear: s.academicYear,
      startDate: s.startDate.split("T")[0],
      endDate: s.endDate.split("T")[0],
      isActive: s.isActive,
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = editing ? `/api/semesters/${editing._id}` : "/api/semesters";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); toast.error("Failed to save"); return; }
    toast.success(editing ? "Semester updated" : "Semester created");
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this semester? This will not delete attendance records.")) return;
    const res = await fetch(`/api/semesters/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Semester deleted"); load(); }
    else toast.error("Failed to delete");
  }

  async function handleActivate(id: string, name: string) {
    if (!confirm(`Activate "${name}"? This will re-enroll ALL students into this semester's courses for their department.`)) return;
    setActivating(id);
    setActivateMsg("");
    const res = await fetch(`/api/semesters/${id}/activate`, { method: "POST" });
    const data = await res.json();
    setActivating(null);
    if (res.ok) {
      toast.success(`✓ ${data.message}`);
      setActivateMsg(data.message);
      load();
      setTimeout(() => setActivateMsg(""), 5000);
    } else {
      toast.error(data.error ?? "Failed to activate");
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Semesters</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage academic semesters and student enrollment</p>
        </div>
        <button onClick={openAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Semester
        </button>
      </div>

      {/* How it works info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
        <strong>How semesters work:</strong> Create a semester, assign courses to it (in the Courses page), then click <strong>Activate</strong> to make it the current semester.
        Activating re-enrolls all students into their department's courses for that semester automatically.
        Past attendance records are preserved.
      </div>

      {activateMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
          ✓ {activateMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : semesters.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No semesters yet. Add your first semester.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Semester</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Academic Year</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Start</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">End</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {semesters.map((s) => (
                <tr key={s._id} className={`hover:bg-gray-50 transition-colors ${s.isActive ? "bg-green-50/40" : ""}`}>
                  <td className="px-6 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-6 py-3 text-gray-500">{s.academicYear}</td>
                  <td className="px-6 py-3 text-gray-500">{new Date(s.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-gray-500">{new Date(s.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                        Active
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right space-x-2">
                    {!s.isActive && (
                      <button
                        onClick={() => handleActivate(s._id, `${s.name} ${s.academicYear}`)}
                        disabled={activating === s._id}
                        className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                      >
                        {activating === s._id ? "Activating…" : "Activate"}
                      </button>
                    )}
                    <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                    <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? "Edit Semester" : "Add Semester"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester Name *</label>
              <input required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Semester 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
              <input required value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 2025/2026" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input required type="date" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input required type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
