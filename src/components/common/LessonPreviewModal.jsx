import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Layers,
  Link as LinkIcon,
  Maximize2,
  PlayCircle,
  Sparkles,
  Type,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { resolveMediaUrl } from "../../utils/media";
import { getVideoEmbedUrl, isDirectVideoUrl } from "../../utils/video";
import RichTextContent from "./RichTextContent";

const typeLabels = {
  video: { label: "Video Lesson", icon: Film, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  document: { label: "Document", icon: FileText, color: "text-sky-600 bg-sky-50 border-sky-100" },
  link: { label: "External Link", icon: LinkIcon, color: "text-amber-600 bg-amber-50 border-amber-100" },
  text: { label: "Text Article", icon: Type, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
};

export default function LessonPreviewModal({
  lessonId,
  lesson: initialLesson,
  onClose,
  onEdit,
}) {
  const targetId = lessonId || initialLesson?.id;
  const [lesson, setLesson] = useState(initialLesson || null);
  const [loading, setLoading] = useState(!initialLesson);

  useEffect(() => {
    if (!targetId) return;
    let alive = true;
    setLoading(true);

    api
      .get(`/coach/lessons/${targetId}`)
      .then((res) => {
        if (!alive) return;
        setLesson(res.lesson || null);
      })
      .catch((err) => {
        if (!alive) return;
        toast.error(err?.message || "Failed to fetch single lesson");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [targetId]);

  if (!targetId) return null;

  const title = lesson?.title || "Untitled Lesson";
  const description = lesson?.description || "";
  const contentType = (lesson?.contentType || lesson?.content_type || "video").toLowerCase();
  const rawUrl = lesson?.contentUrl || lesson?.content_url || "";
  const contentUrl = resolveMediaUrl(rawUrl);
  const duration = lesson?.durationMinutes ?? lesson?.duration_minutes ?? 0;
  const dripDays = lesson?.dripDays ?? lesson?.drip_days ?? 0;
  const sortOrder = lesson?.sortOrder ?? lesson?.sort_order ?? 1;
  const status = lesson?.status || "published";
  const isPreview = Boolean(lesson?.isPreview ?? lesson?.is_preview);
  const course = lesson?.course || {};
  const topics = lesson?.topics || [];

  const config = typeLabels[contentType] || typeLabels.video;
  const Icon = config.icon;
  const embedUrl = getVideoEmbedUrl(rawUrl);
  const isDirectVideo = contentUrl && isDirectVideoUrl(contentUrl);
  const isPdf = /\.(pdf)(\?.*)?$/i.test(contentUrl) || rawUrl.toLowerCase().includes("/pdf");
  const isImage = /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(contentUrl);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md text-left">
      <div className="flex flex-col h-[90vh] max-h-[880px] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              {course?.title && (
                <>
                  <span className="truncate max-w-[260px] text-slate-700 font-bold">{course.title}</span>
                  <span className="text-slate-300">•</span>
                </>
              )}
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                Single Lesson Preview
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 font-bold uppercase text-[10px] ${
                  status === "published"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                }`}
              >
                {status}
              </span>
              {isPreview && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 ring-1 ring-sky-200">
                  <Sparkles size={11} /> Free Preview
                </span>
              )}
            </div>
            <h2 className="mt-1.5 truncate text-lg font-black text-slate-900 sm:text-xl">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {lesson?.id && (
              <Link
                to={`/coach/lessons/${lesson.id}/preview`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-indigo-600"
                title="Open in full page"
              >
                <Maximize2 size={16} />
              </Link>
            )}
            {onEdit && lesson && (
              <button
                type="button"
                onClick={() => onEdit(lesson)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-indigo-600"
              >
                <Edit2 size={13} /> Edit Lesson
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Close Preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center p-12 text-slate-500">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="text-sm font-semibold">Fetching single lesson data from API...</p>
            </div>
          </div>
        ) : !lesson ? (
          <div className="flex flex-1 items-center justify-center p-12 text-center text-slate-500">
            <div>
              <p className="font-bold text-slate-700">Lesson not found</p>
              <p className="mt-1 text-xs text-slate-400">Could not retrieve lesson details from backend API.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Main Content Player Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-950 p-2 sm:p-3 shadow-inner">
              {contentType === "video" && (
                <>
                  {embedUrl ? (
                    <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-950 shadow-md">
                      <iframe
                        src={embedUrl}
                        title={title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : isDirectVideo ? (
                    <video
                      src={contentUrl}
                      controls
                      playsInline
                      className="aspect-video w-full rounded-xl bg-slate-950 object-contain shadow-md"
                    />
                  ) : contentUrl ? (
                    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl bg-slate-950 p-6 text-center text-white">
                      <PlayCircle size={48} className="text-indigo-400" />
                      <p className="mt-3 text-sm font-bold text-slate-200">Video source attached</p>
                      <p className="mt-1 max-w-md truncate text-xs text-slate-400">{rawUrl}</p>
                      <a
                        href={contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                      >
                        <ExternalLink size={14} /> Open Video Link
                      </a>
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl bg-slate-950 p-6 text-center text-white">
                      <Film size={44} className="text-slate-600" />
                      <p className="mt-3 text-sm font-bold text-slate-300">No video attached to this lesson</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Upload an MP4 file or paste a video link in the lesson editor.
                      </p>
                    </div>
                  )}
                </>
              )}

              {contentType === "document" && (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  {isPdf ? (
                    <div className="space-y-3">
                      <iframe
                        src={contentUrl}
                        title={title}
                        className="h-[520px] w-full rounded-xl border border-slate-200"
                      />
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={contentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition"
                        >
                          <ExternalLink size={13} /> Open in New Tab
                        </a>
                        <a
                          href={contentUrl}
                          download
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                        >
                          <Download size={13} /> Download PDF
                        </a>
                      </div>
                    </div>
                  ) : isImage ? (
                    <div className="space-y-3 text-center">
                      <img
                        src={contentUrl}
                        alt={title}
                        className="max-h-[520px] w-full object-contain rounded-xl"
                      />
                      <a
                        href={contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                      >
                        <ExternalLink size={13} /> View full resolution
                      </a>
                    </div>
                  ) : contentUrl ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                      <FileText size={44} className="mx-auto text-sky-600" />
                      <h4 className="mt-3 text-base font-bold text-slate-900">Document Attached</h4>
                      <p className="mt-1 max-w-md mx-auto truncate text-xs text-slate-500">{rawUrl}</p>
                      <div className="mt-5 flex justify-center gap-3">
                        <a
                          href={contentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition"
                        >
                          <ExternalLink size={14} /> Open Document
                        </a>
                        <a
                          href={contentUrl}
                          download
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Download size={14} /> Download File
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <FileText size={40} className="mx-auto text-slate-300" />
                      <p className="mt-2 text-sm font-bold text-slate-700">No document attached</p>
                    </div>
                  )}
                </div>
              )}

              {contentType === "link" && (
                <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                  <LinkIcon size={44} className="mx-auto text-amber-600" />
                  <h4 className="mt-3 text-base font-bold text-slate-900">
                    External Learning Resource
                  </h4>
                  <p className="mt-1 break-all text-xs text-slate-500 max-w-lg mx-auto">
                    {rawUrl || "No URL provided"}
                  </p>
                  {contentUrl && (
                    <a
                      href={contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                    >
                      <ExternalLink size={14} /> Visit Resource Link
                    </a>
                  )}
                </div>
              )}

              {contentType === "text" && (
                <div className="rounded-xl bg-white p-6 sm:p-8 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Lesson Article Content
                  </h4>
                  <div className="mt-3 prose prose-slate max-w-none text-sm leading-relaxed text-slate-700">
                    {description ? (
                      <RichTextContent html={description} />
                    ) : (
                      <p className="italic text-slate-400">No text content added to this lesson.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Details & Configuration Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Clock size={13} className="text-slate-500" /> Duration
                </span>
                <p className="mt-1 text-base font-black text-slate-900">
                  {duration > 0 ? `${duration} Minutes` : "Self-paced"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Icon size={13} className="text-slate-500" /> Content Type
                </span>
                <p className="mt-1 text-base font-black capitalize text-slate-900">
                  {config.label}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Layers size={13} className="text-slate-500" /> Drip Unlock
                </span>
                <p className="mt-1 text-base font-black text-slate-900">
                  {dripDays > 0 ? `Unlocks Day ${dripDays}` : "Instant Access (Day 0)"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Eye size={13} className="text-slate-500" /> Access Permission
                </span>
                <p className="mt-1 text-base font-black text-slate-900">
                  {isPreview ? "Public Preview" : "Enrolled Only"}
                </p>
              </div>
            </div>

            {/* Description (if not text lesson) */}
            {contentType !== "text" && description && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Lesson Summary & Instructions
                </h4>
                <div className="mt-2 text-sm leading-relaxed text-slate-700">
                  <RichTextContent html={description} />
                </div>
              </div>
            )}

            {/* Topics Covered (if any) */}
            {topics.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Topics Covered ({topics.length})
                </h4>
                <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {topics.map((t, i) => (
                    <div key={t.id || i} className="flex items-center justify-between p-3 text-xs">
                      <span className="font-semibold text-slate-800">
                        {i + 1}. {t.title}
                      </span>
                      {t.durationMinutes > 0 && (
                        <span className="text-slate-400">{t.durationMinutes} min</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer (No next/prev buttons!) */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-3.5 shrink-0">
          <div className="text-xs text-slate-500">
            {lesson?.id && <span className="font-mono">ID: {lesson.id}</span>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
