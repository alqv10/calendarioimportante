type Confetti = typeof import('canvas-confetti')

let confettiPromise: Promise<Confetti> | null = null

/**
 * El confeti es decorativo y solo aparece tras una acción del usuario, así que
 * no tiene por qué entrar en el bundle inicial. Si el chunk no carga, se ignora:
 * nunca debe romper la acción que lo disparó.
 *
 * El paquete se tipa con `export =` pero se publica como ESM, así que el módulo
 * puede llegar como la función o envuelta en `default`.
 */
function loadConfetti(): Promise<Confetti> {
  confettiPromise ??= import('canvas-confetti').then(module => {
    const loaded = module as Confetti & { default?: Confetti }
    return loaded.default ?? loaded
  })
  return confettiPromise
}

export function triggerJoyfulConfetti(): void {
  // Colores pastel y cálidos: rosa, ámbar, coral, cielo, dorado
  const colors = ['#f43f5e', '#fb7185', '#f59e0b', '#fbbf24', '#38bdf8', '#c084fc']

  void loadConfetti().then(confetti => {
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.65 }, colors })
  }).catch(() => {})
}

export function triggerAnniversaryExplosion(): void {
  void loadConfetti().then(confetti => {
    const duration = 2.5 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 40 * (timeLeft / duration)
      // fuegos artificiales desde ambos lados
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.2, y: Math.random() - 0.2 },
        colors: ['#f43f5e', '#ec4899', '#f59e0b', '#a855f7']
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.8, y: Math.random() - 0.2 },
        colors: ['#38bdf8', '#34d399', '#f43f5e', '#facc15']
      })
    }, 250)
  }).catch(() => {})
}
