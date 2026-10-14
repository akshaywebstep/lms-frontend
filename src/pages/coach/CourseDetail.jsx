import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  DollarSign,
  Eye,
  HelpCircle,
  PlayCircle,
  PlusCircle,
  Tag,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import RichTextContent from "../../components/common/RichTextContent";
import CourseMedia from "../../components/common/CourseMedia";
import LessonPreviewModal from "../../components/common/LessonPreviewModal";

const tabs = ["Overview", "Lessons", "Quizzes", "Assignments", "Students"];

export default function CourseDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewLesson, setPreviewLesson] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const [courseRes, lessonRes, quizRes, assignmentRes, studentRes] =
          await Promise.all([
            api.get(`/coach/courses/${id}`),
            api.get(`/coach/lessons?courseId=${encodeURIComponent(id)}`),
            api.get("/coach/quizzes"),
            api.get("/coach/assignments"),
            api.get("/coach/students"),
          ]);
        if (!alive) return;
        setCourse(courseRes.course || null);
        setLessons(lessonRes.lessons || []);
        setQuizzes(
          (quizRes.quizzes || []).filter(
            (q) => String(q.courseId) === String(id)
          )
        );
        setAssignments(
          (assignmentRes.assignments || []).filter(
            (item) => String(item.courseId) === String(id)
          )
        );
        setStudents(
          (studentRes.students || []).filter(
            (row) => String(row.course?.id) === String(id)
          )
        );
      } catch (err) {
        toast.error(err?.message || "Failed to load course detail");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const avgProgress = useMemo(
    () =>
      students.length
        ? Math.round(
            students.reduce(
              (sum, row) => sum + Number(row.enrollment?.progress || 0),
              0
            ) / students.length
          )
        : 0,
    [students]
  );

  if (loading)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
        Loading course details...
      </div>
    );
  if (!course)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
        Course not found
      </div>
    );

  const stats = [
    {
      label: "Enrolled Students",
      value: students.length || course.students || 0,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50 ring-1 ring-indigo-100",
    },
    {
      label: "Lessons Live",
      value: lessons.length,
      icon: PlayCircle,
      color: "text-blue-600",
      bg: "bg-blue-50 ring-1 ring-blue-100",
    },
    {
      label: "Course Price",
      value: formatCurrency(course.price || 0, course.currency || "INR"),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50 ring-1 ring-emerald-100",
    },
    {
      label: "Quizzes & Tests",
      value: quizzes.length,
      icon: HelpCircle,
      color: "text-amber-600",
      bg: "bg-amber-50 ring-1 ring-amber-100",
    },
  ];

  return (
    <div className="max-w-6xl space-y-6 text-left">
      {/* Course Header */}
      <div className="flex items-start gap-4">
        <Link
          to="/coach/my-courses"
          className="mt-1 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900">{course.title}</h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                course.status === "published"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
              }`}
            >
              {course.status}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <Tag size={12} className="text-slate-400" /> ID: {course.id}
            </span>
            <span>Category: {course.category || "General"}</span>
            <span>Level: {course.difficulty || "All Levels"}</span>
            <span>Language: {course.language || "English"}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className={`${s.bg} rounded-xl p-2.5`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className="text-lg font-black text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === tab
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="aspect-video overflow-hidden rounded-xl bg-slate-950">
              <CourseMedia course={course} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-800">
                Course Description
              </h3>
              <RichTextContent html={course.description} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-400">
                  Language
                </p>
                <p className="mt-1 font-bold text-slate-800">{course.language}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-400">
                  Avg Progress
                </p>
                <p className="mt-1 font-bold text-slate-800">{avgProgress}%</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-400">
                  Direct Price
                </p>
                <p className="mt-1 font-bold text-emerald-600">
                  {formatCurrency(course.price || 0, course.currency || "INR")}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/coach/manage-lessons"
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <BookOpen size={16} className="text-indigo-600" />
                <span className="text-xs font-bold">Manage Lessons</span>
              </Link>
              <Link
                to="/coach/quizzes"
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-slate-700 transition-colors hover:border-amber-200 hover:bg-amber-50/50"
              >
                <HelpCircle size={16} className="text-amber-600" />
                <span className="text-xs font-bold">Manage Quizzes</span>
              </Link>
              <Link
                to="/coach/assignments"
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-slate-700 transition-colors hover:border-rose-200 hover:bg-rose-50/50"
              >
                <ClipboardList size={16} className="text-rose-600" />
                <span className="text-xs font-bold">Manage Assignments</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Lessons */}
      {activeTab === "Lessons" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">
              Showing {lessons.length} lessons in this course
            </p>
            <Link
              to="/coach/manage-lessons"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              <PlusCircle size={14} /> Add Lesson
            </Link>
          </div>
          <Table
            headers={["Lesson Title", "Type", "Duration", "Status", "Action"]}
            empty="No lessons created yet for this course"
            rows={lessons.map((lesson) => [
              <span
                key="title"
                onClick={() => setPreviewLesson(lesson)}
                className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition"
                title="Click to preview lesson"
              >
                {lesson.title}
              </span>,
              <span key="type" className="capitalize">{lesson.contentType || "Video"}</span>,
              <span key="dur">{`${lesson.durationMinutes || 0} min`}</span>,
              <span
                key="stat"
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  lesson.status === "published"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {lesson.status}
              </span>,
              <button
                key="act"
                type="button"
                onClick={() => setPreviewLesson(lesson)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition shadow-sm"
              >
                <Eye size={12} /> Preview
              </button>,
            ])}
          />
        </div>
      )}

      {/* Tab: Quizzes */}
      {activeTab === "Quizzes" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">
              Showing {quizzes.length} interactive quizzes for this course
            </p>
            <Link
              to="/coach/create-quiz"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400"
            >
              <PlusCircle size={14} /> Create Quiz
            </Link>
          </div>
          <Table
            headers={["Quiz Title", "Passing Score", "Drip Days", "Status", "Action"]}
            empty="No quizzes added to this course yet"
            rows={quizzes.map((quiz) => [
              quiz.title,
              `${quiz.passingScore || 60}%`,
              quiz.dripDays ? `Day ${quiz.dripDays}` : "Instant Access",
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  quiz.status === "published"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {quiz.status}
              </span>,
              <Link
                to={`/coach/quizzes/${quiz.id}/edit`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Edit Quiz
              </Link>,
            ])}
          />
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === "Assignments" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">
              Showing {assignments.length} assignments in this course
            </p>
            <Link
              to="/coach/assignments"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              <PlusCircle size={14} /> Manage Assignments
            </Link>
          </div>
          <Table
            headers={["Assignment", "Due Date", "Submissions", "Status"]}
            empty="No assignments configured for this course"
            rows={assignments.map((assignment) => [
              assignment.title,
              assignment.dueAt ? formatDate(assignment.dueAt) : "No Deadline",
              `${assignment.submissions || 0}/${assignment.total || 0}`,
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  assignment.status === "published"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {assignment.status}
              </span>,
            ])}
          />
        </div>
      )}

      {/* Tab: Students */}
      {activeTab === "Students" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-medium">
            Showing {students.length} enrolled students
          </p>
          <Table
            headers={["Student", "Email", "Progress", "Enrollment Status"]}
            empty="No students have enrolled in this course yet"
            rows={students.map((row) => [
              row.student?.name || "Student",
              row.student?.email || "-",
              `${Number(row.enrollment?.progress || 0)}%`,
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  row.enrollment?.status === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {row.enrollment?.status || "Active"}
              </span>,
            ])}
          />
        </div>
      )}

      {previewLesson && (
        <LessonPreviewModal
          lessonId={previewLesson.id}
          lesson={previewLesson}
          onClose={() => setPreviewLesson(null)}
        />
      )}
    </div>
  );
}

function Table({ headers, rows, empty }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-5 py-3.5">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="py-10 text-center text-slate-400"
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/60 transition-colors">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-5 py-3.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
