import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle, Edit2, ExternalLink, Eye, FileText, Film, Link as LinkIcon, Plus, Search, Tag, Trash2, Type, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { confirmDialog } from "../../utils/dialogs";
import { resolveMediaUrl } from "../../utils/media";
import LessonPreviewModal from "../../components/common/LessonPreviewModal";

const emptyForm = {
  courseId: "",
  title: "",
  description: "",
  contentType: "video",
  contentUrl: "",
  contentFile: null,
  durationMinutes: "0",
  sortOrder: "1",
  dripDays: "0",
  status: "published",
  isPreview: false,
};

const typeConfig = {
  video: { label: "Video", icon: Film, help: "Upload MP4/WebM/Ogg or paste a video link." },
  document: { label: "Document", icon: FileText, help: "Upload PDF/DOC/PPT/ZIP or paste a document URL." },
  link: { label: "External Link", icon: LinkIcon, help: "Paste any external learning link." },
  text: { label: "Text Lesson", icon: Type, help: "Use description as the lesson content." },
};

const fileEndpoint = (type) => type === "video" ? "/upload/video" : "/upload/document";
const canUpload = (type) => ["video", "document"].includes(type);
const sortedLessons = (items) => [...items].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

export default function ManageLessons() {
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewLesson, setPreviewLesson] = useState(null);

  const load = async (preferredCourse = selectedCourse) => {
    try {
      setLoading(true);
      const [courseRes, lessonRes] = await Promise.all([api.get("/coach/courses"), api.get("/coach/lessons")]);
      const courseList = courseRes.courses || [];
      const lessonList = lessonRes.lessons || [];
      setCourses(courseList);
      setLessons(lessonList);
      setSelectedCourse((current) => preferredCourse || current || courseList[0]?.id || "");
    } catch (err) {
      toast.error(err?.message || "Failed to load course content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeCourse = courses.find((course) => course.id === selectedCourse) || courses[0] || null;
  const activeCourseId = activeCourse?.id || selectedCourse;
  const courseLessons = useMemo(() => sortedLessons(lessons.filter((lesson) => !activeCourseId || lesson.courseId === activeCourseId)), [lessons, activeCourseId]);
  const filtered = useMemo(() => courseLessons.filter((lesson) => `${lesson.title} ${lesson.description} ${lesson.contentType}`.toLowerCase().includes(search.toLowerCase())), [courseLessons, search]);
  const published = courseLessons.filter((lesson) => lesson.status === "published").length;
  const totalMinutes = courseLessons.reduce((sum, lesson) => sum + Number(lesson.durationMinutes || 0), 0);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (lesson) => {
    setEditing(lesson);
    setShowModal(true);
  };

  const remove = async (lesson) => {
    const ok = await confirmDialog({ title: "Delete lesson?", message: `${lesson.title} will be removed from this course.`, confirmText: "Delete Lesson", tone: "danger" });
    if (!ok) return;
    try {
      await api.delete(`/coach/lessons/${lesson.id}`);
      toast.success("Lesson deleted");
      load(activeCourseId);
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Course Content Builder</h2>
          <p className="mt-1 text-sm text-gray-500">Build LMS lessons in order with video, documents, links, text content, and sub-topics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={openCreate}
            disabled={!activeCourse}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 shadow-sm transition"
          >
            <Plus size={18} /> Add Lesson
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search lessons..." className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <select value={activeCourseId || ""} onChange={(e) => setSelectedCourse(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {courses.length === 0 && <option value="">No courses yet</option>}
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[{ label: "Lessons", value: courseLessons.length }, { label: "Published", value: published }, { label: "Duration", value: `${totalMinutes} min` }].map((item) => <div key={item.label} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-bold text-gray-500">{item.label}</p><p className="mt-2 text-3xl font-black text-gray-900">{item.value}</p></div>)}
      </section>

      <section className="rounded-2xl bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h3 className="font-black text-gray-900">{activeCourse?.title || "Course"} Curriculum</h3>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading lessons...</div>
        ) : !activeCourse ? (
          <div className="p-10 text-center text-gray-400">Create a course first, then add lessons.</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No lessons found. Add the first lesson to start the LMS flow.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((lesson, index) => {
              const config = typeConfig[lesson.contentType] || typeConfig.video;
              const Icon = config.icon;
              const contentUrl = resolveMediaUrl(lesson.contentUrl);
              const lessonTopics = lesson.topics || [];
              return (
                <article key={lesson.id} className="grid gap-4 p-5 lg:grid-cols-[52px_1fr_auto] lg:items-start transition hover:bg-slate-50/50">
                  <div
                    onClick={() => setPreviewLesson(lesson)}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 hover:scale-105"
                    title="Preview this lesson"
                  >
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-500">Lesson {index + 1}</span>
                      {lesson.isPreview && <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-black text-sky-700">Free preview</span>}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${lesson.status === "published" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{lesson.status}</span>
                      {Number(lesson.dripDays || 0) > 0 && <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">Drip: Day {lesson.dripDays}</span>}
                      <button
                        type="button"
                        onClick={() => setTopicLesson(lesson)}
                        className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50/70 px-2.5 py-0.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                        title="Manage topics for this lesson"
                      >
                        <Tag size={11} /> {lessonTopics.length ? `${lessonTopics.length} Topics` : "+ Add Topics"}
                      </button>
                    </div>
                    <h4
                      onClick={() => setPreviewLesson(lesson)}
                      className="mt-2 font-black text-gray-900 cursor-pointer hover:text-indigo-600 transition"
                      title="Click to preview lesson"
                    >
                      {lesson.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{lesson.description || config.help}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-gray-500">
                      <span>{config.label}</span>
                      <span>{lesson.durationMinutes || 0} min</span>
                      <span>Order {lesson.sortOrder || index + 1}</span>
                      <button
                        type="button"
                        onClick={() => setPreviewLesson(lesson)}
                        className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900"
                      >
                        <Eye size={13} /> Quick preview
                      </button>
                    </div>

                    {lessonTopics.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                          <Tag size={11} /> Topics:
                        </span>
                        {lessonTopics.map((t, ti) => (
                          <span
                            key={t.id || ti}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                          >
                            <span className="font-bold text-indigo-600">{ti + 1}.</span> {t.title}
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => openEdit(lesson)}
                          className="text-[11px] font-bold text-indigo-600 hover:underline ml-1"
                        >
                          + Manage
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => openEdit(lesson)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100 hover:border-indigo-300"
                      title="Edit lesson & topics"
                    >
                      <Tag size={13} /> Topics ({lessonTopics.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLesson(lesson)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                      title="Preview Lesson"
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button onClick={() => openEdit(lesson)} className="rounded-lg border p-2 text-indigo-600 hover:bg-indigo-50" title="Edit"><Edit2 size={15} /></button>
                    <button onClick={() => remove(lesson)} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50" title="Delete"><Trash2 size={15} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {previewLesson && (
        <LessonPreviewModal
          lessonId={previewLesson.id}
          lesson={previewLesson}
          onClose={() => setPreviewLesson(null)}
          onEdit={(l) => {
            setPreviewLesson(null);
            openEdit(l);
          }}
        />
      )}

      {showModal && (
        <LessonModal
          courses={courses}
          defaultCourseId={activeCourseId}
          lesson={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load(activeCourseId);
          }}
        />
      )}
    </div>
  );
}

function LessonModal({ courses, defaultCourseId, lesson, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    lesson
      ? {
          ...emptyForm,
          ...lesson,
          durationMinutes: String(lesson.durationMinutes || 0),
          sortOrder: String(lesson.sortOrder || 1),
          dripDays: String(lesson.dripDays || 0),
          contentFile: null,
        }
      : {
          ...emptyForm,
          courseId: defaultCourseId || courses[0]?.id || "",
          sortOrder: "1",
        }
  );

  const [topics, setTopics] = useState(() => {
    if (lesson && Array.isArray(lesson.topics)) {
      return lesson.topics.map((t, idx) => ({
        id: t.id || "",
        title: t.title || "",
        body: t.body || "",
        sortOrder: String(t.sortOrder || t.sort_order || idx + 1),
      }));
    }
    return [];
  });

  const [saving, setSaving] = useState(false);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "contentType"
        ? { contentFile: null, contentUrl: value === "text" ? "" : prev.contentUrl }
        : {}),
    }));
  };

  const addTopic = () => {
    setTopics((prev) => [
      ...prev,
      {
        id: "",
        title: "",
        body: "",
        sortOrder: String(prev.length + 1),
      },
    ]);
  };

  const updateTopic = (index, field, value) => {
    setTopics((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const removeTopic = (index) => {
    setTopics((prev) => prev.filter((_, idx) => idx !== index));
  };

  const uploadContentFile = async () => {
    if (!form.contentFile) return form.contentUrl || "";
    const data = new FormData();
    data.append("file", form.contentFile);
    const res = await api.post(fileEndpoint(form.contentType), data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.upload?.url || res.material?.url || "";
  };

  const submit = async () => {
    if (!form.courseId || !form.title.trim())
      return toast.error("Course and lesson title required");
    if (
      form.contentType !== "text" &&
      !form.contentUrl &&
      !form.contentFile
    )
      return toast.error("Add a content URL or upload a file");
    if (
      form.contentFile &&
      form.contentType === "video" &&
      !form.contentFile.type?.startsWith("video/")
    )
      return toast.error("Upload a valid video file");

    const cleanedTopics = topics
      .map((t, idx) => ({
        id: t.id || undefined,
        title: (t.title || "").trim(),
        body: (t.body || "").trim(),
        sortOrder: Number(t.sortOrder || idx + 1) || (idx + 1),
      }))
      .filter((t) => Boolean(t.title));

    setSaving(true);
    try {
      const contentUrl = await uploadContentFile();
      const payload = {
        ...form,
        contentUrl,
        durationMinutes: Number(form.durationMinutes || 0),
        sortOrder: Number(form.sortOrder || 0),
        dripDays: Number(form.dripDays || 0),
        contentFile: undefined,
        topics: cleanedTopics,
      };

      if (lesson) {
        await api.put(`/coach/lessons/${lesson.id}`, payload);
      } else {
        await api.post("/coach/lessons", payload);
      }

      toast.success(lesson ? "Lesson updated" : "Lesson created");
      onSaved();
    } catch (err) {
      toast.error(err?.message || "Lesson save failed");
    } finally {
      setSaving(false);
    }
  };

  const config = typeConfig[form.contentType] || typeConfig.video;
  const accept =
    form.contentType === "video"
      ? "video/*"
      : ".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.webp,application/pdf";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm text-left">
      <div className="flex flex-col max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0 bg-white">
          <div>
            <h3 className="font-black text-slate-900 text-lg">
              {lesson ? "Edit Lesson" : "Add Lesson"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{config.help}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto space-y-4 p-6">
          {/* Course Selector */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Select Course <span className="text-red-500">*</span>
            </label>
            <select
              name="courseId"
              value={form.courseId}
              onChange={change}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Lesson Title */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Lesson Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={change}
              placeholder="e.g. Chapter 1: Introduction & Fundamentals"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Summary / Description */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Lesson Summary / Content
            </label>
            <textarea
              name="description"
              value={form.description || ""}
              onChange={change}
              rows={3}
              placeholder={
                form.contentType === "text"
                  ? "Write the complete text lesson content here..."
                  : "Provide a brief description or instructions for the student..."
              }
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Content Type, Duration, Sort Order, Drip Days */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Content Type
              </label>
              <select
                name="contentType"
                value={form.contentType}
                onChange={change}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="link">External Link</option>
                <option value="text">Text Lesson</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Duration (Min)
              </label>
              <input
                name="durationMinutes"
                type="number"
                min="0"
                value={form.durationMinutes}
                onChange={change}
                placeholder="Minutes"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Sort Order
              </label>
              <input
                name="sortOrder"
                type="number"
                min="1"
                value={form.sortOrder}
                onChange={change}
                placeholder="1, 2, 3..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-xs font-bold text-slate-700"
                title="Unlock delay in days after enrollment"
              >
                Drip Days
              </label>
              <input
                name="dripDays"
                type="number"
                min="0"
                value={form.dripDays}
                onChange={change}
                placeholder="0 = Immediate"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Content URL */}
          {form.contentType !== "text" && (
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Content URL / Web Link
              </label>
              <input
                name="contentUrl"
                value={form.contentUrl || ""}
                onChange={change}
                placeholder="Paste video stream link, Vimeo/YouTube URL, or direct document URL"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}

          {/* File Upload Zone */}
          {canUpload(form.contentType) && (
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Or Upload Media File
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 hover:border-indigo-400 hover:bg-indigo-50/40 transition">
                <Upload size={20} className="text-indigo-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-800">
                    {form.contentFile
                      ? form.contentFile.name
                      : form.contentUrl
                      ? "Replace uploaded lesson file"
                      : `Upload ${config.label.toLowerCase()} file`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {form.contentType === "video"
                      ? "Supported formats: MP4, WebM, Ogg"
                      : "Supported formats: PDF, DOC, PPT, ZIP, Image"}
                  </span>
                </span>
                <input
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      contentFile: e.target.files?.[0] || null,
                    }))
                  }
                />
              </label>
            </div>
          )}

          {/* Status & Free Preview */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Publish Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={change}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Access Permission
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  name="isPreview"
                  checked={Boolean(form.isPreview)}
                  onChange={change}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />{" "}
                Free preview (Learners can watch without purchase)
              </label>
            </div>
          </div>

          {/* INLINE TOPICS SECTION (FOR BOTH ADD & EDIT LESSON) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag size={14} className="text-indigo-600" />
                  Lesson Topics / Sub-topics
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700">
                    {topics.length}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Add sub-topics or chapters covered inside this lesson.
                </p>
              </div>
              <button
                type="button"
                onClick={addTopic}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm"
              >
                <Plus size={13} /> Add Topic
              </button>
            </div>

            {topics.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center">
                <p className="text-xs text-slate-500">
                  No sub-topics added yet. Click <span className="font-bold text-indigo-600">"+ Add Topic"</span> above to add topics to this lesson.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topics.map((t, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2.5 transition hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600">
                          {idx + 1}
                        </span>
                        Topic #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span>Order:</span>
                          <input
                            type="number"
                            min="1"
                            value={t.sortOrder}
                            onChange={(e) => updateTopic(idx, "sortOrder", e.target.value)}
                            className="w-12 rounded-md border border-slate-200 px-1.5 py-0.5 text-center text-xs font-semibold outline-none focus:border-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTopic(idx)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Remove topic"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-slate-600">
                          Topic Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={t.title}
                          onChange={(e) => updateTopic(idx, "title", e.target.value)}
                          placeholder="e.g. Introduction & Variables"
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-slate-600">
                          Topic Notes / Summary <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                          value={t.body}
                          onChange={(e) => updateTopic(idx, "body", e.target.value)}
                          rows={2}
                          placeholder="Brief notes, key points, or instructions for this topic..."
                          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm"
          >
            {saving ? "Saving..." : "Save Lesson"}
          </button>
        </div>
      </div>
    </div>
  );
}