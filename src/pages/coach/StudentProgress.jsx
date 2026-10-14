import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Play,
  FileText,
  HelpCircle,
  Target,
  Calendar,
  BarChart2,
  Mail,
  Award,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { resolveMediaUrl } from "../../utils/media";

export default function StudentProgress() {
  const params = useParams();
  const studentId = params.studentId || params.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const courseIdParam = searchParams.get("courseId") || "";
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(courseIdParam);

  const fetchProgress = async (cid = selectedCourseId) => {
    try {
      setLoading(true);
      setError(null);
      const query = cid ? `?courseId=${cid}` : "";
      const res = await api.get(`/coach/students/${studentId}/progress${query}`);
      const data = res?.data || res;
      setStudentData(data);
      if (data?.course?.id && !cid) {
        setSelectedCourseId(data.course.id);
      }
    } catch (err) {
      console.error("Failed to load student progress:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to load student progress.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchProgress(courseIdParam);
    }
  }, [studentId, courseIdParam]);

  const handleCourseChange = (newCourseId) => {
    setSelectedCourseId(newCourseId);
    setSearchParams(newCourseId ? { courseId: newCourseId } : {});
    fetchProgress(newCourseId);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "in-progress":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "graded":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "submitted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "pending":
      case "not-started":
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm border border-slate-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-slate-600">Loading student progress report...</p>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
        <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Unable to Load Progress</h3>
        <p className="mt-1 text-sm text-slate-500">{error || "Student record not found."}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigate("/coach/my-students")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Back to Students
          </button>
          <button
            onClick={() => fetchProgress(selectedCourseId)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { student, course, progress, lessons = [], quizzes = [], assignments = [], allCourses = [] } = studentData;

  return (
    <div className="space-y-6 text-left">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => navigate("/coach/my-students")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Back to Students list"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{student?.name}</h1>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                Student Progress
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {course?.title || "Course"} &middot; Progress and Completion Report
            </p>
          </div>
        </div>

        {/* Course Switcher (if enrolled in multiple) */}
        {allCourses.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Course:</span>
            <select
              value={selectedCourseId || course?.id}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.progress || 0}%)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Student Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-2xl font-black text-white shadow-md">
              {resolveMediaUrl(student?.avatar) ? (
                <img
                  src={resolveMediaUrl(student.avatar)}
                  alt={student.name}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <span>{(student?.name || "S")[0].toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">{student?.name}</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <Mail size={13} className="text-slate-400" />
                <span>{student?.email}</span>
                {student?.phone && (
                  <>
                    <span>&bull;</span>
                    <span>{student.phone}</span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  Enrolled:{" "}
                  <strong className="text-slate-700 font-semibold">
                    {student?.enrolledDate ? new Date(student.enrolledDate).toLocaleDateString() : "N/A"}
                  </strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  Last Active:{" "}
                  <strong className="text-slate-700 font-semibold">
                    {student?.lastActive ? new Date(student.lastActive).toLocaleDateString() : "N/A"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Overall Progress Stat Box */}
          <div className="flex items-center gap-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:min-w-[200px] justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-900/70">
                Overall Progress
              </p>
              <p className="text-3xl font-black text-indigo-700 mt-0.5">
                {progress?.overallPercent || 0}%
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {progress?.lessonsCompleted || 0} of {course?.totalLessons || 0} lessons done
              </p>
            </div>
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-xs">
              <Award size={26} className="text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 6 Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          {
            icon: BookOpen,
            label: "Lessons Done",
            value: `${progress?.lessonsCompleted || 0}/${course?.totalLessons || 0}`,
            color: "text-indigo-600 bg-indigo-50",
          },
          {
            icon: HelpCircle,
            label: "Quizzes Done",
            value: `${progress?.quizzesCompleted || 0}/${course?.totalQuizzes || 0}`,
            color: "text-blue-600 bg-blue-50",
          },
          {
            icon: FileText,
            label: "Assignments",
            value: `${progress?.assignmentsSubmitted || 0}/${course?.totalAssignments || 0}`,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            icon: Target,
            label: "Avg Quiz Score",
            value: `${progress?.avgQuizScore || 0}%`,
            color: "text-amber-600 bg-amber-50",
          },
          {
            icon: Clock,
            label: "Time Spent",
            value: progress?.timeSpent || "0m",
            color: "text-purple-600 bg-purple-50",
          },
          {
            icon: TrendingUp,
            label: "Day Streak",
            value: `${progress?.streak || 1} day${progress?.streak === 1 ? "" : "s"}`,
            color: "text-rose-600 bg-rose-50",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
              <Icon size={16} />
            </div>
            <div className="text-lg font-black text-slate-900 mt-1">{value}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-sm">
        {[
          { id: "overview", label: "Overview", count: null },
          { id: "lessons", label: "Lessons", count: lessons.length },
          { id: "quizzes", label: "Quizzes", count: quizzes.length },
          { id: "assignments", label: "Assignments", count: assignments.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-600" />
              Progress Breakdown
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {course?.title}
            </span>
          </div>

          <div className="space-y-5">
            {[
              {
                label: "Lessons Completed",
                value: progress?.lessonsCompleted || 0,
                max: course?.totalLessons || 0,
                color: "bg-indigo-600",
                textCol: "text-indigo-700",
              },
              {
                label: "Quizzes Completed",
                value: progress?.quizzesCompleted || 0,
                max: course?.totalQuizzes || 0,
                color: "bg-blue-600",
                textCol: "text-blue-700",
              },
              {
                label: "Assignments Submitted",
                value: progress?.assignmentsSubmitted || 0,
                max: course?.totalAssignments || 0,
                color: "bg-emerald-600",
                textCol: "text-emerald-700",
              },
            ].map(({ label, value, max, color, textCol }) => {
              const pct = max > 0 ? Math.round((value / max) * 100) : 0;
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{label}</span>
                    <span className={textCol}>
                      {value} / {max} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Lessons */}
      {activeTab === "lessons" && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-black text-slate-900 text-sm">Course Lessons Checklist</h3>
          </div>
          {lessons.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No lessons created for this course yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lessons.map((lesson, idx) => (
                <div
                  key={lesson.id || idx}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                        lesson.status === "completed"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : lesson.status === "in-progress"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}
                    >
                      {lesson.status === "completed" ? (
                        <CheckCircle size={17} />
                      ) : lesson.status === "in-progress" ? (
                        <Play size={16} />
                      ) : (
                        <BookOpen size={16} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {idx + 1}. {lesson.title}
                      </p>
                      {lesson.completedAt ? (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Completed: {new Date(lesson.completedAt).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {lesson.status === "in-progress" ? "Currently in progress" : "Not yet started"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" /> {lesson.duration || "0m"}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize ${getStatusBadge(
                        lesson.status
                      )}`}
                    >
                      {lesson.status === "in-progress" ? "In Progress" : lesson.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Quizzes */}
      {activeTab === "quizzes" && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-black text-slate-900 text-sm">Course Quizzes & Assessments</h3>
          </div>
          {quizzes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No quizzes created for this course yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {quizzes.map((quiz, idx) => (
                <div
                  key={quiz.id || idx}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                      <HelpCircle size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate">{quiz.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {quiz.submittedAt
                          ? `Submitted: ${new Date(quiz.submittedAt).toLocaleDateString()}`
                          : "Not attempted yet"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {quiz.score !== null ? (
                      <div className="text-right">
                        <p
                          className={`text-xs font-black ${
                            quiz.score >= 80
                              ? "text-emerald-600"
                              : quiz.score >= 60
                              ? "text-amber-600"
                              : "text-rose-600"
                          }`}
                        >
                          {quiz.score}/{quiz.maxScore}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {Math.round((quiz.score / quiz.maxScore) * 100)}% Score
                        </p>
                      </div>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === "assignments" && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-black text-slate-900 text-sm">Course Assignments & Tasks</h3>
          </div>
          {assignments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No assignments assigned to this course yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignments.map((assignment, idx) => (
                <div
                  key={assignment.id || idx}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {assignment.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {assignment.submittedAt
                          ? `Submitted: ${new Date(assignment.submittedAt).toLocaleDateString()}`
                          : "Not submitted"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize ${getStatusBadge(
                        assignment.status
                      )}`}
                    >
                      {assignment.status}
                    </span>
                    {assignment.grade && (
                      <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-black text-indigo-700 border border-indigo-200">
                        {assignment.grade}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
