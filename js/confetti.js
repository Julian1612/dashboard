const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = []; // Im globalen Scope gelassen, da handleTaskChange darauf zugreift

/** Löst den Konfetti-Regen aus. */
function triggerConfetti() {
    particles = [];
    const particleCount = 100;
    // GEÄNDERT: Konfetti-Farben auf Bauhaus-Palette (Rot/Gelb/Blau)
    const colors = ['#ef4444', '#facc15', '#3b82f6', '#dc2626'];
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 5 + 2,
            speedX: (Math.random() - 0.5) * 8,
            speedY: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
        });
    }
}

/** Die Haupt-Animationsschleife für Konfetti. */
function animateConfetti() {
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
    requestAnimationFrame(animateConfetti);
}

/** Passt die Größe der Canvas an die Fenstergröße an. */
function resizeCanvas() { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
}

// Event Listener für die Fenstergröße
window.addEventListener('resize', resizeCanvas);


// Funktionen und Variablen im globalen Scope bereitstellen
window.triggerConfetti = triggerConfetti;
window.animateConfetti = animateConfetti;
window.resizeCanvas = resizeCanvas;
window.particles = particles; // Für checklist.js zugänglich machen