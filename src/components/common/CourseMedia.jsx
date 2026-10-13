import { useState } from 'react'
import { PlayCircle } from 'lucide-react'
import { resolveMediaUrl } from '../../utils/media'
import { getVideoEmbedUrl, isDirectVideoUrl } from '../../utils/video'

export default function CourseMedia({ course, className = '', compact = false }) {
  const [imgError, setImgError] = useState(false)
  const title = course?.title || 'Course media'
  const thumbnailUrl = resolveMediaUrl(course?.thumbnailUrl)
  const promoVideo = course?.promoVideo || ''
  const videoUrl = resolveMediaUrl(promoVideo)
  const embedUrl = getVideoEmbedUrl(promoVideo, { compact })
  const canPlayDirect = videoUrl && isDirectVideoUrl(videoUrl)

  if (canPlayDirect) {
    return (
      <video
        className={`h-full w-full object-cover ${className}`}
        src={videoUrl}
        poster={!imgError && thumbnailUrl ? thumbnailUrl : undefined}
        controls={!compact}
        autoPlay={compact}
        muted={compact}
        loop={compact}
        preload={compact ? 'auto' : 'metadata'}
        playsInline
        aria-label={`${title} promo video`}
      />
    )
  }

  if (embedUrl) {
    return <iframe className={`h-full w-full ${compact ? 'pointer-events-none' : ''} ${className}`} src={embedUrl} title={`${title} promo video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
  }

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br from-indigo-500 to-sky-600 text-white ${className}`}>
      {thumbnailUrl && !imgError ? (
        <img
          src={thumbnailUrl}
          alt={title}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl font-black text-white shadow-inner backdrop-blur-sm">
            {(title[0] || 'C').toUpperCase()}
          </div>
          <span className="mt-2 text-xs font-bold text-white/90 drop-shadow line-clamp-1">{title}</span>
        </div>
      )}
      {promoVideo && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20"><span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-indigo-700 shadow-lg"><PlayCircle size={26} /></span></div>}
    </div>
  )
}