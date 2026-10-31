import { useState, useEffect } from 'react'
import { X, Heart, Sparkles, Flower2 } from 'lucide-react'
import { triggerAnniversaryExplosion, triggerJoyfulConfetti } from '../services/confetti'

interface GraceEasterEggModalProps {
  isOpen: boolean
  onClose: () => void
}

export const GraceEasterEggModal: React.FC<GraceEasterEggModalProps> = ({ isOpen, onClose }) => {
  const [roseCount, setRoseCount] = useState(1)

  useEffect(() => {
    if (isOpen) {
      triggerAnniversaryExplosion()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleGiveRose = () => {
    setRoseCount(prev => prev + 1)
    triggerJoyfulConfetti()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1a1822] rounded-2xl border border-rose-300 dark:border-rose-900/60 shadow-2xl overflow-hidden p-6 text-center">
        
        {/* Glow backdrop */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Romantic Icon */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 mb-4 animate-bounce">
          <Flower2 className="w-10 h-10 stroke-[2.5]" />
          <span className="absolute -bottom-1 -right-1 text-xl">✨</span>
        </div>

        {/* Title */}
        <div className="inline-block px-3 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
          🌸 Easter Egg Secreto
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
          ¡Para <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">Grace</span>! 💖
        </h2>

        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
          La inspiración detrás de cada detalle de este proyecto
        </p>

        {/* Heartfelt Note */}
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-b from-rose-50/70 to-amber-50/40 dark:from-rose-950/30 dark:to-stone-900/50 border border-rose-200/70 dark:border-rose-900/40 text-stone-700 dark:text-stone-300 text-sm leading-relaxed italic font-serif">
          "Dicen que los momentos pasan volando, pero contigo cada recuerdo se vuelve eterno. Este calendario existe para celebrar cada sonrisa a tu lado."
        </div>

        {/* Interactive Rose Counter */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <span>Rosas para Grace:</span>
            <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-extrabold">
              {roseCount} 🌹
            </span>
          </div>

          <button
            onClick={handleGiveRose}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4 fill-white animate-pulse" />
            <span>Regalar otra rosa virtual</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-4">
          💡 Truco: Puedes abrir esta sorpresa en cualquier momento escribiendo <strong>grace</strong> con tu teclado.
        </p>

      </div>
    </div>
  )
}
