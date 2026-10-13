import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  DollarSign,
  Eye,
  HelpCircle,
  PlusCircle,
  TrendingUp,
  Users,
  Search,
  Filter,
  Layers,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import CourseMedia from "../../components/common/CourseMedia";
import Pagination from "../../components/common/Pagination";
import { resolveMediaUrl } from "../../utils/media";

export default function CoachDashboard() {
  const [stats, setStats] = useState({});
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [earnings, setEarnings] = useState({ netRevenue: 0 });
  const [loading, setLoading] = useState(true);

  // Pagination for Students
  const [studentPage, setStudentPage] = useState(1);
  const studentPageSize = 5;

  // Pagination for Courses
  const [coursePage, setCoursePage] = useState(1);
  const coursePageSize = 5;

  // Search
  const [studentSearch, setStudentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get("/coach/stats"),
      api.get("/coach/courses"),
      api.get("/coach/students"),
      api.get("/coach/earnings"),
    ])
      .then(([statsRes, courseRes, studentRes, earningRes]) => {
        if (!alive) return;
        setStats(statsRes.stats || {});
        setCourses(courseRes.courses || []);
        setStudents(studentRes.students || []);
        setEarnings(earningRes.earnings || { netRevenue: 0 });
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const metrics = [
    {
      label: "Courses Live",
      value: stats.publishedCourses || 0,
      delta: `${stats.courses || courses.length || 0} total created`,
      icon: BookOpen,
      tone: "text-amber-600 bg-amber-50 ring-amber-100",
    },
    {
      label: "Enrolled Students",
      value: stats.students || students.length || 0,
      delta: `${stats.enrollments || students.length || 0} total enrollments`,
      icon: Users,
      tone: "text-emerald-600 bg-emerald-50 ring-emerald-100",
    },
    {
      label: "Net Earnings",
      value: formatCurrency(earnings.netRevenue || stats.revenue || 0),
      delta: "After platform fee",
      icon: DollarSign,
      tone: "text-indigo-600 bg-indigo-50 ring-indigo-100",
    },
    {
      label: "Assessments Live",
      value: stats.quizzes || "Active",
      delta: "Quizzes & Assignments",
      icon: ClipboardList,
      tone: "text-rose-600 bg-rose-50 ring-rose-100",
    },
  ];

  // Filtering Students
  const filteredStudents = useMemo(() => {
    return students.filter((row) => {
      const name = row.student?.name || "";
      const email = row.student?.email || "";
      const course = row.course?.title || "";
      return `${name} ${email} ${course}`
        .toLowerCase()
        .includes(studentSearch.toLowerCase());
    });
  }, [students, studentSearch]);

  const totalStudentPages =
    Math.ceil(filteredStudents.length / studentPageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * studentPageSize;
    return filteredStudents.slice(start, start + studentPageSize);
  }, [filteredStudents, studentPage, studentPageSize]);

  // Filtering Courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      return `${c.title || ""} ${c.category || ""}`
        .toLowerCase()
        .includes(courseSearch.toLowerCase());
    });
  }, [courses, courseSearch]);

  const totalCoursePages =
    Math.ceil(filteredCourses.length / coursePageSize) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (coursePage - 1) * coursePageSize;
    return filteredCourses.slice(start, start + coursePageSize);
  }, [filteredCourses, coursePage, coursePageSize]);

  return (
    <div className="space-y-6 text-left">
      {/* Banner */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white lg:grid-cols-[1fr_340px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
              <GraduationCap size={14} /> Coach Studio Workspace
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl text-white">
              Scale your courses, students, and earnings.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Create video modules, publish interactive quizzes, review student
              submissions, and track payments seamlessly.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/coach/create-course"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-amber-300"
              >
                <PlusCircle size={15} /> Create Course
              </Link>
              <Link
                to="/coach/my-students"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
              >
                Review Students <ArrowRight size={15} />
              </Link>
              <Link
                to="/coach/manage-lessons"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
              >
                Content Builder <BookOpen size={15} />
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Community Health
              </span>
              <TrendingUp size={18} className="text-amber-300" />
            </div>
            <div className="my-2">
              <p className="text-4xl font-black text-white">
                {stats.students || students.length || 0}
              </p>
              <p className="text-xs text-amber-200 mt-0.5">
                Active learners across all courses
              </p>
            </div>
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (Number(stats.students || students.length || 0) + 1) * 15
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, delta, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {label}
              </span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={20} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">{delta}</p>
          </div>
        ))}
      </div>

      {/* Recent Enrolled Students Table */}
      <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Recent Enrolled Students
            </h3>
            <p className="text-xs text-slate-500">
              Active learners enrolled in your courses with real-time completion progress
            </p>
          </div>
          <Link
            to="/coach/my-students"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
          >
            View all students <ArrowRight size={13} />
          </Link>
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search student or course..."
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value);
                setStudentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Enrolled Course</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Join Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Loading enrolled students...
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Users size={32} className="mx-auto mb-2 text-slate-300" />
                    No enrolled students found
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((row) => {
                  const student = row.student || {};
                  const enrollment = row.enrollment || {};
                  const course = row.course || {};
                  const progress = Number(enrollment.progress || 0);
                  const isCompleted = progress >= 100;

                  return (
                    <tr
                      key={enrollment.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                            {resolveMediaUrl(student.avatar) ? (
                              <img
                                src={resolveMediaUrl(student.avatar)}
                                alt={student.name}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : null}
                            <span>{(student.name || "S")[0]}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {student.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          {course.title || "Course"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500">Progress</span>
                            <span className="text-slate-700">{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCompleted ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {enrollment.created_at
                          ? formatDate(enrollment.created_at)
                          : "-"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {isCompleted ? "Completed" : "Active"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/coach/students/${student.id}/progress`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Eye size={12} /> Progress
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pt-2">
          <Pagination
            currentPage={studentPage}
            totalPages={totalStudentPages}
            totalItems={filteredStudents.length}
            pageSize={studentPageSize}
            onPageChange={setStudentPage}
          />
        </div>
      </section>

      {/* Courses Portfolio Table */}
      <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Course Portfolio Overview
            </h3>
            <p className="text-xs text-slate-500">
              Your created curriculum, students enrolled, and publishing status
            </p>
          </div>
          <Link
            to="/coach/my-courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
          >
            Manage all courses <ArrowRight size={13} />
          </Link>
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search courses..."
              value={courseSearch}
              onChange={(e) => {
                setCourseSearch(e.target.value);
                setCoursePage(1);
              }}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Students</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Loading course portfolio...
                  </td>
                </tr>
              ) : paginatedCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <BookOpen size={32} className="mx-auto mb-2 text-slate-300" />
                    No courses found
                  </td>
                </tr>
              ) : (
                paginatedCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-900 border border-slate-200">
                          <CourseMedia course={course} compact />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate max-w-xs">
                            {course.title}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {course.difficulty || "All Levels"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {course.category || "General"}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-700">
                      {course.students || 0}
                    </td>

                    <td className="py-3 px-4 font-black text-slate-900">
                      {formatCurrency(
                        course.price || 0,
                        course.currency || "INR"
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          course.status === "published"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/coach/course-detail/${course.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800 transition"
                      >
                        <Eye size={12} /> View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pt-2">
          <Pagination
            currentPage={coursePage}
            totalPages={totalCoursePages}
            totalItems={filteredCourses.length}
            pageSize={coursePageSize}
            onPageChange={setCoursePage}
          />
        </div>
      </section>
    </div>
  );
}
