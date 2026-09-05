"use client";

import { useEffect, useState } from "react";
import AttendanceGrid from "./AttendanceGrid";

interface CourseInfo {
  _id: string;
  name: string;
  code: string;
  schedule: { day: string; time: string }[];
  department: { _id: string; name: string; school?: { _id: string; name: string } } | null;
}

export default function AttendancePageClient({
  initialCourseId,
  initialMonth,
  initialYear,
}: {
  initialCourseId: string;
  initialMonth: number;
  initialYear: number;
}) {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses/mine")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm animate-pulse">Loading courses…</div>
      </div>
    );
  }

  const selectedCourseId = initialCourseId || courses[0]?._id || "";
  const selectedCourse = courses.find((c) => c._id === selectedCourseId) ?? null;

  return (
    <AttendanceGrid
      courses={courses}
      selectedCourseId={selectedCourseId}
      selectedCourse={selectedCourse}
      month={initialMonth}
      year={initialYear}
    />
  );
}
