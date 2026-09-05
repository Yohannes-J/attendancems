"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface CourseInfo {
  _id: string;
  name: string;
  code: string;
  schedule: { day: string; time: string }[];
  department: { _id: string; name: string; school?: { _id: string; name: string } } | null;
}

interface Student {
  _id: string;
  name: string;
  studentId: string;
}

interface AttendanceRecord {
  student: Student;
  day: number;
  present: boolean;
}

type AttendanceMap = Record<string, Record<number, boolean>>;

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// JS getDay() → 0=Sun,1=Mon,...,6=Sat
const DAY_NAME_TO_JS: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

/** Returns the JS weekday numbers this course meets on */
function getScheduledWeekdays(schedule: { day: string }[]): Set<number> {
  const set = new Set<number>();
  for (const s of schedule) {
    const n = DAY_NAME_TO_JS[s.day.toLowerCase()];
    if (n !== undefined) set.add(n);
  }
  return set;
}

/** Is a given day (1-based) a class day for this course? */
function isClassDay(day: number, month: number, year: number, scheduledWeekdays: Set<number>): boolean {
  if (scheduledWeekdays.size === 0) return true; // no schedule = all days allowed
  const weekday = new Date(year, month - 1, day).getDay();
  return scheduledWeekdays.has(weekday);
}

/** Is a given day in the past (strictly before today)? */
function isPastDay(day: number, month: number, year: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(year, month - 1, day);
  return d < today;
}

/** Is a given day today? */
function isToday(day: number, month: number, year: number): boolean {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day
  );
}

/** Is a given day within the allowed edit window (today or yesterday only) */
function isWithinEditWindow(day: number, month: number, year: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(year, month - 1, day);
  const diffMs = today.getTime() - d.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  // Allow today (diff=0) and yesterday (diff=1)
  return diffDays >= 0 && diffDays <= 1;
}

export default function AttendanceGrid({
  courses,
  selectedCourseId,
  selectedCourse,
  month,
  year,
}: {
  courses: CourseInfo[];
  selectedCourseId: string;
  selectedCourse: CourseInfo | null;
  month: number;
  year: number;
}) {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const daysInMonth = getDaysInMonth(month, year);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Scheduled weekdays for the current course
  const scheduledWeekdays = getScheduledWeekdays(selectedCourse?.schedule ?? []);

  // Class days = scheduled weekday AND not in the future
  // Tickable = class day AND within edit window (today or yesterday)
  function canTick(day: number): boolean {
    if (!isClassDay(day, month, year, scheduledWeekdays)) return false;
    return isWithinEditWindow(day, month, year);
  }

  function isFuture(day: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(year, month - 1, day) > today;
  }

  // Class days that are tickable (past + today) — used for % calculation
  const classDaysSoFar = days.filter((d) => canTick(d));
  const totalClassDays = days.filter((d) => isClassDay(d, month, year, scheduledWeekdays)).length;

  const loadStudentsAndAttendance = useCallback(async () => {
    if (!selectedCourseId) return;
    setLoadingStudents(true);

    const [sRes, aRes] = await Promise.all([
      fetch(`/api/students?course=${selectedCourseId}`),
      fetch(`/api/attendance?course=${selectedCourseId}&month=${month}&year=${year}`),
    ]);

    const studentData: Student[] = await sRes.json();
    const attendanceData: AttendanceRecord[] = await aRes.json();

    setStudents(studentData);

    const map: AttendanceMap = {};
    for (const s of studentData) {
      map[s._id] = {};
      for (const d of days) map[s._id][d] = false;
    }
    for (const rec of attendanceData) {
      if (rec.student && map[rec.student._id]) {
        map[rec.student._id][rec.day] = rec.present;
      }
    }
    setAttendance(map);
    setLoadingStudents(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, month, year]);

  useEffect(() => { loadStudentsAndAttendance(); }, [loadStudentsAndAttendance]);

  function toggle(studentId: string, day: number) {
    if (!canTick(day)) return; // guard
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [day]: !prev[studentId]?.[day] },
    }));
    setSaved(false);
  }

  // Mark all present/absent — only on tickable class days
  function markAllDay(day: number, value: boolean) {
    if (!canTick(day)) return;
    setAttendance((prev) => {
      const next = { ...prev };
      for (const s of students) {
        next[s._id] = { ...next[s._id], [day]: value };
      }
      return next;
    });
    setSaved(false);
  }

  // Mark all tickable class days for one student
  function markAllStudent(studentId: string, value: boolean) {
    setAttendance((prev) => {
      const dayMap: Record<number, boolean> = { ...(prev[studentId] ?? {}) };
      for (const d of classDaysSoFar) dayMap[d] = value;
      return { ...prev, [studentId]: dayMap };
    });
    setSaved(false);
  }

  async function saveAttendance() {
    if (!selectedCourseId) return;
    setSaving(true);

    // Only save records for tickable class days
    const records = students.flatMap((s) =>
      classDaysSoFar.map((d) => {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        return {
          student: s._id,
          course: selectedCourseId,
          date: dateStr,
          month,
          year,
          day: d,
          present: attendance[s._id]?.[d] ?? false,
        };
      })
    );

    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });

    setSaving(false);
    setSaved(true);
    toast.success("Attendance saved");
    setTimeout(() => setSaved(false), 3000);
  }

  function navigate(field: "course" | "month" | "year", value: string) {
    const params = new URLSearchParams({
      course: field === "course" ? value : selectedCourseId,
      month: String(field === "month" ? value : month),
      year: String(field === "year" ? value : year),
    });
    router.push(`/teacher/attendance?${params.toString()}`);
  }

  // Present count — only among class days so far
  function presentCount(studentId: string) {
    return classDaysSoFar.filter((d) => attendance[studentId]?.[d]).length;
  }

  // Attendance % = present / class days so far (not total month days)
  function attendancePct(studentId: string) {
    if (classDaysSoFar.length === 0) return 0;
    return Math.round((presentCount(studentId) / classDaysSoFar.length) * 100);
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Day header label — show weekday initial for context
  function dayLabel(d: number) {
    const weekday = new Date(year, month - 1, d).getDay();
    const initials = ["Su","Mo","Tu","We","Th","Fr","Sa"];
    return initials[weekday];
  }

  // No courses assigned to this teacher
  if (courses.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance</h1>
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-10 text-center mt-8">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No courses assigned</h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            You have no courses assigned to you yet. Ask the admin to assign a course to your account in the <strong>Courses</strong> page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>          {selectedCourse && (
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedCourse.name} · {selectedCourse.department?.name}
              {selectedCourse.department?.school && ` · ${selectedCourse.department.school.name}`}
            </p>
          )}
        </div>
        <button
          onClick={saveAttendance}
          disabled={saving || students.length === 0}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            saved
              ? "bg-green-600 text-white"
              : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          }`}
        >
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Attendance"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => navigate("course", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
          <select
            value={month}
            onChange={(e) => navigate("month", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
          <select
            value={year}
            onChange={(e) => navigate("year", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule + stats strip */}
      {selectedCourse && (
        <div className="flex flex-wrap items-center gap-4 mb-5">
          {selectedCourse.schedule.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-gray-500 font-medium">Schedule:</span>
              {selectedCourse.schedule.map((s, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                  {s.day} {s.time}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-3 ml-auto text-xs text-gray-500">
            <span className="bg-gray-100 px-3 py-1 rounded-full">
              <strong className="text-gray-700">{totalClassDays}</strong> class days this month
            </span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">
              <strong className="text-gray-700">{classDaysSoFar.length}</strong> elapsed
            </span>
          </div>
        </div>
      )}

      {loadingStudents ? (
        <div className="text-center py-20 text-gray-400">Loading students…</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          No students enrolled in this course yet. Ask admin to enroll students.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse" style={{ minWidth: `${days.length * 38 + 300}px` }}>
              <thead>
                {/* Month header */}
                <tr className="bg-indigo-600 text-white">
                  <th className="text-left px-4 py-2 font-semibold sticky left-0 bg-indigo-600 z-10 w-52">
                    Student
                  </th>
                  <th className="text-center px-2 py-2 font-semibold" colSpan={days.length}>
                    {MONTHS[month - 1]} {year}
                  </th>
                  <th className="text-center px-3 py-2 font-semibold whitespace-nowrap">Present</th>
                  <th className="text-center px-3 py-2 font-semibold">Att%</th>
                </tr>

                {/* Day numbers row */}
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="sticky left-0 bg-gray-50 z-10 px-4 py-2 text-left text-gray-600 font-medium">
                    Name / ID
                  </th>
                  {days.map((d) => {
                    const classDay = isClassDay(d, month, year, scheduledWeekdays);
                    const tickable = canTick(d);
                    const future = isFuture(d);
                    const today = isToday(d, month, year);
                    const expired = classDay && !future && !tickable;
                    return (
                      <th
                        key={d}
                        className={`text-center py-1.5 w-9 font-medium transition-colors ${
                          today
                            ? "bg-indigo-100 text-indigo-700"
                            : !classDay
                            ? "bg-gray-100 text-gray-300"
                            : future
                            ? "bg-orange-50 text-orange-300"
                            : expired
                            ? "bg-gray-50 text-gray-300"
                            : "text-gray-600"
                        }`}
                        title={
                          !classDay ? "Not a class day"
                          : future ? "Future — cannot mark yet"
                          : expired ? "Locked — edit window passed (2+ days ago)"
                          : today ? "Today"
                          : "Yesterday — still editable"
                        }
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs leading-none">{dayLabel(d)}</span>
                          <span className="font-semibold">{d}</span>
                          {tickable ? (
                            <div className="flex gap-0.5 mt-0.5">
                              <button
                                title="All present"
                                onClick={() => markAllDay(d, true)}
                                className="w-3 h-3 bg-green-400 rounded-sm hover:bg-green-600 transition-colors"
                              />
                              <button
                                title="All absent"
                                onClick={() => markAllDay(d, false)}
                                className="w-3 h-3 bg-red-300 rounded-sm hover:bg-red-500 transition-colors"
                              />
                            </div>
                          ) : (
                            <div className="h-3.5" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-center px-3 py-2 text-gray-600 font-medium">Days</th>
                  <th className="text-center px-3 py-2 text-gray-600 font-medium">%</th>
                </tr>
              </thead>

              <tbody>
                {students.map((s, idx) => {
                  const pc = presentCount(s._id);
                  const pct = attendancePct(s._id);
                  return (
                    <tr
                      key={s._id}
                      className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      {/* Sticky student name */}
                      <td className={`sticky left-0 z-10 px-4 py-2 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-gray-900 font-semibold leading-tight">{s.name}</p>
                            <p className="text-gray-400">{s.studentId}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              title="Mark all class days present"
                              onClick={() => markAllStudent(s._id, true)}
                              className="text-green-600 hover:text-green-800 font-bold text-sm leading-none"
                            >✓</button>
                            <button
                              title="Mark all class days absent"
                              onClick={() => markAllStudent(s._id, false)}
                              className="text-red-400 hover:text-red-600 font-bold text-sm leading-none"
                            >✗</button>
                          </div>
                        </div>
                      </td>

                      {/* Day cells */}
                      {days.map((d) => {
                        const classDay = isClassDay(d, month, year, scheduledWeekdays);
                        const tickable = canTick(d);
                        const future = isFuture(d);
                        const today = isToday(d, month, year);
                        const checked = attendance[s._id]?.[d] ?? false;
                        // Expired = class day that passed the 1-day edit window
                        const expired = classDay && !future && !tickable;

                        return (
                          <td
                            key={d}
                            className={`text-center py-2 w-9 ${
                              today
                                ? "bg-indigo-50"
                                : !classDay
                                ? "bg-gray-100"
                                : future
                                ? "bg-orange-50/40"
                                : expired
                                ? "bg-gray-50"
                                : ""
                            }`}
                          >
                            {!classDay ? (
                              <span className="text-gray-300 text-xs">—</span>
                            ) : future ? (
                              <span title="Future date" className="text-orange-200 text-xs select-none">○</span>
                            ) : expired ? (
                              /* Locked past day — show saved value as read-only */
                              checked ? (
                                <span title="Locked — attendance saved" className="text-green-400 text-sm select-none">✓</span>
                              ) : (
                                <span title="Locked — edit window passed" className="text-gray-300 text-xs select-none">✗</span>
                              )
                            ) : (
                              /* Within edit window (today or yesterday) */
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(s._id, d)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer accent-indigo-600"
                                aria-label={`${s.name} day ${d}`}
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Summary */}
                      <td className="text-center px-3 py-2 font-semibold text-gray-700">
                        {pc}<span className="text-gray-400 font-normal">/{classDaysSoFar.length}</span>
                      </td>
                      <td className="text-center px-3 py-2">
                        <span className={`font-semibold text-xs px-1.5 py-0.5 rounded ${
                          pct >= 75 ? "bg-green-100 text-green-700" :
                          pct >= 50 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-600"
                        }`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-indigo-100 rounded-sm inline-block border border-indigo-200" /> Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-gray-100 rounded-sm inline-block border border-gray-200" /> Not a class day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-orange-50 rounded-sm inline-block border border-orange-200" /> Future (locked)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-gray-50 rounded-sm inline-block border border-gray-200" /> Expired — 2+ days ago (locked)
            </span>
            <span className="flex items-center gap-1.5">
              <strong className="text-green-500">✓</strong> saved present &nbsp;
              <strong className="text-gray-300">✗</strong> saved absent
            </span>
            <span className="ml-auto text-gray-400">
              {students.length} students · {classDaysSoFar.length} elapsed class days · {totalClassDays} total this month
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
