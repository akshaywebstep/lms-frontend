import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Search,
  Filter,
  BookOpen,
  Users,
  Edit2,
  Eye,
  List,
  Grid,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import { formatCurrency } from "../../utils/formatters";
import CourseMedia from "../../components/common/CourseMedia";
import Pagination from "../../components/common/Pagination";

const statuses = ["All", "published", "draft", "archived"];

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = viewMode === "grid" ? 9 : 10;

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/coach/courses");
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

  const categories = useMemo(
    () => ["All", ...new Set(courses.map((c) => c.category).filter(Boolean))],
    [courses]
  );

  const stats = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.status === "published").length;
    const draft = courses.filter((c) => c.status === "draft").length;
    const totalStudents = courses.reduce(
      (sum, c) => sum + Number(c.students || 0),
      0
    );
    return { total, published, draft, totalStudents };
  }, [courses]);

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const matchSearch = course.title
        ?.toLowerCase()
        .includes(search.toLowerCase());
      const matchCategory = category === "All" || course.category === category;
      const matchStatus = status === "All" || course.status === status;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [courses, search, category, status]);

  useEffect(() => {
    setPage(1);
  }, [search, category, status, viewMode]);

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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              My Created Courses
            </h1>
            <p className="text-xs text-slate-500">
              Manage your course portfolio, curriculum lessons, pricing, and enrollments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/coach/create-course"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-amber-400"
          >
            <PlusCircle size={16} /> Create New Course
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Courses",
            value: stats.total,
            icon: Layers,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Published Live",
            value: stats.published,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "In Draft",
            value: stats.draft,
            icon: Clock,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            label: "Total Students",
            value: stats.totalStudents,
            icon: Users,
            color: "text-sky-600",
            bg: "bg-sky-50",
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

      {/* Courses List / Table Card */}
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
              placeholder="Search by course title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600">
              <Filter size={13} className="text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All Categories" : item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item === "All"
                      ? "All Status"
                      : item[0].toUpperCase() + item.slice(1)}
                  </option>
                ))}
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
                    ? "bg-white text-amber-600 shadow-sm"
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
                    ? "bg-white text-amber-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Grid size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Table (Matching ManageStudents/ManageCourses standard) */}
        {viewMode === "table" ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Enrolled Students</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading your courses...
                    </td>
                  </tr>
                ) : paginatedCourses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No courses found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {courses.length === 0
                          ? "You haven't created any courses yet."
                          : "Try adjusting your search or filters."}
                      </p>
                      {courses.length === 0 && (
                        <Link
                          to="/coach/create-course"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                        >
                          <PlusCircle size={14} /> Create Your First Course
                        </Link>
                      )}
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
                            <p className="font-bold text-slate-900 truncate max-w-xs sm:max-w-sm">
                              {course.title}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              ID: #{course.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {course.category || "General"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-600 font-medium">
                          {course.difficulty || "All Levels"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                          <Users size={12} className="text-slate-400" />
                          {course.students || 0}
                        </span>
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
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                              : course.status === "draft"
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {course.status || "draft"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/coach/edit-course/${course.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                            title="Edit Course"
                          >
                            <Edit2 size={12} /> Edit
                          </Link>
                          <Link
                            to={`/coach/course-detail/${course.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-slate-800 transition"
                            title="View Course"
                          >
                            <Eye size={12} /> View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* View Mode: Grid Cards */
          <div>
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                Loading courses...
              </div>
            ) : paginatedCourses.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No courses found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {paginatedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="h-36 overflow-hidden bg-slate-900">
                      <CourseMedia course={course} compact />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">
                          {course.title}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            course.status === "published"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {course.status}
                        </span>
                      </div>
                      <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        {course.category || "General"}
                      </span>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users size={13} /> {course.students || 0} students
                        </span>
                        <span>{course.difficulty || "All Levels"}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="font-black text-slate-900">
                          {formatCurrency(
                            course.price || 0,
                            course.currency || "INR"
                          )}
                        </span>
                        <div className="flex gap-1.5">
                          <Link
                            to={`/coach/edit-course/${course.id}`}
                            className="rounded-lg border px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </Link>
                          <Link
                            to={`/coach/course-detail/${course.id}`}
                            className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white hover:bg-slate-800"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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