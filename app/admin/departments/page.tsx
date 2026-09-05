"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";

interface School { _id: string; name: string; }
interface Department { _id: string; name: string; school: School; }

function ActionBtns({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex gap-3"><button onClick={onEdit} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Edit</button><button onClick={onDelete} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button></div>;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: "", school: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [dRes, sRes] = await Promise.all([fetch("/api/departments"), fetch("/api/schools")]);
    setDepartments(await dRes.json()); setSchools(await sRes.json()); setLoading(false);
  }
  useEffect(() => { load(); }, []);
  function openAdd() { setEditing(null); setForm({ name: "", school: schools[0]?._id ?? "" }); setError(""); setModalOpen(true); }
  function openEdit(d: Department) { setEditing(d); setForm({ name: d.name, school: d.school._id }); setError(""); setModalOpen(true); }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const url = editing ? `/api/departments/${editing._id}` : "/api/departments";
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); toast.error(d.error ?? "Failed"); return; }
    toast.success(editing ? "Department updated" : "Department added"); setModalOpen(false); load();
  }
  async function handleDelete(id: string) {
    if (!confirm("Delete this department?")) return;
    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    res.ok ? (toast.success("Deleted"), load()) : toast.error("Failed to delete");
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Departments</h1><p className="text-sm text-gray-500">Manage departments by school</p></div>
        <button onClick={openAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 w-full sm:w-auto justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Department
        </button>
      </div>

      {loading ? <div className="text-center py-16 text-gray-400">Loading…</div>
        : departments.length === 0 ? <div className="text-center py-16 text-gray-400">No departments yet.</div>
        : <>
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100"><tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Department</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">School</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {departments.map((d, i) => (
                  <tr key={d._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{d.name}</td>
                    <td className="px-6 py-3 text-gray-500">{d.school?.name}</td>
                    <td className="px-6 py-3 text-right"><ActionBtns onEdit={() => openEdit(d)} onDelete={() => handleDelete(d._id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {departments.map((d) => (
              <div key={d._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-semibold text-gray-900">{d.name}</p><p className="text-sm text-gray-500 mt-0.5">{d.school?.name}</p></div>
                  <ActionBtns onEdit={() => openEdit(d)} onDelete={() => handleDelete(d._id)} />
                </div>
              </div>
            ))}
          </div>
        </>}

      <Modal open={modalOpen} title={editing ? "Edit Department" : "Add Department"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Computer Science" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
            <select required value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select school…</option>
              {schools.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select></div>
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
