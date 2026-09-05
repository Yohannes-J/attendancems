"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";

interface Admin { _id: string; name: string; email: string; createdAt: string; }

function ActionBtns({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex gap-3"><button onClick={onEdit} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Edit</button><button onClick={onDelete} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button></div>;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admins");
    if (res.ok) setAdmins(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  function openAdd() { setEditing(null); setForm({ name: "", email: "", password: "" }); setError(""); setModalOpen(true); }
  function openEdit(a: Admin) { setEditing(a); setForm({ name: a.name, email: a.email, password: "" }); setError(""); setModalOpen(true); }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const url = editing ? `/api/admins/${editing._id}` : "/api/admins";
    const body = editing ? { name: form.name, email: form.email } : { name: form.name, email: form.email, password: form.password };
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); toast.error(d.error ?? "Failed"); return; }
    toast.success(editing ? "Admin updated" : "Admin created"); setModalOpen(false); load();
  }
  async function handleDelete(id: string) {
    if (!confirm("Delete this admin account?")) return;
    const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error((await res.json()).error ?? "Failed"); return; }
    toast.success("Admin deleted"); load();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Administrators</h1><p className="text-sm text-gray-500">Manage admin accounts</p></div>
        <button onClick={openAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 w-full sm:w-auto justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Admin
        </button>
      </div>

      {loading ? <div className="text-center py-16 text-gray-400">Loading…</div>
        : admins.length === 0 ? <div className="text-center py-16 text-gray-400">No admins.</div>
        : <>
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100"><tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Created</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {admins.map((a, i) => (
                  <tr key={a._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-900 flex items-center gap-2">{a.name}{i === 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Super Admin</span>}</td>
                    <td className="px-6 py-3 text-gray-500">{a.email}</td>
                    <td className="px-6 py-3 text-gray-400 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-right"><ActionBtns onEdit={() => openEdit(a)} onDelete={() => handleDelete(a._id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {admins.map((a, i) => (
              <div key={a._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2"><p className="font-semibold text-gray-900">{a.name}</p>{i === 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Super</span>}</div>
                    <p className="text-sm text-gray-500 mt-0.5">{a.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ActionBtns onEdit={() => openEdit(a)} onDelete={() => handleDelete(a._id)} />
                </div>
              </div>
            ))}
          </div>
        </>}

      <Modal open={modalOpen} title={editing ? "Edit Admin" : "Add Admin"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Administrator" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="admin@school.com" /></div>
          {!editing && <div><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" minLength={6} /></div>}
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
