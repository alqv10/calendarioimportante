import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Music, ExternalLink, Volume2 } from 'lucide-react'

interface MiniAudioPlayerProps {
  audioData?: string
  songTitle?: string
  songArtist?: string
  songUrl?: string
  compact?: boolean
}

export const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = ({
  audioData,
  songTitle,
  songArtist,
  songUrl,
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(err => {
        console.warn('Audio playback failed', err)
      })
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  const openSongLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (songUrl) {
      window.open(songUrl, '_blank')
    }
  }

  const displayName = songTitle || (audioData ? 'Grabación / Canción del día' : 'Canción especial')

  return (
    <div
      onClick={e => e.stopPropagation()}
      className={`rounded-xl border transition-all ${
        compact
          ? 'p-2 bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-2 text-xs'
          : 'p-3 bg-gradient-to-r from-rose-50 to-amber-50/60 dark:from-rose-950/40 dark:to-stone-900/60 border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-sm'
      }`}
    >
      {audioData && (
        <audio
          ref={audioRef}
          src={audioData}
          onEnded={handleEnded}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          className="hidden"
        />
      )}

      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Play/Pause Button if audio uploaded, else music icon */}
        {audioData ? (
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-xs transition-transform transform active:scale-95 flex-shrink-0 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <Music className="w-4 h-4" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-stone-900 dark:text-stone-100 truncate text-xs sm:text-sm">
              {displayName}
            </span>
            {isPlaying && (
              <span className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 h-3 bg-rose-500 animate-pulse" />
                <span className="w-0.5 h-2 bg-rose-400 animate-pulse delay-75" />
                <span className="w-0.5 h-3.5 bg-rose-500 animate-pulse delay-150" />
              </span>
            )}
          </div>
          {songArtist && (
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              {songArtist}
            </p>
          )}
        </div>
      </div>

      {/* External Link if provided */}
      {songUrl && (
        <button
          type="button"
          onClick={openSongLink}
          title="Escuchar en Spotify / YouTube"
          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-white dark:hover:bg-stone-800 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
        >
          <span>Abrir</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      )}

      {audioData && !songUrl && (
        <div className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 pr-1">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Audio</span>
        </div>
      )}
    </div>
  )
}
