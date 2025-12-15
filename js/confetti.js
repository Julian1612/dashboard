// js/confetti.js

const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() { 
    if (canvas) {
        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight; 
    }
}

function animateConfetti() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, index) => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY = p.speedY > 20 ? 20 : p.speedY + 0.1; 
            p.life -= 0.01;
            if (p.life <= 0 || p.y > canvas.height) {
                particles.splice(index, 1);
            } else {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    requestAnimationFrame(animateConfetti);
}

/**
 * Löst die Konfetti-Animation aus.
 */
export function triggerConfetti() {
    particles = [];
    const particleCount = 100;
    const colors = ['#22c55e', '#10b981', '#34d399', '#6ee7b7'];
    // Die Konfetti-Partikel werden leicht über dem oberen Rand des Bildschirms platziert.
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * -0.5, // Startet über dem Bildschirm
            size: Math.random() * 5 + 2,
            speedX: (Math.random() - 0.5) * 8,
            speedY: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
        });
    }
}

/**
 * Initialisiert den Confetti-Canvas und startet die Animationsschleife.
 */
export function initConfetti() {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animateConfetti();
}