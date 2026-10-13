import { useEffect, useMemo, useState } from "react";
import {
  BarChart2,
  CheckCircle,
  Edit2,
  HelpCircle,
  Plus,
  Search,
  Trash2,
  Users,
  Filter,
  List,
  Grid,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { confirmDialog } from "../../utils/dialogs";
import Pagination from "../../components/common/Pagination";

export default function ManageQuizzes() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = viewMode === "grid" ? 6 : 10;

  const load = async () => {
    try {
      setLoading(true);
      const [courseRes, quizRes] = await Promise.all([
        api.get("/coach/courses"),
        api.get("/coach/quizzes"),
      ]);
      setCourses(courseRes.courses || []);
      setQuizzes(quizRes.quizzes || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      quizzes.filter((quiz) => {
        const matchSearch = `${quiz.title || ""} ${quiz.description || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchCourse =
          courseId === "all" || String(quiz.courseId) === String(courseId);
        return matchSearch && matchCourse;
      }),
    [quizzes, search, courseId]
  );

  useEffect(() => {
    setPage(1);
  }, [search, courseId, viewMode]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedQuizzes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const remove = async (id) => {
    const ok = await confirmDialog({
      title: "Delete quiz?",
      message: "This quiz and all associated questions will be removed.",
      confirmText: "Delete Quiz",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/coach/quizzes/${id}`);
      toast.success("Quiz deleted");
      load();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const published = quizzes.filter((q) => q.status === "published").length;
  const attempts = quizzes.reduce(
    (sum, q) => sum + Number(q.attempts || 0),
    0
  );
  const avgScore = quizzes.length
    ? Math.round(
        quizzes.reduce((sum, q) => sum + Number(q.avgScore || 0), 0) /
          quizzes.length
      )
    : 0;

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <HelpCircle size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Quizzes & Assessments
            </h1>
            <p className="text-xs text-slate-500">
              Create multiple-choice questions, set pass marks, and review learner performance
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/coach/create-quiz")}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={16} /> Create New Quiz
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Quizzes",
            value: quizzes.length,
            icon: Layers,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Published Live",
            value: published,
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Total Attempts",
            value: attempts,
            icon: Users,
            color: "text-sky-600",
            bg: "bg-sky-50",
          },
          {
            label: "Average Score",
            value: `${avgScore}%`,
            icon: BarChart2,
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

      {/* Quizzes Table Card */}
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
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600">
              <Filter size={13} className="text-slate-400" />
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* View Switcher */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table view"
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "table"
                    ? "bg-white text-indigo-600 shadow-sm"
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
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Grid size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Table */}
        {viewMode === "table" ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Quiz Title</th>
                  <th className="py-3 px-4">Associated Course</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4">Pass Score</th>
                  <th className="py-3 px-4">Attempts / Avg</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading quizzes...
                    </td>
                  </tr>
                ) : paginatedQuizzes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <HelpCircle size={36} className="mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">
                        No quizzes found
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Create quizzes to evaluate student mastery.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedQuizzes.map((quiz) => (
                    <tr
                      key={quiz.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <HelpCircle size={15} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {quiz.title}
                            </p>
                            <p className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">
                              {quiz.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          {quiz.course?.title || "Course"}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-700">
                        {quiz.questions || 0} questions
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {quiz.passingScore || 50}%
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">
                          {quiz.attempts || 0}
                        </span>{" "}
                        <span className="text-[10px] text-slate-400">
                          (Avg {Math.round(quiz.avgScore || 0)}%)
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            quiz.status === "published"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50"
                          }`}
                        >
                          {quiz.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              navigate(`/coach/quizzes/${quiz.id}/edit`)
                            }
                            className="rounded-lg border border-slate-200 p-1.5 text-indigo-600 hover:bg-indigo-50 transition"
                            title="Edit Quiz"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => remove(quiz.id)}
                            className="rounded-lg border border-red-100 p-1.5 text-red-600 hover:bg-red-50 transition"
                            title="Delete Quiz"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* View Mode: Cards */
          <div className="grid gap-4 sm:grid-cols-2">
            {paginatedQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                    <HelpCircle size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {quiz.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          quiz.status === "published"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {quiz.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {quiz.description || "No description"}
                    </p>
                    <p className="text-[10px] font-bold text-indigo-600 mt-0.5">
                      {quiz.course?.title || "Course"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center text-[10px]">
                  <div>
                    <p className="font-bold text-slate-800">
                      {quiz.questions || 0}
                    </p>
                    <p className="text-slate-400">Questions</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      {quiz.attempts || 0}
                    </p>
                    <p className="text-slate-400">Attempts</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      {Math.round(quiz.avgScore || 0)}%
                    </p>
                    <p className="text-slate-400">Avg Score</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      {quiz.passingScore || 50}%
                    </p>
                    <p className="text-slate-400">Pass</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => navigate(`/coach/quizzes/${quiz.id}/edit`)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => remove(quiz.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
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
