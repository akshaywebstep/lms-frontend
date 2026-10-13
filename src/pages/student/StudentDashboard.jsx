import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  Clock,
  PlayCircle,
  Target,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Pagination from "../../components/common/Pagination";
import CourseMedia from "../../components/common/CourseMedia";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get("/student/stats"),
      api.get("/student/courses/enrolled"),
    ])
      .then(([statsRes, coursesRes]) => {
        if (!alive) return;
        setStats(statsRes.stats || {});
        setCourses(coursesRes.courses || []);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const avgProgress = Math.round(stats.avgProgress || 0);

  const metrics = [
    {
      label: "Enrolled Courses",
      value: stats.enrolledCourses || courses.length || 0,
      icon: BookOpen,
      tone: "text-sky-600 bg-sky-50 ring-sky-100",
    },
    {
      label: "Total Spent",
      value: `₹${stats.totalSpent || 0}`,
      icon: Clock,
      tone: "text-violet-600 bg-violet-50 ring-violet-100",
    },
    {
      label: "Average Progress",
      value: `${avgProgress}%`,
      icon: TrendingUp,
      tone: "text-emerald-600 bg-emerald-50 ring-emerald-100",
    },
    {
      label: "Certificates Earned",
      value: avgProgress >= 100 ? 1 : 0,
      icon: Award,
      tone: "text-amber-600 bg-amber-50 ring-amber-100",
    },
  ];

  // Filtering
  const filteredCourses = useMemo(() => {
    return courses.filter(({ enrollment, course }) => {
      const matchSearch = `${course?.title || ""} ${course?.category || ""} ${
        course?.coach?.name || ""
      }`
        .toLowerCase()
        .includes(search.toLowerCase());

      const progress = Number(enrollment?.progress || 0);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && progress >= 100) ||
        (statusFilter === "inprogress" && progress < 100);

      return matchSearch && matchStatus;
    });
  }, [courses, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filteredCourses.length / pageSize) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCourses.slice(start, start + pageSize);
  }, [filteredCourses, page, pageSize]);

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white lg:grid-cols-[1fr_320px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-400/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-300">
              <GraduationCap size={14} /> Student Learning Hub
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl text-white">
              Welcome back, {user?.name || "Student"}!
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Pick up where you left off, stream high-definition course lessons,
              and achieve your certification goals with top mentors.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/student/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-sky-300"
              >
                <BookOpen size={15} /> Browse All Courses
              </Link>
              <Link
                to="/student/my-learning"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
              >
                My Learning Portal <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Overall Completion
              </span>
              <Target size={18} className="text-sky-300" />
            </div>
            <div className="my-2">
              <p className="text-4xl font-black text-white">{avgProgress}%</p>
              <p className="text-xs text-sky-200 mt-0.5">Across all enrolled subjects</p>
            </div>
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, avgProgress)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, tone }) => (
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
          </div>
        ))}
      </div>

      {/* Active Courses Table */}
      <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              My Active Courses & Learning Status
            </h3>
            <p className="text-xs text-slate-500">
              Current progress, enrolled curriculum modules, and next steps
            </p>
          </div>
          <Link
            to="/student/my-learning"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
          >
            View all courses <ExternalLink size={13} />
          </Link>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search course or mentor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600">
              <Filter size={13} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="inprogress">In Progress (&lt;100%)</option>
                <option value="completed">Completed (100%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Instructor / Coach</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Loading your enrolled courses...
                  </td>
                </tr>
              ) : paginatedCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">
                      No matching courses found
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {courses.length === 0
                        ? "You haven't enrolled in any courses yet."
                        : "Try adjusting your search or status filter."}
                    </p>
                    {courses.length === 0 && (
                      <Link
                        to="/student/courses"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                      >
                        Browse Course Catalog
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedCourses.map(({ enrollment, course }) => {
                  const progress = Number(enrollment?.progress || 0);
                  const isCompleted = progress >= 100;

                  return (
                    <tr
                      key={enrollment.id}
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
                            <span className="inline-block mt-0.5 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                              {course.category || "General"}
                            </span>
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
                              {course.difficulty || "All Levels"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-500">Completed</span>
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
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCompleted ? "bg-emerald-500" : "bg-sky-500"
                              }`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                              : "bg-sky-50 text-sky-700 ring-1 ring-sky-200/50"
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 size={11} /> Completed
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />{" "}
                              In Progress
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/student/learn/${course.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 shadow-sm"
                        >
                          <PlayCircle size={13} /> Continue
                        </Link>
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
            totalItems={filteredCourses.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </section>
    </div>
  );
}
