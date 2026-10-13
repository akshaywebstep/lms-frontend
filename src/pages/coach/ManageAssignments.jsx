import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ClipboardList,
  Clock,
  Download,
  Edit2,
  Eye,
  Filter,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Trash2,
  Upload,
  XCircle,
  Layers,
  Users,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { confirmDialog } from "../../utils/dialogs";
import { formatDate } from "../../utils/formatters";
import { resolveMediaUrl } from "../../utils/media";
import Pagination from "../../components/common/Pagination";

const emptyAssignment = {
  title: "",
  courseId: "",
  dueAt: "",
  description: "",
  maxScore: "100",
  dripDays: "0",
  status: "published",
  attachmentUrl: "",
  attachmentName: "",
};

const dateInputValue = (value) => (value ? String(value).slice(0, 10) : "");

const submissionStatusMeta = (status) => {
  if (status === "graded")
    return {
      label: "Accepted",
      icon: CheckCircle,
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
    };
  if (status === "pending")
    return {
      label: "Rejected",
      icon: XCircle,
      className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/50",
    };
  return {
    label: "Submitted",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
  };
};

export default function ManageAssignments() {
  const [tab, setTab] = useState("assignments");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [modal, setModal] = useState({ mode: null, assignment: null });
  const [reviewSubmission, setReviewSubmission] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination for assignments
  const [assignmentPage, setAssignmentPage] = useState(1);
  const assignmentPageSize = 10;

  // Pagination for submissions
  const [submissionPage, setSubmissionPage] = useState(1);
  const submissionPageSize = 10;

  const load = async () => {
    try {
      setLoading(true);
      const [assignmentRes, courseRes] = await Promise.all([
        api.get("/coach/assignments"),
        api.get("/coach/courses"),
      ]);
      setAssignments(assignmentRes.assignments || []);
      setSubmissions(assignmentRes.submissions || []);
      setCourses(courseRes.courses || []);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  const courseOptions = useMemo(
    () => [
      "All Courses",
      ...new Set(courses.map((c) => c.title).filter(Boolean)),
    ],
    [courses]
  );

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    const q = search.toLowerCase();
    return assignments.filter((a) => {
      const matchSearch = `${a.title || ""} ${a.description || ""} ${
        a.attachmentName || ""
      }`
        .toLowerCase()
        .includes(q);
      const matchCourse =
        courseFilter === "All Courses" || a.course?.title === courseFilter;
      return matchSearch && matchCourse;
    });
  }, [assignments, search, courseFilter]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    const q = search.toLowerCase();
    return submissions.filter((s) => {
      const matchSearch = `${s.student_name || ""} ${s.assignment_title || ""} ${
        s.course_title || ""
      }`
        .toLowerCase()
        .includes(q);
      const matchCourse =
        courseFilter === "All Courses" || s.course_title === courseFilter;
      return matchSearch && matchCourse;
    });
  }, [submissions, search, courseFilter]);

  useEffect(() => {
    setAssignmentPage(1);
    setSubmissionPage(1);
  }, [search, courseFilter, tab]);

  const totalAssignmentPages =
    Math.ceil(filteredAssignments.length / assignmentPageSize) || 1;
  const paginatedAssignments = useMemo(() => {
    const start = (assignmentPage - 1) * assignmentPageSize;
    return filteredAssignments.slice(start, start + assignmentPageSize);
  }, [filteredAssignments, assignmentPage, assignmentPageSize]);

  const totalSubmissionPages =
    Math.ceil(filteredSubmissions.length / submissionPageSize) || 1;
  const paginatedSubmissions = useMemo(() => {
    const start = (submissionPage - 1) * submissionPageSize;
    return filteredSubmissions.slice(start, start + submissionPageSize);
  }, [filteredSubmissions, submissionPage, submissionPageSize]);

  // Stats
  const stats = useMemo(() => {
    const total = assignments.length;
    const published = assignments.filter((a) => a.status === "published").length;
    const totalSubs = submissions.length;
    const reviewed = submissions.filter(
      (s) => s.status === "graded" || s.status === "pending"
    ).length;
    return { total, published, totalSubs, reviewed };
  }, [assignments, submissions]);

  const openCreate = () => setModal({ mode: "create", assignment: null });
  const openView = (assignment) => setModal({ mode: "view", assignment });
  const openEdit = (assignment) => setModal({ mode: "edit", assignment });
  const closeModal = () => setModal({ mode: null, assignment: null });

  const deleteAssignment = async (id) => {
    const ok = await confirmDialog({
      title: "Delete assignment?",
      message: "This assignment will be removed for students.",
      confirmText: "Delete Assignment",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/coach/assignments/${id}`);
      toast.success("Assignment deleted");
      load();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Assignments & Student Submissions
            </h1>
            <p className="text-xs text-slate-500">
              Create homework assignments, upload reference files, and grade submissions
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Assignments",
            value: stats.total,
            icon: Layers,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Published Live",
            value: stats.published,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Submissions Received",
            value: stats.totalSubs,
            icon: Users,
            color: "text-sky-600",
            bg: "bg-sky-50",
          },
          {
            label: "Reviewed & Evaluated",
            value: stats.reviewed,
            icon: Clock,
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

      {/* Tabs Switcher */}
      <div className="flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setTab("assignments")}
          className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition ${
            tab === "assignments"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Assignments List ({assignments.length})
        </button>
        <button
          onClick={() => setTab("submissions")}
          className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition ${
            tab === "submissions"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Student Submissions ({submissions.length})
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={
                tab === "assignments"
                  ? "Search assignment title or file..."
                  : "Search student or assignment..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Tab 1: Assignments Table */}
        {tab === "assignments" && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Assignment</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Attachment</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Submissions</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading assignments...
                    </td>
                  </tr>
                ) : paginatedAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <ClipboardList size={36} className="mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">
                        No assignments found
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedAssignments.map((a) => {
                    const attachmentUrl = resolveMediaUrl(a.attachmentUrl);
                    return (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <ClipboardList
                              size={16}
                              className="flex-shrink-0 text-indigo-500"
                            />
                            <span className="font-bold text-slate-900">
                              {a.title}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                            {a.course?.title || "-"}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {attachmentUrl ? (
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                            >
                              <Paperclip size={13} />{" "}
                              {a.attachmentName || "View File"}
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-500">
                          {a.dueAt ? formatDate(a.dueAt) : "-"}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{
                                  width: `${
                                    a.total
                                      ? (a.submissions / a.total) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="font-bold text-slate-700">
                              {a.submissions || 0}/{a.total || 0}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              a.status === "published"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                                : a.status === "archived"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openView(a)}
                              className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 transition"
                              title="View"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => openEdit(a)}
                              className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => deleteAssignment(a.id)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Submissions Table */}
        {tab === "submissions" && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Assignment / Course</th>
                  <th className="py-3 px-4">Submitted On</th>
                  <th className="py-3 px-4">Answer</th>
                  <th className="py-3 px-4">File</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading submissions...
                    </td>
                  </tr>
                ) : paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users size={36} className="mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">
                        No submissions yet
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((s) => {
                    const fileUrl = resolveMediaUrl(s.file_url || s.fileUrl);
                    const meta = submissionStatusMeta(s.status);
                    const Icon = meta.icon;
                    const maxScore =
                      s.assignment_max_score ?? s.assignmentMaxScore;

                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                              {(s.student_name || "S")[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {s.student_name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {s.student_email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">
                            {s.assignment_title}
                          </p>
                          <span className="text-[10px] text-indigo-600 font-semibold">
                            {s.course_title}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500">
                          {s.submitted_at ? formatDate(s.submitted_at) : "-"}
                        </td>

                        <td className="py-3 px-4 max-w-[200px]">
                          <p className="line-clamp-1 text-slate-600">
                            {s.answer_text || "-"}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:underline"
                            >
                              <Paperclip size={12} /> Open File
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-black">
                          <span
                            className={
                              s.score !== null && s.score !== undefined
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }
                          >
                            {s.score ?? "-"}
                            {maxScore ? (
                              <span className="text-slate-400 font-normal">
                                /{Number(maxScore)}
                              </span>
                            ) : null}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${meta.className}`}
                          >
                            <Icon size={11} /> {meta.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setReviewSubmission(s)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <MessageSquare size={12} /> Review
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Always Visible */}
        <div className="pt-2">
          {tab === "assignments" ? (
            <Pagination
              currentPage={assignmentPage}
              totalPages={totalAssignmentPages}
              totalItems={filteredAssignments.length}
              pageSize={assignmentPageSize}
              onPageChange={setAssignmentPage}
            />
          ) : (
            <Pagination
              currentPage={submissionPage}
              totalPages={totalSubmissionPages}
              totalItems={filteredSubmissions.length}
              pageSize={submissionPageSize}
              onPageChange={setSubmissionPage}
            />
          )}
        </div>
      </div>

      {reviewSubmission && (
        <ReviewSubmissionModal
          submission={reviewSubmission}
          onClose={() => setReviewSubmission(null)}
          onSaved={() => {
            setReviewSubmission(null);
            load();
          }}
        />
      )}

      {modal.mode === "view" && (
        <AssignmentViewModal
          assignment={modal.assignment}
          onClose={closeModal}
        />
      )}
      {(modal.mode === "create" || modal.mode === "edit") && (
        <AssignmentFormModal
          mode={modal.mode}
          assignment={modal.assignment}
          onClose={closeModal}
          courses={courses}
          onSaved={load}
        />
      )}
    </div>
  );
}

function ReviewSubmissionModal({ submission, onClose, onSaved }) {
  const maxScore = Number(
    submission.assignment_max_score ??
      submission.assignmentMaxScore ??
      100
  );
  const [score, setScore] = useState(submission.score ?? maxScore);
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [saving, setSaving] = useState(false);
  const fileUrl = resolveMediaUrl(submission.file_url || submission.fileUrl);

  const submitReview = async (decision) => {
    if (
      decision === "accept" &&
      (score === "" || Number.isNaN(Number(score)))
    )
      return toast.error("Score is required to accept");
    if (
      decision === "accept" &&
      (Number(score) < 0 || Number(score) > maxScore)
    )
      return toast.error("Score must be between 0 and " + maxScore);
    if (decision === "reject" && !feedback.trim())
      return toast.error("Feedback is required to reject");

    setSaving(true);
    try {
      await api.patch(
        "/coach/assignments/submissions/" + submission.id + "/review",
        {
          decision,
          score: decision === "accept" ? Number(score) : null,
          feedback,
        }
      );
      toast.success(
        decision === "accept"
          ? "Submission accepted"
          : "Submission rejected"
      );
      onSaved();
    } catch (err) {
      toast.error(err?.message || "Review failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex flex-col max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl text-left">
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="font-bold text-slate-900">Review Submission</h3>
            <p className="text-xs text-slate-400">
              {submission.student_name} - {submission.assignment_title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xl text-slate-400 hover:text-slate-600"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 p-6">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Course
              </p>
              <p className="mt-1 font-bold text-slate-800">
                {submission.course_title || "-"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Submitted Date
              </p>
              <p className="mt-1 font-bold text-slate-800">
                {submission.submitted_at
                  ? formatDate(submission.submitted_at)
                  : "-"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">
              Student Answer
            </p>
            <p className="mt-1 min-h-[80px] whitespace-pre-wrap rounded-xl border bg-slate-50 p-4 text-xs leading-5 text-slate-700">
              {submission.answer_text || "No written answer provided"}
            </p>
          </div>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
            >
              <Paperclip size={14} /> Open submitted attachment
            </a>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr]">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Score
              </label>
              <input
                type="number"
                min="0"
                max={maxScore}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Max score: {maxScore}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Mentor Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Write constructive review remarks for the learner..."
              />
            </div>
          </div>
        </div>
        <div className="shrink-0 flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => submitReview("reject")}
            disabled={saving}
            className="flex-1 rounded-xl bg-red-50 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
          >
            Reject
          </button>
          <button
            onClick={() => submitReview("accept")}
            disabled={saving}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 shadow-sm"
          >
            Accept & Grade
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignmentViewModal({ assignment, onClose }) {
  const fileUrl = resolveMediaUrl(assignment?.attachmentUrl);
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm text-left">
      <div className="flex flex-col max-h-[86vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">Assignment Details</h3>
          <button
            onClick={onClose}
            className="text-xl text-slate-400 hover:text-slate-600"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 p-6">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">
              Title
            </p>
            <h4 className="mt-1 text-lg font-black text-slate-900">
              {assignment?.title}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Course
              </p>
              <p className="mt-1 font-bold text-slate-800">
                {assignment?.course?.title || "-"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Due Date
              </p>
              <p className="mt-1 font-bold text-slate-800">
                {assignment?.dueAt ? formatDate(assignment.dueAt) : "-"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">
              Question / Instructions
            </p>
            <p className="mt-2 whitespace-pre-wrap rounded-xl border bg-slate-50 p-4 text-xs leading-5 text-slate-700">
              {assignment?.description || "No instructions added"}
            </p>
          </div>
          {fileUrl ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-[10px] font-bold uppercase text-indigo-500">
                Attached Reference File
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm"
                >
                  <Paperclip size={13} />{" "}
                  {assignment?.attachmentName || "View File"}
                </a>
                <a
                  href={fileUrl}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                >
                  <Download size={13} /> Download
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 text-center">
              No attachment attached
            </div>
          )}
        </div>
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignmentFormModal({
  mode,
  assignment,
  onClose,
  courses,
  onSaved,
}) {
  const [form, setForm] = useState(() => ({
    ...emptyAssignment,
    courseId: courses[0]?.id || "",
    ...(assignment
      ? {
          title: assignment.title || "",
          courseId: assignment.courseId || "",
          dueAt: dateInputValue(assignment.dueAt),
          description: assignment.description || "",
          maxScore: String(assignment.maxScore || 100),
          dripDays: String(assignment.dripDays || 0),
          status: assignment.status || "published",
          attachmentUrl: assignment.attachmentUrl || "",
          attachmentName: assignment.attachmentName || "",
        }
      : {}),
  }));
  const [attachment, setAttachment] = useState(null);
  const [saving, setSaving] = useState(false);
  const isEdit = mode === "edit";
  const currentFileUrl = resolveMediaUrl(form.attachmentUrl);
  const change = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const uploadAttachment = async () => {
    if (!attachment)
      return {
        url: form.attachmentUrl || "",
        name: form.attachmentName || "",
      };
    const data = new FormData();
    data.append("file", attachment);
    const res = await api.post("/upload/document", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return {
      url: res.upload?.url || res.material?.url || "",
      name:
        res.upload?.name ||
        res.material?.name ||
        attachment.name,
    };
  };

  const submit = async () => {
    if (!form.title || !form.courseId)
      return toast.error("Title and course required");
    if (!form.description.trim() && !attachment && !form.attachmentUrl)
      return toast.error("Add instructions or attach a file");
    setSaving(true);
    try {
      const uploaded = await uploadAttachment();
      const payload = {
        ...form,
        attachmentUrl: uploaded.url,
        attachmentName: uploaded.name,
        maxScore: Number(form.maxScore || 100),
        dripDays: Number(form.dripDays || 0),
      };
      if (isEdit)
        await api.put(`/coach/assignments/${assignment.id}`, payload);
      else await api.post("/coach/assignments", payload);
      toast.success(
        isEdit ? "Assignment updated" : "Assignment created"
      );
      onClose();
      onSaved();
    } catch (err) {
      toast.error(err?.message || "Failed to save assignment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm text-left">
      <div className="flex flex-col max-h-[86vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">
            {isEdit ? "Edit Assignment" : "New Assignment"}
          </h3>
          <button
            onClick={onClose}
            className="text-xl text-slate-400 hover:text-slate-600"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={change}
              placeholder="e.g. Week 1 Capstone Project"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Course
              </label>
              <select
                name="courseId"
                value={form.courseId}
                onChange={change}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Due Date
              </label>
              <input
                type="date"
                name="dueAt"
                value={form.dueAt}
                onChange={change}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Question / Instructions
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={change}
              rows={4}
              placeholder="Write the questions, submission guidelines, or structure..."
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          {currentFileUrl && !attachment && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-[10px] font-bold uppercase text-indigo-500">
                Current attached file
              </p>
              <a
                href={currentFileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700"
              >
                <Paperclip size={13} />{" "}
                {form.attachmentName || "Open file"}
              </a>
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 hover:border-indigo-400 hover:bg-indigo-50/40">
            <Upload size={20} className="text-indigo-500" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-800">
                {attachment
                  ? attachment.name
                  : currentFileUrl
                  ? "Replace attached file"
                  : "Attach reference document or rubric"}
              </span>
              <span className="text-[10px] text-slate-400">
                PDF, DOC, ZIP, PPT, or study material
              </span>
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) =>
                setAttachment(e.target.files?.[0] || null)
              }
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Max Score
              </label>
              <input
                name="maxScore"
                type="number"
                value={form.maxScore}
                onChange={change}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-bold text-slate-700"
                title="Days after enrollment"
              >
                Drip Days
              </label>
              <input
                name="dripDays"
                type="number"
                value={form.dripDays}
                onChange={change}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={change}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
        <div className="shrink-0 flex gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 shadow-sm"
          >
            {saving
              ? "Saving..."
              : isEdit
              ? "Update Assignment"
              : "Create Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
