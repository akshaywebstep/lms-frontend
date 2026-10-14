import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Layers,
  Link as LinkIcon,
  PlayCircle,
  Sparkles,
  Type,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { resolveMediaUrl } from "../../utils/media";
import { getVideoEmbedUrl, isDirectVideoUrl } from "../../utils/video";
import RichTextContent from "../../components/common/RichTextContent";

const typeLabels = {
  video: { label: "Video Lesson", icon: Film, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  document: { label: "Document", icon: FileText, color: "text-sky-600 bg-sky-50 border-sky-100" },
  link: { label: "External Link", icon: LinkIcon, color: "text-amber-600 bg-amber-50 border-amber-100" },
  text: { label: "Text Article", icon: Type, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
};

export default function PreviewLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchLesson = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/coach/lessons/${id}`);
        if (!alive) return;
        setLesson(res.lesson || null);
      } catch (err) {
        if (!alive) return;
        toast.error(err?.message || "Failed to load lesson preview");
      } finally {
        if (alive) setLoading(false);
      }
    };
    if (id) fetchLesson();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-500 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-semibold">Loading lesson from backend API...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
        <p className="text-base font-bold text-slate-700">Lesson not found</p>
        <p className="mt-1 text-xs text-slate-400">The requested lesson does not exist or was deleted.</p>
        <button
          onClick={() => navigate("/coach/manage-lessons")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={14} /> Back to Lessons
        </button>
      </div>
    );
  }

  const title = lesson.title || "Untitled Lesson";
  const description = lesson.description || "";
  const contentType = (lesson.contentType || lesson.content_type || "video").toLowerCase();
  const rawUrl = lesson.contentUrl || lesson.content_url || "";
  const contentUrl = resolveMediaUrl(rawUrl);
  const duration = lesson.durationMinutes ?? lesson.duration_minutes ?? 0;
  const dripDays = lesson.dripDays ?? lesson.drip_days ?? 0;
  const sortOrder = lesson.sortOrder ?? lesson.sort_order ?? 1;
  const status = lesson.status || "published";
  const isPreview = Boolean(lesson.isPreview ?? lesson.is_preview);
  const course = lesson.course || {};
  const topics = lesson.topics || [];

  const config = typeLabels[contentType] || typeLabels.video;
  const Icon = config.icon;
  const embedUrl = getVideoEmbedUrl(rawUrl);
  const isDirectVideo = contentUrl && isDirectVideoUrl(contentUrl);
  const isPdf = /\.(pdf)(\?.*)?$/i.test(contentUrl) || rawUrl.toLowerCase().includes("/pdf");
  const isImage = /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(contentUrl);

  return (
    <div className="mx-auto max-w-5xl space-y-6 text-left">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link
            to="/coach/manage-lessons"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-indigo-600"
          >
            <ArrowLeft size={14} /> Back to Content Builder
          </Link>
          <span className="text-slate-300">/</span>
          {course.title && (
            <>
              <span className="font-semibold text-slate-700 truncate max-w-[200px]">{course.title}</span>
              <span className="text-slate-300">/</span>
            </>
          )}
          <span className="text-slate-500">Single Lesson Preview</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              status === "published"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
            }`}
          >
            {status}
          </span>
          {isPreview && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">
              <Sparkles size={12} /> Free Preview
            </span>
          )}
        </div>
      </div>

      {/* Lesson Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                Lesson Order: #{sortOrder}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${config.color}`}>
                <Icon size={13} /> {config.label}
              </span>
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                {dripDays > 0 ? `Drip Unlock: Day ${dripDays}` : "Instant Access (Day 0)"}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
              {title}
            </h1>
            {course.title && (
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Part of: <span className="font-bold text-slate-700">{course.title}</span>
              </p>
            )}
          </div>
        </div>
      </div>

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
                <PlayCircle size={52} className="text-indigo-400" />
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
                <Film size={48} className="text-slate-600" />
                <p className="mt-3 text-sm font-bold text-slate-300">No video attached to this lesson</p>
                <p className="mt-1 text-xs text-slate-500">
                  Upload an MP4 file or paste a video URL in the content builder.
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
                  className="h-[560px] w-full rounded-xl border border-slate-200"
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
                  className="max-h-[560px] w-full object-contain rounded-xl"
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
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
                <FileText size={48} className="mx-auto text-sky-600" />
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
              <div className="p-10 text-center text-slate-500">
                <FileText size={40} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-bold text-slate-700">No document file attached</p>
              </div>
            )}
          </div>
        )}

        {contentType === "link" && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <LinkIcon size={48} className="mx-auto text-amber-600" />
            <h4 className="mt-3 text-lg font-bold text-slate-900">
              External Learning Link
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
                <ExternalLink size={14} /> Visit External Resource
              </a>
            )}
          </div>
        )}

        {contentType === "text" && (
          <div className="rounded-xl bg-white p-6 sm:p-8 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lesson Text Content
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

      {/* Lesson Specifications Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Clock size={13} className="text-slate-500" /> Duration
          </span>
          <p className="mt-1 text-base font-black text-slate-900">
            {duration > 0 ? `${duration} Minutes` : "Self-paced"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Icon size={13} className="text-slate-500" /> Format
          </span>
          <p className="mt-1 text-base font-black capitalize text-slate-900">
            {config.label}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Layers size={13} className="text-slate-500" /> Drip Pacing
          </span>
          <p className="mt-1 text-base font-black text-slate-900">
            {dripDays > 0 ? `Unlocks Day ${dripDays}` : "Instant (Day 0)"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Eye size={13} className="text-slate-500" /> Access
          </span>
          <p className="mt-1 text-base font-black text-slate-900">
            {isPreview ? "Public Preview" : "Enrolled Students"}
          </p>
        </div>
      </div>

      {/* Description / Summary */}
      {contentType !== "text" && description && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lesson Description & Notes
          </h3>
          <div className="mt-3 text-sm leading-relaxed text-slate-700">
            <RichTextContent html={description} />
          </div>
        </div>
      )}

      {/* Topics breakdown if any */}
      {topics.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Topics in this Lesson ({topics.length})
          </h3>
          <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {topics.map((t, i) => (
              <div key={t.id || i} className="flex items-center justify-between p-3.5 text-xs">
                <span className="font-semibold text-slate-800">
                  {i + 1}. {t.title}
                </span>
                {t.durationMinutes > 0 && (
                  <span className="text-slate-400 font-medium">{t.durationMinutes} min</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
