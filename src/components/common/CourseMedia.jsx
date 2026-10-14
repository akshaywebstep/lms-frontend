import { useState } from 'react'
import { PlayCircle } from 'lucide-react'
import { resolveMediaUrl } from '../../utils/media'
import { getVideoEmbedUrl, isDirectVideoUrl } from '../../utils/video'

export default function CourseMedia({ course, className = '', compact = false }) {
  const [imgError, setImgError] = useState(false)
  const title = course?.title || 'Course media'
  const rawThumbnail = course?.thumbnailUrl || course?.thumbnail || course?.thumbnail_url || ''
  const thumbnailUrl = resolveMediaUrl(rawThumbnail)
  const promoVideo = course?.promoVideo || course?.promo_video || ''
  const videoUrl = resolveMediaUrl(promoVideo)
  const embedUrl = getVideoEmbedUrl(promoVideo, { compact })
  const canPlayDirect = videoUrl && isDirectVideoUrl(videoUrl)

  // 1. COMPACT / LIST / CARD MODE:
  // In course cards (catalogs, my-courses, student dashboard), ALWAYS prefer the thumbnail image!
  if (compact) {
    if (thumbnailUrl && !imgError) {
      return (
        <div className={`relative h-full w-full overflow-hidden bg-slate-900 group ${className}`}>
          <img
            src={thumbnailUrl}
            alt={title}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {promoVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-indigo-600 shadow-lg">
                <PlayCircle size={20} />
              </span>
            </div>
          )}
        </div>
      )
    }

    if (canPlayDirect) {
      return (
        <video
          className={`h-full w-full object-cover ${className}`}
          src={videoUrl}
          muted
          loop
          autoPlay
          playsInline
        />
      )
    }

    if (embedUrl) {
      return (
        <iframe
          className={`h-full w-full pointer-events-none ${className}`}
          src={embedUrl}
          title={title}
          allow="autoplay; encrypted-media"
        />
      )
    }

    return (
      <div className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-600 p-4 text-center text-white ${className}`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl font-black text-white shadow-inner backdrop-blur-sm">
          {(title[0] || 'C').toUpperCase()}
        </div>
        <span className="mt-2 text-[11px] font-bold text-white/90 drop-shadow line-clamp-1">{title}</span>
      </div>
    )
  }

  // 2. FULL PLAYER MODE (Course detail / watch view):
  if (canPlayDirect) {
    return (
      <video
        className={`h-full w-full object-cover ${className}`}
        src={videoUrl}
        poster={!imgError && thumbnailUrl ? thumbnailUrl : undefined}
        controls
        preload="metadata"
        playsInline
        aria-label={`${title} promo video`}
      />
    )
  }

  if (embedUrl) {
    return (
      <iframe
        className={`h-full w-full ${className}`}
        src={embedUrl}
        title={`${title} promo video`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    )
  }

  return (
    <div className={`relative h-full w-full overflow-hidden bg-slate-900 ${className}`}>
      {thumbnailUrl && !imgError ? (
        <img
          src={thumbnailUrl}
          alt={title}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-600 p-6 text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl font-black text-white shadow-inner backdrop-blur-sm">
            {(title[0] || 'C').toUpperCase()}
          </div>
          <span className="mt-3 text-sm font-bold text-white/90 drop-shadow">{title}</span>
        </div>
      )}
    </div>
  )
}