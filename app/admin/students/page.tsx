"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";

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

const PAGE_SIZE = 8;

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: null = cards view, string = selected dept id
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({
    name: "", studentId: "", email: "", phone: "",
    block: "", dormNumber: "",
    school: "", department: "", enrolledCourses: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  // Reset page when search or dept changes
  useEffect(() => { setPage(1); }, [search, selectedDept]);

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
    const deptId = selectedDept ?? "";
    setForm({
      name: "", studentId: "", email: "", phone: "", block: "", dormNumber: "",
      school: deptId ? (departments.find((d) => d._id === deptId)?.school?._id ?? "") : "",
      department: deptId,
      enrolledCourses: deptId ? getCourseIdsForDept(deptId) : [],
    });
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
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); toast.error((await res.clone().json()).error ?? "Failed to save"); return; }
    toast.success(editing ? "Student updated" : "Student registered");
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this student?")) return;
    const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Student deleted"); load(); }
    else toast.error("Failed to delete");
  }

  // ── Derived data ──────────────────────────────────────────────
  // Count students per department
  const deptStudentCount = (deptId: string) =>
    students.filter((s) => s.department?._id === deptId).length;

  // Students in selected department, filtered by search, paginated
  const deptStudents = selectedDept
    ? students.filter((s) => s.department?._id === selectedDept)
    : students;

  const searchFiltered = deptStudents.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(searchFiltered.length / PAGE_SIZE));
  const paginated = searchFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedDeptObj = departments.find((d) => d._id === selectedDept);
  const filteredDepts = form.school
    ? departments.filter((d) => d.school?._id === form.school)
    : departments;

  // Dept cards: only show depts that have at least 1 student (or all if admin wants)
  const deptCards = departments;

  return (
    <div className="p-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {selectedDept ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => { setSelectedDept(null); setSearch(""); }}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  All Departments
                </button>
                <span className="text-gray-300">/</span>
                <span className="text-sm font-semibold text-gray-700">{selectedDeptObj?.name}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedDeptObj?.name}
                <span className="ml-2 text-base font-normal text-gray-400">
                  — {searchFiltered.length} student{searchFiltered.length !== 1 ? "s" : ""}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{selectedDeptObj?.school?.name}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Students</h1>
              <p className="text-sm text-gray-500 mt-0.5">{students.length} registered students across {deptCards.length} departments</p>
            </>
          )}
        </div>
        <button
          onClick={openAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : !selectedDept ? (
        /* ── Department Cards View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {deptCards.length === 0 ? (
            <p className="text-gray-400 col-span-4 text-center py-16">No departments yet. Add departments first.</p>
          ) : deptCards.map((dept) => {
            const count = deptStudentCount(dept._id);
            return (
              <button
                key={dept._id}
                onClick={() => { setSelectedDept(dept._id); setSearch(""); setPage(1); }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <svg className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className={`text-2xl font-bold ${count === 0 ? "text-gray-300" : "text-indigo-600"}`}>{count}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 group-hover:text-indigo-700 transition-colors">
                  {dept.name}
                </h3>
                <p className="text-xs text-gray-400">{dept.school?.name}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View students
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* ── Student List View (drill-down) ── */
        <>
          <div className="mb-4 flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or email…"
              className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {paginated.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              {search ? "No students match your search." : "No students in this department yet."}
            </div>
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
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="bg-gray-100 text-gray-700 text-xs font-mono px-2 py-0.5 rounded">{s.studentId}</span>
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-6 py-3 text-gray-500">{s.email}</td>
                      <td className="px-6 py-3 text-gray-500">{s.phone ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-500">{s.block ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-500">{s.dormNumber ?? "—"}</td>
                      <td className="px-6 py-3 text-right space-x-2">
                        <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                        <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, searchFiltered.length)} of {searchFiltered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          p === page
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Add/Edit Modal ── */}
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
                placeholder="+251911..." />
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
