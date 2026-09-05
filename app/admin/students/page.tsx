"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

interface School { _id: string; name: string; }
interface Department { _id: string; name: string; school: School; }
interface Course { _id: string; name: string; code: string; department: { _id: string } | string; }
interface Student {
  _id: string;
  name: string;
  studentId: string;
  email: string;
  phone?: string;
  block?: string;
  dormNumber?: string;
  school: School;
  department: Department;
  enrolledCourses: Course[];
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({
    name: "", studentId: "", email: "", phone: "",
    block: "", dormNumber: "",
    school: "", department: "", enrolledCourses: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [sRes, schRes, dRes, cRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/schools"),
        fetch("/api/departments"),
        fetch("/api/courses"),
      ]);
      if (sRes.ok) setStudents(await sRes.json());
      if (schRes.ok) setSchools(await schRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
      if (cRes.ok) setCourses(await cRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  /** All course IDs that belong to a given department */
  function getCourseIdsForDept(deptId: string): string[] {
    return courses
      .filter((c) => {
        const dId = typeof c.department === "string" ? c.department : c.department?._id;
        return dId === deptId;
      })
      .map((c) => c._id);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: "", studentId: "", email: "", phone: "", block: "", dormNumber: "", school: "", department: "", enrolledCourses: [] });
    setError("");
    setModalOpen(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({
      name: s.name, studentId: s.studentId, email: s.email,
      phone: s.phone ?? "", block: s.block ?? "", dormNumber: s.dormNumber ?? "",
      school: s.school?._id ?? "", department: s.department?._id ?? "",
      enrolledCourses: s.enrolledCourses.map((c) => c._id),
    });
    setError("");
    setModalOpen(true);
  }

  function handleSchoolChange(schoolId: string) {
    setForm((f) => ({ ...f, school: schoolId, department: "", enrolledCourses: [] }));
  }

  function handleDeptChange(deptId: string) {
    // Silently auto-assign all courses of this department
    setForm((f) => ({ ...f, department: deptId, enrolledCourses: getCourseIdsForDept(deptId) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = editing ? `/api/students/${editing._id}` : "/api/students";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); return; }
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this student?")) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDepts = form.school
    ? departments.filter((d) => d.school?._id === form.school)
    : departments;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} registered students</p>
        </div>
        <button onClick={openAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      </div>

      <div className="mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, or email…"
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No students found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Block</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Dorm No.</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Department</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="bg-gray-100 text-gray-700 text-xs font-mono px-2 py-0.5 rounded">{s.studentId}</span>
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-6 py-3 text-gray-500">{s.email}</td>
                  <td className="px-6 py-3 text-gray-500">{s.phone ?? "—"}</td>
                  <td className="px-6 py-3 text-gray-500">{s.block ?? "—"}</td>
                  <td className="px-6 py-3 text-gray-500">{s.dormNumber ?? "—"}</td>
                  <td className="px-6 py-3 text-gray-500">{s.department?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                    <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? "Edit Student" : "Add Student"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
              <input required value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. STU001" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input required type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="john@student.com" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. +251911..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Block No.</label>
              <input value={form.block}
                onChange={(e) => setForm({ ...form, block: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. B4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dorm No.</label>
              <input value={form.dormNumber}
                onChange={(e) => setForm({ ...form, dormNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 214" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
              <select required value={form.school}
                onChange={(e) => handleSchoolChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select school…</option>
                {schools.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select required value={form.department}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select dept…</option>
                {filteredDepts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
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
