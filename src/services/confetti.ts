import confetti from 'canvas-confetti'

export function triggerJoyfulConfetti() {
  // Pastel and warm colors: rose, amber, coral, sky, gold
  const colors = ['#f43f5e', '#fb7185', '#f59e0b', '#fbbf24', '#38bdf8', '#c084fc']

  confetti({
    particleCount: 50,
    spread: 70,
    origin: { y: 0.65 },
    colors
  })
}

export function triggerAnniversaryExplosion() {
  const duration = 2.5 * 1000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  const interval: any = setInterval(function () {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 40 * (timeLeft / duration)
    // fireworks from both sides
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
}
