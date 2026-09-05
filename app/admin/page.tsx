import { connectDB } from "@/lib/mongodb";
import School from "@/models/School";
import Department from "@/models/Department";
import Course from "@/models/Course";
import Student from "@/models/Student";
import User from "@/models/User";

async function getStats() {
  await connectDB();
  const [schools, departments, courses, students, teachers, admins] = await Promise.all([
    School.countDocuments(),
    Department.countDocuments(),
    Course.countDocuments(),
    Student.countDocuments(),
    User.countDocuments({ role: "teacher" }),
    User.countDocuments({ role: "admin" }),
  ]);
  return { schools, departments, courses, students, teachers, admins };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Schools", value: stats.schools, color: "bg-blue-500", icon: "🏫" },
    { label: "Departments", value: stats.departments, color: "bg-purple-500", icon: "🗂️" },
    { label: "Courses", value: stats.courses, color: "bg-green-500", icon: "📚" },
    { label: "Teachers", value: stats.teachers, color: "bg-orange-500", icon: "👨‍🏫" },
    { label: "Students", value: stats.students, color: "bg-pink-500", icon: "👨‍🎓" },
    { label: "Admins", value: stats.admins, color: "bg-indigo-500", icon: "🛡️" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your institution</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center text-xl mb-3`}>
              {c.icon}
            </div>
            <p className="text-3xl font-bold text-gray-900">{c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-3">Quick Start</h2>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Add a <strong>School</strong> from the Schools page</li>
          <li>Add a <strong>Department</strong> and link it to a school</li>
          <li>Register <strong>Teachers</strong> with login credentials</li>
          <li>Create <strong>Courses</strong>, assign a department and teacher</li>
          <li>Add <strong>Students</strong> and enroll them in courses</li>
          <li>Teachers log in and mark <strong>Attendance</strong> via the 30-day grid</li>
        </ol>
      </div>
    </div>
  );
}
