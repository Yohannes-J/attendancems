"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";

interface School { _id: string; name: string; }
interface Department { _id: string; name: string; school: School; }
interface Teacher { _id: string; name: string; email: string; }
interface Semester { _id: string; name: string; academicYear: string; isActive: boolean; }
interface Course {
  _id: string;
  name: string;
  code: string;
  department: Department;
  teacher: Teacher | null;
  semester: Semester | null;
  schedule: { day: string; time: string }[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({
    name: "", code: "", department: "", teacher: "", semester: "",
    schedule: [{ day: "Monday", time: "08:00" }],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [cRes, dRes, tRes, sRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/departments"),
        fetch("/api/teachers"),
        fetch("/api/semesters"),
      ]);
      if (cRes.ok) setCourses(await cRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
      if (tRes.ok) setTeachers(await tRes.json());
      if (sRes.ok) {
        const semData: Semester[] = await sRes.json();
        setSemesters(semData);
        // Default filter to active semester if exists
        const active = semData.find((s) => s.isActive);
        if (active) setFilterSemester(active._id);
      }
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    const activeSem = semesters.find((s) => s.isActive);
    setEditing(null);
    setForm({
      name: "", code: "",
      department: departments[0]?._id ?? "",
      teacher: "",
      semester: activeSem?._id ?? "",
      schedule: [{ day: "Monday", time: "08:00" }],
    });
    setError("");
    setModalOpen(true);
  }

  function openEdit(c: Course) {
    setEditing(c);
    setForm({
      name: c.name, code: c.code,
      department: c.department._id,
      teacher: c.teacher?._id ?? "",
      semester: c.semester?._id ?? "",
      schedule: c.schedule.length > 0 ? c.schedule : [{ day: "Monday", time: "08:00" }],
    });
    setError("");
    setModalOpen(true);
  }

  function addScheduleSlot() {
    setForm({ ...form, schedule: [...form.schedule, { day: "Monday", time: "08:00" }] });
  }

  function removeScheduleSlot(idx: number) {
    setForm({ ...form, schedule: form.schedule.filter((_, i) => i !== idx) });
  }

  function updateSchedule(idx: number, field: "day" | "time", val: string) {
    const s = [...form.schedule];
    s[idx] = { ...s[idx], [field]: val };
    setForm({ ...form, schedule: s });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = editing ? `/api/courses/${editing._id}` : "/api/courses";
    const method = editing ? "PUT" : "POST";
    const body = { ...form, teacher: form.teacher || null, semester: form.semester || null };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); toast.error("Failed to save course"); return; }
    toast.success(editing ? "Course updated" : "Course added");
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course?")) return;
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Course deleted"); load(); }
    else toast.error("Failed to delete");
  }

  // Filter courses by selected semester
  const displayCourses = filterSemester
    ? courses.filter((c) => c.semester?._id === filterSemester)
    : courses;

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage courses by semester</p>
        </div>
        <button onClick={openAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Course
        </button>
      </div>

      {/* Semester filter */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Filter by semester:</label>
        <select value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All semesters</option>
          {semesters.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} {s.academicYear}{s.isActive ? " (Active)" : ""}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">{displayCourses.length} course{displayCourses.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : displayCourses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {filterSemester ? "No courses for this semester yet." : "No courses yet."}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Course</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Semester</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Department</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Teacher</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Schedule</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayCourses.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded">{c.code}</span>
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-3">
                    {c.semester ? (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.semester.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.semester.name} {c.semester.academicYear}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{c.department?.name}</td>
                  <td className="px-6 py-3 text-gray-500">{c.teacher?.name ?? <span className="text-orange-400">Unassigned</span>}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {c.schedule.map((s, i) => (
                      <span key={i} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded mr-1 mb-0.5">
                        {s.day} {s.time}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                    <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? "Edit Course" : "Add Course"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
              <input required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Java Programming" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
              <input required value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. CS301" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
            <select required value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select semester…</option>
              {semesters.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.academicYear}{s.isActive ? " ✓ Active" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select required value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select department…</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name} ({d.school?.name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
            <select value={form.teacher}
              onChange={(e) => setForm({ ...form, teacher: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Unassigned</option>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>

          {/* Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Schedule</label>
              <button type="button" onClick={addScheduleSlot}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Add slot</button>
            </div>
            <div className="space-y-2">
              {form.schedule.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select value={s.day}
                    onChange={(e) => updateSchedule(i, "day", e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="time" value={s.time}
                    onChange={(e) => updateSchedule(i, "time", e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {form.schedule.length > 1 && (
                    <button type="button" onClick={() => removeScheduleSlot(i)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                  )}
                </div>
              ))}
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
