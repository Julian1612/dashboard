// js/visual-timer.js

export class VisualTimer {
    /**
     * Erstellt eine neue Instanz des visuellen Timers.
     * @param {SVGElement} svgElement - Das Haupt-SVG-Element.
     * @param {SVGGElement} faceGroup - Die Gruppe <g>, in die Striche/Zahlen gezeichnet werden.
     * @param {SVGPathElement} wedgeElement - Der rote Pfad (Keil).
     * @param {HTMLElement} displayElement - Das Element für die digitale Zeitanzeige (optional).
     * @param {Function} onTimeChangeCallback - Callback (seconds) wenn der User die Zeit ändert.
     */
    constructor(svgElement, faceGroup, wedgeElement, displayElement, onTimeChangeCallback) {
        this.svg = svgElement;
        this.faceGroup = faceGroup;
        this.wedge = wedgeElement;
        this.display = displayElement;
        this.onTimeChange = onTimeChangeCallback;
        
        this.isDragging = false;
        this.totalSeconds = 0;
        this.initialSeconds = 0; // Für die relative Favicon-Berechnung
        
        // Favicon Canvas Setup (Offscreen)
        this.favCanvas = document.createElement('canvas');
        this.favCanvas.width = 32;
        this.favCanvas.height = 32;
        this.favCtx = this.favCanvas.getContext('2d');

        this.drawFace(); 
        this.setupEvents(); 
        this.updateFavicon(); // Initial leer
    }

    /**
     * Zeichnet die Minutenstriche und Zahlen auf das Ziffernblatt.
     */
    drawFace() {
        this.faceGroup.innerHTML = '';
        const cx = 50, cy = 50, r = 48;
        
        // 1. Minutenschritte (60 Striche)
        for (let i = 0; i < 60; i++) {
            const angle = (i * 6) * (Math.PI / 180);
            const is5min = i % 5 === 0;
            const length = is5min ? 4 : 1.5; 
            const width = is5min ? 0.8 : 0.4;
            
            const x1 = cx + (r - length) * Math.sin(angle);
            const y1 = cy - (r - length) * Math.cos(angle);
            const x2 = cx + r * Math.sin(angle);
            const y2 = cy - r * Math.cos(angle);
            
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x1); line.setAttribute("y1", y1);
            line.setAttribute("x2", x2); line.setAttribute("y2", y2);
            line.setAttribute("stroke", "#1f2937"); 
            line.setAttribute("stroke-width", width);
            line.setAttribute("stroke-linecap", "round");
            this.faceGroup.appendChild(line);
        }

        // 2. Zahlen (5, 10... 55, 0)
        const textR = 36; 
        const numbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
        
        numbers.forEach(num => {
            if(num === 0 && numbers.includes(60)) return; 
            
            const angle = (num * 6) * (Math.PI / 180);
            const x = cx + textR * Math.sin(angle);
            const y = cy - textR * Math.cos(angle);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", x);
            text.setAttribute("y", y);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("font-family", "Inter, sans-serif");
            text.setAttribute("font-size", "7"); 
            text.setAttribute("font-weight", "800");
            text.setAttribute("fill", "#1f2937"); 
            text.textContent = num.toString();
            
            this.faceGroup.appendChild(text);
        });
    }

    setupEvents() {
        const handleStart = (e) => {
            if (e.type === 'mousedown' && e.button !== 0) return;
            this.isDragging = true;
            this.updateFromEvent(e);
        };
        const handleMove = (e) => {
            if (this.isDragging) {
                e.preventDefault(); 
                this.updateFromEvent(e);
            }
        };
        const handleEnd = () => { this.isDragging = false; };

        this.svg.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        this.svg.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    }

    updateFromEvent(e) {
        const rect = this.svg.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        let angle = Math.atan2(dy, dx); 
        angle += Math.PI / 2; 
        if (angle < 0) angle += 2 * Math.PI;
        
        let percent = angle / (2 * Math.PI);
        const steps = 60;
        percent = Math.round(percent * steps) / steps;

        this.totalSeconds = Math.round(percent * 3600);
        
        // WICHTIG: Wenn der User zieht, setzen wir die "Basis" für das Favicon neu.
        // Damit ist "Voll" immer das, was der User gerade einstellt.
        this.initialSeconds = this.totalSeconds; 
        
        this.draw();
        
        if (this.onTimeChange) this.onTimeChange(this.totalSeconds);
    }

    /**
     * Setzt die Zeit (Tick-Logik).
     * Hier ändern wir NICHT initialSeconds, damit das Favicon relativ zur Startzeit schrumpft.
     */
    setTime(seconds) {
        this.totalSeconds = Math.max(0, Math.min(3600, seconds));
        
        // Falls durch irgendeinen Reset die Zeit größer als Initial ist, passen wir an.
        if (this.totalSeconds > this.initialSeconds) {
            this.initialSeconds = this.totalSeconds;
        }
        
        this.draw();
    }

    draw() {
        // 1. SVG Update (Time Timer im Dashboard)
        const cx = 50, cy = 50, r = 48;
        const minutes = this.totalSeconds / 60;
        const angle = (minutes / 60) * 2 * Math.PI;
        
        const x = cx + r * Math.sin(angle);
        const y = cy - r * Math.cos(angle);
        const largeArcFlag = angle > Math.PI ? 1 : 0;
        
        let d = "";
        if (this.totalSeconds <= 0) {
            d = ""; 
            if(this.display) this.display.textContent = "00:00";
        } else if (this.totalSeconds >= 3600) {
            d = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} L ${cx} ${cy} Z`;
        } else {
            d = `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArcFlag} 1 ${x} ${y} Z`;
        }
        this.wedge.setAttribute("d", d);
        
        if(this.display) {
            const m = Math.floor(this.totalSeconds / 60);
            const s = this.totalSeconds % 60;
            this.display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }

        // 2. Favicon Update
        this.updateFavicon();
    }

    updateFavicon() {
        const ctx = this.favCtx;
        const w = 32;
        const h = 32;
        const cx = w / 2;
        const cy = h / 2;
        const r = 14; // Radius im Icon

        ctx.clearRect(0, 0, w, h);

        // Hintergrund (Weißer Kreis)
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#e2e8f0'; // Slate-200 Rand
        ctx.stroke();

        // Roter Keil (Relativ zur Initialzeit!)
        if (this.totalSeconds > 0 && this.initialSeconds > 0) {
            const ratio = this.totalSeconds / this.initialSeconds;
            // Voller Kreis = 100%, Start bei -90deg (12 Uhr)
            const endAngle = (ratio * 2 * Math.PI) - (Math.PI / 2);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            // Wir zeichnen von 12 Uhr im Uhrzeigersinn bis zum aktuellen Stand
            ctx.arc(cx, cy, r, -Math.PI / 2, endAngle, false);
            ctx.lineTo(cx, cy);
            ctx.fillStyle = '#ef4444'; // Red-500
            ctx.fill();
        } 
        
        // Kleiner Mittelpunkt für Look & Feel
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        // Link Tag updaten
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = this.favCanvas.toDataURL();
    }
}