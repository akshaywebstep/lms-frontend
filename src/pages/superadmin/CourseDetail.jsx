import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Layers,
  ListChecks,
  Mail,
  PlayCircle,
  Save,
  ShieldCheck,
  Tag,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import RichTextContent from "../../components/common/RichTextContent";
import CourseMedia from "../../components/common/CourseMedia";
import LessonPreviewModal from "../../components/common/LessonPreviewModal";

const tabs = [
  { id: "overview", label: "Overview & Details", icon: FileText },
  { id: "curriculum", label: "Curriculum & Lessons", icon: BookOpen },
  { id: "coach", label: "Coach Profile", icon: User },
];

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [form, setForm] = useState({ status: "", price: "" });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewLesson, setPreviewLesson] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/courses/${id}`);
      const c = res.course || null;
      setCourse(c);
      setForm({
        status: c?.status || "draft",
        price: String(c?.price ?? ""),
      });
    } catch (err) {
      toast.error(err?.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const isDirty =
    course &&
    (form.status !== course.status ||
      Number(form.price || 0) !== Number(course.price || 0));

  const save = async () => {
    if (!course) return;
    setSaving(true);
    try {
      const res = await api.put(`/admin/courses/${id}`, {
        ...course,
        status: form.status,
        price: Number(form.price || 0),
      });
      setCourse(res.course || course);
      toast.success("Course settings updated successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    if (!course) return;
    setForm({
      status: course.status || "draft",
      price: String(course.price ?? ""),
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-500 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium">Loading course information...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
        <p className="text-base font-bold text-slate-700">Course not found</p>
        <Link
          to="/admin/courses"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={14} /> Back to Courses
        </Link>
      </div>
    );
  }

  const lessons = course.lessons || [];
  const outcomes = course.outcomes || [];
  const requirements = course.requirements || [];

  const stats = [
    {
      label: "Enrolled Students",
      value: course.studentsCount || course.students || 0,
      sub: "Active enrolled learners",
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100",
    },
    {
      label: "Lifetime Revenue",
      value: formatCurrency(course.revenue || 0, course.currency || "INR"),
      sub: "Total gross earnings",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Current Price",
      value: formatCurrency(course.price || 0, course.currency || "INR"),
      sub: "Standard enrollment fee",
      icon: Tag,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
    },
    {
      label: "Curriculum Modules",
      value: `${lessons.length} Lessons`,
      sub: "Total structured lessons",
      icon: BookOpen,
      color: "text-sky-600",
      bg: "bg-sky-50 border-sky-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link
            to="/admin/courses"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-emerald-700"
          >
            <ArrowLeft size={14} /> Back to Courses
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-700">Course Management</span>
          <span className="text-slate-300">/</span>
          <span className="max-w-[200px] truncate text-slate-500">
            {course.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/courses/${course.slug || course.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-emerald-600"
          >
            <ExternalLink size={14} /> Public Preview
          </Link>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  course.status === "published"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : course.status === "draft"
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    course.status === "published"
                      ? "bg-emerald-500"
                      : course.status === "draft"
                      ? "bg-amber-500"
                      : "bg-slate-500"
                  }`}
                />
                {course.status}
              </span>

              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                ID: {course.id}
              </span>

              {course.category && (
                <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-semibold text-indigo-700">
                  {course.category}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
              {course.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <Layers size={13} className="text-slate-400" /> Level:{" "}
                <span className="font-semibold text-slate-700">
                  {course.difficulty || "All Levels"}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Globe size={13} className="text-slate-400" /> Language:{" "}
                <span className="font-semibold text-slate-700">
                  {course.language || "English"}
                </span>
              </span>
              {course.createdAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" /> Created:{" "}
                  <span className="font-semibold text-slate-700">
                    {formatDate(course.createdAt)}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${s.bg}`}
            >
              <s.icon size={22} className={s.color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className="truncate text-xl font-black text-slate-900">
                {s.value}
              </p>
              <p className="text-[11px] text-slate-400">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content & Sidebar Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Media + Tabs (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Media Player Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <PlayCircle size={15} className="text-indigo-600" /> Course Media
                  Preview
                </span>
                <span className="text-[11px] text-slate-500">
                  {course.promoVideo ? "Promo Video Active" : "Thumbnail Cover"}
                </span>
              </div>
            </div>
            <div className="relative aspect-video w-full bg-slate-950">
              <CourseMedia course={course} />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 bg-white px-2 rounded-t-2xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold transition-colors ${
                    isActive
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                  {tab.id === "curriculum" && lessons.length > 0 && (
                    <span
                      className={`ml-1 rounded-full px-2 py-0.2 text-[10px] font-bold ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {lessons.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Box */}
          <div className="rounded-b-2xl border-x border-b border-slate-200/80 bg-white p-6 shadow-sm">
            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Course Description
                  </h3>
                  <div className="mt-3 prose prose-slate max-w-none text-sm">
                    <RichTextContent html={course.description} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-100 md:grid-cols-2">
                  {/* Outcomes */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      What Students Will Learn
                    </h4>
                    <ul className="mt-3 space-y-2.5">
                      {outcomes.length > 0 ? (
                        outcomes.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600"
                          >
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                              ✓
                            </span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs italic text-slate-400">
                          No learning outcomes specified.
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Requirements */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <ListChecks size={16} className="text-sky-600" />
                      Course Prerequisites
                    </h4>
                    <ul className="mt-3 space-y-2.5">
                      {requirements.length > 0 ? (
                        requirements.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600"
                          >
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                              •
                            </span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs italic text-slate-400">
                          No prerequisites listed.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Curriculum / Lessons */}
            {activeTab === "curriculum" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Curriculum Structure
                    </h3>
                    <p className="text-xs text-slate-500">
                      Structured lessons and topics arranged by coach.
                    </p>
                  </div>
                  <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {lessons.length} {lessons.length === 1 ? "Lesson" : "Lessons"}
                  </span>
                </div>

                {lessons.length > 0 ? (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {lessons.map((lesson, idx) => (
                      <div
                        key={lesson.id || idx}
                        className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {lesson.title}
                            </h4>
                            {lesson.description && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                {lesson.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span className="rounded bg-slate-100 px-2 py-0.5 font-medium capitalize text-slate-700">
                                {lesson.content_type || "video"}
                              </span>
                              {lesson.duration_minutes > 0 && (
                                <span className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                                  <Clock size={11} /> {lesson.duration_minutes} mins
                                </span>
                              )}
                              <span
                                className={`rounded px-2 py-0.5 font-bold ${
                                  (lesson.drip_days ?? 0) === 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-indigo-50 text-indigo-700"
                                }`}
                              >
                                {(lesson.drip_days ?? 0) === 0
                                  ? "Instant Access (Day 0)"
                                  : `Drip Delay: Day ${lesson.drip_days}`}
                              </span>
                              {lesson.is_preview && (
                                <span className="rounded bg-amber-50 px-2 py-0.5 font-bold text-amber-700">
                                  Free Preview
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {lesson.topics?.length > 0 && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {lesson.topics.length} topics
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setPreviewLesson(lesson)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            title="Preview Lesson"
                          >
                            <Eye size={13} /> Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                    <BookOpen size={32} className="mx-auto text-slate-300" />
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      No Lessons Uploaded
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      The coach has not added lessons to this course yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Coach Profile */}
            {activeTab === "coach" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-black text-white shadow-md">
                    {(course.coach?.name?.[0] || "C").toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {course.coach?.name || "Unassigned"}
                      </h3>
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                        {course.coach?.role || "Coach"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{course.coach?.email || "-"}</p>
                    {course.coach?.email && (
                      <a
                        href={`mailto:${course.coach.email}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        <Mail size={13} /> Send Email
                      </a>
                    )}
                  </div>
                </div>

                {course.coach?.bio && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Coach Biography
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {course.coach.bio}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Controls & Metadata (4 cols) */}
        <div className="space-y-5 lg:col-span-4">
          {/* Admin Management Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck size={18} className="text-emerald-600" />
                Admin Controls
              </h3>
              {isDirty && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Unsaved Changes
                </span>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Publishing Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="published">Published (Live to Students)</option>
                  <option value="draft">Draft (Hidden from Catalog)</option>
                  <option value="archived">Archived (Retired)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Controls whether students can discover and enroll in this course.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Course Price ({course.currency || "INR"})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.price}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price: e.target.value }))
                    }
                    placeholder="999"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3.5 text-sm font-semibold text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Formatted: {formatCurrency(Number(form.price || 0), course.currency || "INR")}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || !isDirty}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>

                {isDirty && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Discard Changes
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Coach Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Assigned Instructor
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600 ring-1 ring-indigo-100">
                {(course.coach?.name?.[0] || "C").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">
                  {course.coach?.name || "Unassigned"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {course.coach?.email || "No email available"}
                </p>
              </div>
            </div>
            {course.coach?.email && (
              <a
                href={`mailto:${course.coach.email}`}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Mail size={13} /> Email Coach
              </a>
            )}
          </div>

          {/* Metadata Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Course Information
            </h3>
            <div className="mt-3 divide-y divide-slate-100 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Course Slug</span>
                <span className="font-mono text-slate-700 truncate max-w-[150px]">
                  {course.slug || course.id}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Difficulty</span>
                <span className="font-semibold text-slate-700">
                  {course.difficulty || "Beginner"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Language</span>
                <span className="font-semibold text-slate-700">
                  {course.language || "Hinglish"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Last Updated</span>
                <span className="font-semibold text-slate-700">
                  {course.updatedAt ? formatDate(course.updatedAt) : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
