import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Layers,
  Link as LinkIcon,
  ListTree,
  Lock,
  Paperclip,
  PlayCircle,
  Sparkles,
  Type,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { resolveMediaUrl } from "../../utils/media";
import { formatDate, formatUnlockTime } from "../../utils/formatters";
import { getVideoEmbedUrl, isDirectVideoUrl } from "../../utils/video";

const isSubmitted = (submission) => ["submitted", "graded"].includes(submission?.status);
const isQuizPassed = (quiz) => Number(quiz.attempts || 0) > 0 && Number(quiz.avgScore || 0) >= Number(quiz.passingScore || 0);

const assignmentStatusLabel = (status) => {
  if (status === "graded") return "Accepted";
  if (status === "pending") return "Rejected - needs revision";
  if (status === "submitted") return "Submitted for review";
  return "Not submitted";
};

const getLessonIcon = (type) => {
  if (type === "video") return PlayCircle;
  if (type === "document") return FileText;
  if (type === "link") return LinkIcon;
  return Type;
};

const contentLabel = (type) => {
  if (type === "video") return "Video lesson";
  if (type === "document") return "Document lesson";
  if (type === "link") return "External resource";
  return "Text lesson";
};

const getSortedTopics = (lesson) => {
  if (!lesson || !Array.isArray(lesson.topics)) return [];
  return [...lesson.topics].sort(
    (a, b) =>
      Number(a.sort_order || a.sortOrder || 0) - Number(b.sort_order || b.sortOrder || 0) ||
      new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0)
  );
};

export default function LearnCourse() {
  const { courseId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [expandedLessons, setExpandedLessons] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);

  const sortedLessons = useMemo(
    () =>
      [...lessons].sort(
        (a, b) =>
          Number(a.sortOrder || a.sort_order || 0) - Number(b.sortOrder || b.sort_order || 0) ||
          new Date(a.createdAt || a.created_at || 0) - new Date(b.createdAt || b.created_at || 0)
      ),
    [lessons]
  );

  const activeLesson = sortedLessons.find((lesson) => lesson.id === activeLessonId) || sortedLessons[0] || null;
  const activeIndex = activeLesson ? sortedLessons.findIndex((lesson) => lesson.id === activeLesson.id) : -1;
  const activeTopics = useMemo(() => getSortedTopics(activeLesson), [activeLesson]);

  const completedLessons = sortedLessons.filter((lesson) => lesson.progress?.status === "completed").length;
  const submittedAssignments = assignments.filter(({ submission }) => isSubmitted(submission)).length;
  const passedQuizzes = quizzes.filter(isQuizPassed).length;
  const totalItems = sortedLessons.length + assignments.length + quizzes.length;
  const completedItems = completedLessons + submittedAssignments + passedQuizzes;
  const percent = totalItems ? Math.round((completedItems / totalItems) * 100) : Number(enrollment?.progress || 0);

  const chooseDefaultLesson = (items, currentId = activeLessonId) => {
    if (!items.length) return "";
    if (currentId && items.some((lesson) => lesson.id === currentId)) return currentId;
    return items.find((lesson) => lesson.progress?.status !== "completed")?.id || items[0].id;
  };

  const load = async (preferredLessonId = activeLessonId) => {
    try {
      setLoading(true);
      const [contentRes, assignmentRes, quizRes] = await Promise.all([
        api.get(`/student/courses/${courseId}/content`),
        api.get("/student/assignments"),
        api.get("/student/quizzes"),
      ]);
      const lessonList = contentRes.lessons || [];
      setEnrollment(contentRes.enrollment || null);
      setLessons(lessonList);
      setAssignments((assignmentRes.assignments || []).filter((item) => item.assignment?.courseId === courseId));
      setQuizzes((quizRes.quizzes || []).filter((quiz) => quiz.courseId === courseId));
      
      const defaultId = chooseDefaultLesson(lessonList, preferredLessonId);
      setActiveLessonId(defaultId);
      if (defaultId) {
        setExpandedLessons((prev) => ({ ...prev, [defaultId]: true }));
      }
    } catch (err) {
      toast.error(err?.message || "Failed to load course content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(""), 0);
    return () => clearTimeout(timer);
  }, [courseId]);

  // Keep active lesson expanded in curriculum
  useEffect(() => {
    if (activeLessonId) {
      setExpandedLessons((prev) => ({ ...prev, [activeLessonId]: true }));
    }
  }, [activeLessonId]);

  const markComplete = async (lessonId = activeLesson?.id) => {
    if (!lessonId) return;
    setSavingProgress(true);
    try {
      await api.patch(`/student/lessons/${lessonId}/progress`, { status: "completed" });
      toast.success("Lesson completed");
      await load(lessonId);
    } catch (err) {
      toast.error(err?.message || "Progress update failed");
    } finally {
      setSavingProgress(false);
    }
  };

  const goToLesson = (offset) => {
    const next = sortedLessons[activeIndex + offset];
    if (next) {
      setActiveLessonId(next.id);
      setSelectedTopicId("");
    }
  };

  const handleSelectLesson = (lessonId) => {
    setActiveLessonId(lessonId);
    setSelectedTopicId("");
  };

  const handleSelectTopic = (lessonId, topicId) => {
    setActiveLessonId(lessonId);
    setSelectedTopicId(topicId);
    // Smooth scroll to topic card in main view if available
    setTimeout(() => {
      const el = document.getElementById(`topic-card-${topicId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  if (loading) {
    return <div className="rounded-2xl bg-white p-10 text-center text-slate-500">Loading course...</div>;
  }

  return (
    <div className="space-y-6">
      <Link to="/student/my-learning" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
        <ArrowLeft size={16} /> Back to My Learning
      </Link>

      {/* Progress Banner */}
      <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold text-sky-300">Course Progress</p>
            <h2 className="mt-2 text-3xl font-black">{percent}% complete</h2>
            <p className="mt-1 text-sm text-slate-300">
              {completedItems} of {totalItems || 0} activities completed
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-slate-100">
            {completedLessons}/{sortedLessons.length} lessons done
          </div>
        </div>
        <div className="mt-5 h-2 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-sky-400 transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr]">
        {/* Left Sidebar Curriculum */}
        <aside className="space-y-5">
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900">Curriculum</h3>
                <p className="text-[11px] font-medium text-slate-500">
                  {sortedLessons.length} Lessons &bull; {sortedLessons.reduce((acc, l) => acc + (l.topics?.length || 0), 0)} Topics
                </p>
              </div>
              <span className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700">
                {percent}%
              </span>
            </div>

            {sortedLessons.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">No published lessons yet</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedLessons.map((lesson, index) => {
                  const done = lesson.progress?.status === "completed";
                  const Icon = lesson.isLocked ? Lock : getLessonIcon(lesson.contentType);
                  const active = activeLesson?.id === lesson.id;
                  const lessonTopics = getSortedTopics(lesson);
                  const isExpanded = expandedLessons[lesson.id] !== undefined ? expandedLessons[lesson.id] : active;

                  return (
                    <div key={lesson.id} className="transition">
                      <div
                        onClick={() => !lesson.isLocked && handleSelectLesson(lesson.id)}
                        className={`flex w-full gap-3 p-4 text-left transition select-none cursor-pointer ${
                          active
                            ? "bg-sky-50/70"
                            : lesson.isLocked
                              ? "bg-slate-50/80 opacity-60 cursor-not-allowed"
                              : "hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                            done
                              ? "bg-green-100 text-green-600"
                              : active
                                ? "bg-sky-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {done ? <CheckCircle size={18} /> : <Icon size={18} />}
                        </span>

                        <span className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                              Lesson {index + 1}
                            </span>
                            {lessonTopics.length > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                                <ListTree size={11} /> {lessonTopics.length} {lessonTopics.length === 1 ? "topic" : "topics"}
                              </span>
                            )}
                          </div>

                          <span className="mt-1 block font-bold text-slate-900 leading-snug">
                            {lesson.title}
                          </span>

                          {lesson.isLocked ? (
                            <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600">
                              <Clock size={11} className="shrink-0" /> Unlocks {formatUnlockTime(lesson.unlocksAt)}
                            </span>
                          ) : (
                            <span className="mt-1 block text-xs text-slate-500">
                              {contentLabel(lesson.contentType)} &bull; {lesson.durationMinutes || 0} min
                            </span>
                          )}
                        </span>

                        {lessonTopics.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLessons((prev) => ({ ...prev, [lesson.id]: !isExpanded }));
                            }}
                            className="mt-1 p-1 text-slate-400 hover:text-slate-700 transition"
                            title={isExpanded ? "Collapse topics" : "Expand topics"}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                      </div>

                      {/* Nested Topics Accordion List */}
                      {lessonTopics.length > 0 && isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/80 px-3.5 py-2 space-y-1">
                          <div className="px-2 py-1 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Lesson Topics ({lessonTopics.length})
                            </span>
                          </div>
                          {lessonTopics.map((topic, tIdx) => {
                            const isTopicActive = active && selectedTopicId === topic.id;
                            return (
                              <div
                                key={topic.id}
                                onClick={() => !lesson.isLocked && handleSelectTopic(lesson.id, topic.id)}
                                className={`flex items-start gap-2.5 rounded-xl px-3 py-2 text-xs transition cursor-pointer ${
                                  isTopicActive
                                    ? "bg-white font-bold text-sky-900 shadow-xs ring-1 ring-sky-300"
                                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                                }`}
                              >
                                <span
                                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                    isTopicActive ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  {tIdx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 leading-snug">{topic.title || topic.name}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <ActivityPanel assignments={assignments} quizzes={quizzes} />
        </aside>

        {/* Right Main Content */}
        <main className="space-y-5">
          {activeLesson ? (
            <section className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-5 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-sky-700">
                      Lesson {activeIndex + 1} &bull; {contentLabel(activeLesson.contentType)}
                    </span>
                    {activeTopics.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        <ListTree size={13} className="text-sky-600" /> {activeTopics.length} {activeTopics.length === 1 ? "Topic" : "Topics"}
                      </span>
                    )}
                  </div>
                  {activeLesson.progress?.status === "completed" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle size={13} /> Completed
                    </span>
                  )}
                </div>

                <h1 className="mt-2.5 text-2xl font-black text-slate-900">{activeLesson.title}</h1>
                {activeLesson.description && activeLesson.contentType !== "text" && (
                  <p className="mt-2 text-sm text-slate-500">{activeLesson.description}</p>
                )}
              </div>

              <div className="p-6">
                {activeLesson.isLocked ? (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-10 text-center text-slate-500">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm">
                        <Lock size={32} />
                      </div>
                      <p className="mt-4 text-xl font-black text-slate-900">Content Locked</p>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-xs font-bold text-amber-700 shadow-sm">
                        <Clock size={15} className="text-amber-500" />
                        <span>This lesson unlocks on {formatUnlockTime(activeLesson.unlocksAt)}</span>
                      </div>
                      <p className="mt-3 text-xs text-slate-400 max-w-md mx-auto">
                        This module is scheduled with a drip timeline by the coach. It will unlock automatically at the exact scheduled time.
                      </p>
                    </div>

                    {/* Show topics scheduled in this locked lesson */}
                    {activeTopics.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5">
                        <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 mb-3.5">
                          <ListTree size={15} className="text-amber-600" />
                          Topics Covered in this Lesson ({activeTopics.length})
                        </h4>
                        <div className="divide-y divide-slate-200/70">
                          {activeTopics.map((topic, tIdx) => (
                            <div key={topic.id} className="py-3 flex items-start gap-3">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-amber-200 text-xs font-bold text-amber-800 shadow-xs">
                                {tIdx + 1}
                              </span>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{topic.title || topic.name}</p>
                                {topic.body && (
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{topic.body}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Lesson Main Player / Viewer */}
                    <LessonPlayer lesson={activeLesson} />

                    {/* Lesson Topics & Syllabus Breakdown */}
                    {activeTopics.length > 0 && (
                      <div className="mt-8 border-t border-slate-100 pt-6">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                              <ListTree size={18} />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-slate-900">
                                Lesson Topics &amp; Modules ({activeTopics.length})
                              </h3>
                              <p className="text-xs text-slate-500">
                                Key topics, concepts, and notes covered in this lesson
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3.5">
                          {activeTopics.map((topic, tIdx) => {
                            const isSelected = selectedTopicId === topic.id;
                            return (
                              <div
                                key={topic.id}
                                id={`topic-card-${topic.id}`}
                                onClick={() => setSelectedTopicId(topic.id)}
                                className={`rounded-2xl border p-5 transition cursor-pointer ${
                                  isSelected
                                    ? "border-sky-300 bg-sky-50/40 shadow-sm ring-2 ring-sky-200"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                                }`}
                              >
                                <div className="flex items-start gap-3.5">
                                  <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black transition ${
                                      isSelected
                                        ? "bg-sky-600 text-white shadow-xs"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {tIdx + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className="text-sm font-bold text-slate-900">
                                        {topic.title || topic.name}
                                      </h4>
                                      <span className="text-[11px] font-semibold text-slate-400">
                                        Topic {tIdx + 1}
                                      </span>
                                    </div>
                                    {topic.body ? (
                                      <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {topic.body}
                                      </div>
                                    ) : (
                                      <p className="mt-1 text-xs text-slate-400 italic">
                                        No supplementary notes added for this topic.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Navigation & Complete Action */}
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => goToLesson(-1)}
                  disabled={activeIndex <= 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-xs transition"
                >
                  <ChevronLeft size={16} /> Previous Lesson
                </button>

                <button
                  type="button"
                  onClick={() => markComplete(activeLesson.id)}
                  disabled={activeLesson.isLocked || savingProgress || activeLesson.progress?.status === "completed"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 shadow-sm transition"
                >
                  <CheckCircle size={16} />
                  {activeLesson.progress?.status === "completed"
                    ? "Completed"
                    : savingProgress
                      ? "Saving..."
                      : "Mark Complete"}
                </button>

                <button
                  type="button"
                  onClick={() => goToLesson(1)}
                  disabled={activeIndex >= sortedLessons.length - 1}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-xs transition"
                >
                  Next Lesson <ChevronRight size={16} />
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <BookOpen className="mx-auto text-slate-300" size={44} />
              <h3 className="mt-4 font-black text-slate-900">No lessons published yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Your coach can add video, document, link, or text lessons from the content builder.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function LessonPlayer({ lesson }) {
  const rawUrl = lesson.contentUrl || "";
  const url = resolveMediaUrl(rawUrl);
  const embedUrl = getVideoEmbedUrl(rawUrl);

  if (lesson.contentType === "video") {
    if (embedUrl) {
      return (
        <div className="aspect-video overflow-hidden rounded-2xl bg-slate-950 shadow-sm">
          <iframe
            src={embedUrl}
            title={lesson.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }
    if (url && isDirectVideoUrl(url)) {
      return (
        <video
          src={url}
          controls
          className="aspect-video w-full rounded-2xl bg-slate-950 object-contain shadow-sm"
        />
      );
    }
    return <EmptyContent icon={PlayCircle} title="No playable video attached" url={url} />;
  }

  if (lesson.contentType === "document") {
    if (!url) return <EmptyContent icon={FileText} title="No document attached" />;
    const isImage = /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(url);
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {isImage ? (
            <img src={url} alt={lesson.title} className="max-h-[620px] w-full object-contain" />
          ) : (
            <iframe src={url} title={lesson.title} className="h-[620px] w-full" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2 text-sm font-black text-sky-700 hover:bg-sky-100 transition"
          >
            <ExternalLink size={16} /> Open Document
          </a>
          <a
            href={url}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200 transition"
          >
            <Download size={16} /> Download
          </a>
        </div>
      </div>
    );
  }

  if (lesson.contentType === "link") {
    return url ? (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <LinkIcon className="mx-auto text-sky-600" size={44} />
        <h3 className="mt-4 font-black text-slate-900">External learning resource</h3>
        <p className="mt-1 break-all text-sm text-slate-500">{rawUrl}</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800 transition"
        >
          <ExternalLink size={16} /> Open Resource
        </a>
      </div>
    ) : (
      <EmptyContent icon={LinkIcon} title="No link attached" />
    );
  }

  return (
    <div className="min-h-[280px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-sm leading-7 text-slate-700">
      {lesson.description || "No text content added for this lesson."}
    </div>
  );
}

function EmptyContent({ icon: Icon, title, url }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500 bg-slate-50/30">
      <Icon className="mx-auto text-slate-300" size={44} />
      <p className="mt-3 font-bold text-slate-700">{title}</p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 transition"
        >
          <ExternalLink size={16} /> Open URL
        </a>
      )}
    </div>
  );
}

function ActivityPanel({ assignments, quizzes }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList size={18} className="text-sky-600" />
          <h3 className="font-black text-slate-900">Assignments</h3>
        </div>
        {assignments.length === 0 ? (
          <p className="text-sm text-slate-500">No assignments yet</p>
        ) : (
          <div className="space-y-3">
            {assignments.map(({ assignment, submission }) => {
              const fileUrl = resolveMediaUrl(assignment.attachmentUrl);
              return (
                <div
                  key={assignment.id}
                  className={`rounded-xl border p-3.5 transition ${
                    assignment.isLocked ? "opacity-60 bg-slate-50" : "hover:bg-slate-50"
                  }`}
                >
                  {assignment.isLocked ? (
                    <div className="block cursor-not-allowed">
                      <p className="flex items-center gap-2 font-bold text-slate-900">
                        <Lock size={14} className="text-amber-600" /> {assignment.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600">
                        <Clock size={11} className="shrink-0" /> Unlocks {formatUnlockTime(assignment.unlocksAt)}
                      </p>
                    </div>
                  ) : (
                    <>
                      <Link to={`/student/assignments/${assignment.id}/submit`} className="block">
                        <p className="font-bold text-slate-900">{assignment.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {submission ? assignmentStatusLabel(submission.status) : "Not submitted"}
                        </p>
                      </Link>
                      {fileUrl && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-black text-sky-700 hover:bg-sky-100 transition"
                          >
                            <Paperclip size={13} /> View file
                          </a>
                          <a
                            href={fileUrl}
                            download
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200 transition"
                          >
                            <Download size={13} /> Download
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle size={18} className="text-sky-600" />
          <h3 className="font-black text-slate-900">Quizzes</h3>
        </div>
        {quizzes.length === 0 ? (
          <p className="text-sm text-slate-500">No quizzes yet</p>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) =>
              quiz.isLocked ? (
                <div
                  key={quiz.id}
                  className="block cursor-not-allowed rounded-xl border border-amber-100 bg-amber-50/40 p-3 opacity-80"
                >
                  <p className="flex items-center gap-2 font-bold text-slate-900">
                    <Lock size={14} className="text-amber-600" /> {quiz.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <Clock size={11} className="shrink-0" /> Unlocks {formatUnlockTime(quiz.unlocksAt)}
                  </p>
                </div>
              ) : (
                <Link
                  key={quiz.id}
                  to={`/student/quizzes/${quiz.id}/attempt`}
                  className="block rounded-xl border p-3 hover:bg-slate-50 transition"
                >
                  <p className="font-bold text-slate-900">{quiz.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {quiz.questions || 0} questions &bull; pass {quiz.passingScore}%
                  </p>
                </Link>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}