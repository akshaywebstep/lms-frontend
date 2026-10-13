import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Users,
  BookOpen,
  Eye,
  MessageSquare,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import { formatDate } from "../../utils/formatters";
import { resolveMediaUrl } from "../../utils/media";
import Pagination from "../../components/common/Pagination";

export default function MyStudents() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ students: 0, enrollments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/coach/students");
        if (alive) {
          setRows(res.students || []);
          setStats(res.stats || {});
        }
      } catch (err) {
        if (alive) setError(err?.message || "Failed to load students");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const courseOptions = useMemo(
    () => [
      "All Courses",
      ...new Set(rows.map((r) => r.course?.title).filter(Boolean)),
    ],
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const student = row.student || {};
      const enrollment = row.enrollment || {};
      const course = row.course || {};
      const matchSearch = `${student.name || ""} ${student.email || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchCourse =
        courseFilter === "All Courses" || course.title === courseFilter;
      const visibleStatus =
        enrollment.status === "active" ? "Active" : "Inactive";
      const matchStatus =
        statusFilter === "All" || visibleStatus === statusFilter;
      return matchSearch && matchCourse && matchStatus;
    });
  }, [rows, search, courseFilter, statusFilter]);

  const kpiStats = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter(
      (r) => Number(r.enrollment?.progress || 0) >= 100
    ).length;
    const active = total - completed;
    const avgProgress = total
      ? Math.round(
          rows.reduce((sum, r) => sum + Number(r.enrollment?.progress || 0), 0) /
            total
        )
      : 0;
    return {
      studentsCount: stats.students || new Set(rows.map((r) => r.student?.id)).size,
      enrollmentsCount: stats.enrollments || total,
      completed,
      avgProgress,
    };
  }, [rows, stats]);

  useEffect(() => {
    setPage(1);
  }, [search, courseFilter, statusFilter]);

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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              My Enrolled Students
            </h1>
            <p className="text-xs text-slate-500">
              Track student study progress, curriculum milestones, and engagement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/coach/my-courses"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Manage Courses <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Students",
            value: kpiStats.studentsCount,
            icon: Users,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Course Enrollments",
            value: kpiStats.enrollmentsCount,
            icon: BookOpen,
            color: "text-sky-600",
            bg: "bg-sky-50",
          },
          {
            label: "Completed",
            value: kpiStats.completed,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Average Progress",
            value: `${kpiStats.avgProgress}%`,
            icon: TrendingUp,
            color: "text-violet-600",
            bg: "bg-violet-50",
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

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600">
              <Filter size={13} className="text-slate-400" />
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                {courseOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Enrolled Course</th>
                <th className="py-3 px-4">Learning Progress</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading student enrollments...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">
                      No student records found
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search criteria or course filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const student = row.student || {};
                  const enrollment = row.enrollment || {};
                  const course = row.course || {};
                  const progress = Number(enrollment.progress || 0);
                  const isCompleted = progress >= 100;
                  const status =
                    enrollment.status === "active" ? "Active" : "Inactive";

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
                          {course.title || "-"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500">Progress</span>
                            <span
                              className={
                                isCompleted
                                  ? "text-emerald-600 font-extrabold"
                                  : "text-slate-700"
                              }
                            >
                              {progress}%
                            </span>
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
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            status === "Active"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/coach/students/${student.id}/progress`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                            title="View Detailed Progress"
                          >
                            <Eye size={12} /> Progress
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Always Visible */}
        <div className="pt-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}