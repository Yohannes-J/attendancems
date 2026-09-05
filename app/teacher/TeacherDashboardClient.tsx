"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Course {
  _id: string;
  name: string;
  code: string;
  schedule: { day: string; time: string }[];
  department: { name: string; school?: { name: string } } | null;
}

export default function TeacherDashboardClient({ userName }: { userName: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses/mine")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {userName}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          My Courses {!loading && `(${courses.length})`}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-16 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-9 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium text-gray-500">No courses assigned yet</p>
            <p className="text-sm mt-1">Ask the admin to assign courses to your account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div key={c._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1 rounded">{c.code}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{c.name}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {c.department?.name}
                  {c.department?.school && ` · ${c.department.school.name}`}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {c.schedule.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                      📅 {s.day} {s.time}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/teacher/attendance?course=${c._id}`}
                  className="block w-full text-center bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Mark Attendance
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
