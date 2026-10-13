import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Search,
  BookOpen,
  PlayCircle,
  Clock,
  Award,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import api from "../../services/api";
import Pagination from "../../components/common/Pagination";
import CourseMedia from "../../components/common/CourseMedia";

export default function MyLearning() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/student/courses/enrolled")
      .then((r) => setRows(r.courses || []))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter(
      (r) => Number(r.enrollment?.progress || 0) >= 100
    ).length;
    const inProgress = total - completed;
    const avgProgress = total
      ? Math.round(
          rows.reduce(
            (sum, r) => sum + Number(r.enrollment?.progress || 0),
            0
          ) / total
        )
      : 0;
    return { total, completed, inProgress, avgProgress };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(({ enrollment, course }) => {
      const matchSearch =
        `${course.title} ${course.category || ""} ${course.coach?.name || ""}`
          .toLowerCase()
          .includes(q.toLowerCase());
      const progress = Number(enrollment?.progress || 0);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && progress >= 100) ||
        (statusFilter === "inprogress" && progress < 100);
      return matchSearch && matchStatus;
    });
  }, [rows, q, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">My Enrolled Courses</h1>
            <p className="text-xs text-slate-500">
              Continue your ongoing courses, watch video lessons, and track study milestones
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Enrolled Courses",
            value: stats.total,
            icon: BookOpen,
            color: "text-sky-600",
            bg: "bg-sky-50",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            icon: TrendingUp,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Avg Progress",
            value: `${stats.avgProgress}%`,
            icon: Award,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((x) => {
          const Icon = x.icon;
          return (
            <div
              key={x.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {x.label}
                </span>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${x.bg} ${x.color}`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">{x.value}</p>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-bold text-slate-700 mr-2">
            My Courses: <span className="text-sky-600 font-extrabold">{filtered.length}</span>
          </div>
          <div className="flex gap-1">
            {[
              { id: "all", label: "All Courses" },
              { id: "inprogress", label: "In Progress" },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search by title, category, coach..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:border-sky-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Professional Enrolled Courses Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Course Name</th>
                <th className="px-5 py-3.5">Instructor / Coach</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Completion Progress</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
                    <p className="mt-2 text-xs font-semibold">Loading courses...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <BookOpen className="mx-auto mb-2 text-slate-300" size={32} />
                    <p className="text-xs font-bold text-slate-700">No enrolled courses found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Browse courses catalog and enroll to start learning.
                    </p>
                    <Link
                      to="/student/courses"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                    >
                      <BookOpen size={13} /> Browse Courses
                    </Link>
                  </td>
                </tr>
              ) : (
                paginatedRows.map(({ enrollment, course }) => {
                  const progress = Number(enrollment?.progress || 0);
                  const isDone = progress >= 100;

                  return (
                    <tr key={enrollment.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-900 shadow-xs">
                            <CourseMedia course={course} compact />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{course.title}</p>
                            <p className="text-[10px] text-slate-400">
                              Enrolled ID: {enrollment.id?.slice(0, 12)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {course.coach?.name || "Platform Coach"}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {course.category || "General"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="w-36">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                            <span>{progress}%</span>
                            <span className="text-slate-400 text-[10px]">
                              {isDone ? "Completed" : "In Progress"}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isDone ? "bg-emerald-500" : "bg-sky-500"
                              }`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isDone
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-sky-50 text-sky-700"
                          }`}
                        >
                          {isDone ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {isDone ? "Completed" : "In Progress"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/student/learn/${course.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                        >
                          <PlayCircle size={13} />
                          {isDone ? "Review" : "Continue"}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
