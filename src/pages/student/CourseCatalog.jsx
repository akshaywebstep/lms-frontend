import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Star,
  Users,
  Search,
  Filter,
  Grid,
  List,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import { formatCurrency } from "../../utils/formatters";
import CourseMedia from "../../components/common/CourseMedia";
import Pagination from "../../components/common/Pagination";

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = viewMode === "grid" ? 9 : 10;

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/student/courses/browse");
        if (alive) setCourses(res.courses || []);
      } catch (err) {
        if (alive) setError(err?.message || "Failed to load courses");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [courses]);

  // KPIs
  const stats = useMemo(() => {
    const total = courses.length;
    const enrolled = courses.filter((c) => Boolean(c.isEnrolled)).length;
    const uniqueCats = categories.length;
    return { total, enrolled, available: total - enrolled, uniqueCats };
  }, [courses, categories]);

  // Filtering
  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const matchSearch = `${course.title || ""} ${course.category || ""} ${
        course.coach?.name || ""
      } ${course.difficulty || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchCategory =
        categoryFilter === "all" || course.category === categoryFilter;

      const enrolled = Boolean(course.isEnrolled);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "enrolled" && enrolled) ||
        (statusFilter === "available" && !enrolled);

      const matchDifficulty =
        difficultyFilter === "all" ||
        course.difficulty?.toLowerCase() === difficultyFilter.toLowerCase();

      return matchSearch && matchCategory && matchStatus && matchDifficulty;
    });
  }, [courses, search, categoryFilter, statusFilter, difficultyFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, difficultyFilter, viewMode]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Browse Course Catalog
            </h1>
            <p className="text-xs text-slate-500">
              Explore instructor-led courses, view syllabi, and enroll with direct instant access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/student/my-learning"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            My Enrolled Courses <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Published",
            value: stats.total,
            icon: Layers,
            color: "text-sky-600",
            bg: "bg-sky-50",
          },
          {
            label: "Enrolled by You",
            value: stats.enrolled,
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Available to Join",
            value: stats.available,
            icon: Sparkles,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Subject Categories",
            value: stats.uniqueCats,
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

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Table & Cards Section */}
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
              placeholder="Search title, coach, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600">
              <Filter size={13} className="text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Access</option>
                <option value="enrolled">Enrolled Only</option>
                <option value="available">Available to Enroll</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* View Switcher (Table / Grid) */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table view"
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "table"
                    ? "bg-white text-sky-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <List size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "grid"
                    ? "bg-white text-sky-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Grid size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Table (Standard LMS Table matching ManageStudents) */}
        {viewMode === "table" ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Category / Level</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading courses catalog...
                    </td>
                  </tr>
                ) : paginatedCourses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No courses found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Try modifying your search or filter options.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedCourses.map((course) => {
                    const enrolled = Boolean(course.isEnrolled);
                    const progress = Number(course.enrollment?.progress || 0);

                    return (
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
                              <p className="font-bold text-slate-900 truncate max-w-xs sm:max-w-sm">
                                {course.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                                <span className="flex items-center gap-0.5">
                                  <Users size={11} /> {course.students || 0} students
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Clock size={11} /> {course.duration || "Self-paced"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-extrabold text-slate-600">
                              {(course.coach?.name || "C")[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {course.coach?.name || "Lead Instructor"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {course.language || "English"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <span className="inline-block rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                              {course.category || "General"}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {course.difficulty || "All Levels"}
                            </p>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-xs font-black text-slate-900">
                            {formatCurrency(
                              course.price || 0,
                              course.currency || "INR"
                            )}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {enrolled ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/50">
                              <CheckCircle size={11} /> Enrolled ({progress}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                              Available
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {enrolled ? (
                            <Link
                              to={`/student/learn/${course.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm"
                            >
                              <BookOpen size={13} /> Continue
                            </Link>
                          ) : (
                            <Link
                              to={`/student/courses/${course.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 shadow-sm"
                            >
                              View Syllabus
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* View Mode: Grid Cards */
          <div>
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                Loading courses catalog...
              </div>
            ) : paginatedCourses.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No courses found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {paginatedCourses.map((course) => {
                  const enrolled = Boolean(course.isEnrolled);
                  const progress = Number(course.enrollment?.progress || 0);

                  return (
                    <article
                      key={course.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                        enrolled
                          ? "border-emerald-200 ring-1 ring-emerald-100"
                          : "border-slate-200/80"
                      }`}
                    >
                      <div className="relative h-40 overflow-hidden bg-slate-900">
                        <CourseMedia course={course} compact />
                        {enrolled && (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-black text-white shadow">
                            <CheckCircle size={13} /> Enrolled
                          </span>
                        )}
                      </div>

                      <div className="space-y-4 p-5">
                        <div>
                          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                            {course.category || "General"}
                          </span>
                          <h3 className="mt-2 text-base font-bold leading-snug text-slate-900 line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            By {course.coach?.name || "Instructor"}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users size={13} /> {course.students || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={13} /> {course.difficulty || "All"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star size={13} className="text-amber-500 fill-amber-500" />{" "}
                            Live
                          </span>
                        </div>

                        {enrolled && (
                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-500">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                          <span
                            className={
                              enrolled
                                ? "text-xs font-black text-emerald-700"
                                : "text-base font-extrabold text-slate-900"
                            }
                          >
                            {enrolled
                              ? "Already Bought"
                              : formatCurrency(
                                  course.price || 0,
                                  course.currency || "INR"
                                )}
                          </span>
                          <Link
                            to={
                              enrolled
                                ? `/student/learn/${course.id}`
                                : `/student/courses/${course.id}`
                            }
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition ${
                              enrolled
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-slate-900 hover:bg-slate-800"
                            }`}
                          >
                            {enrolled && <BookOpen size={13} />}
                            {enrolled ? "Continue" : "View Syllabus"}
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
