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
        
        this.drawFace(); // Generiert das Ziffernblatt
        this.setupEvents(); // Aktiviert Drag & Drop
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
            const length = is5min ? 4 : 1.5; // Lange vs kurze Striche
            const width = is5min ? 0.8 : 0.4;
            
            // Koordinaten für Start und Ende des Strichs
            // Wir nutzen sin/cos so, dass 0 oben ist (bei i=0 -> sin(0)=0, cos(0)=1 -> x=cx, y=cy-r)
            const x1 = cx + (r - length) * Math.sin(angle);
            const y1 = cy - (r - length) * Math.cos(angle);
            const x2 = cx + r * Math.sin(angle);
            const y2 = cy - r * Math.cos(angle);
            
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x1); line.setAttribute("y1", y1);
            line.setAttribute("x2", x2); line.setAttribute("y2", y2);
            line.setAttribute("stroke", "#1f2937"); // Slate-800
            line.setAttribute("stroke-width", width);
            line.setAttribute("stroke-linecap", "round");
            this.faceGroup.appendChild(line);
        }

        // 2. Zahlen (5, 10, ... 55, 0)
        // Positioniert weiter innen als die Striche
        const textR = 36; 
        const numbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
        
        numbers.forEach(num => {
            if(num === 0 && numbers.includes(60)) return; // Nur 0 anzeigen
            
            // Winkel berechnen (0 ist oben)
            const angle = (num * 6) * (Math.PI / 180);
            const x = cx + textR * Math.sin(angle);
            const y = cy - textR * Math.cos(angle);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", x);
            text.setAttribute("y", y);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("font-family", "Inter, sans-serif");
            text.setAttribute("font-size", "7"); // Schriftgröße relativ zu ViewBox
            text.setAttribute("font-weight", "800");
            text.setAttribute("fill", "#1f2937"); // Slate-800
            
            // Text setzen (0 statt 60)
            text.textContent = num.toString();
            
            this.faceGroup.appendChild(text);
        });
    }

    /**
     * Registriert Maus- und Touch-Events für die Interaktion.
     */
    setupEvents() {
        const handleStart = (e) => {
            // Nur linke Maustaste oder Touch
            if (e.type === 'mousedown' && e.button !== 0) return;
            this.isDragging = true;
            this.updateFromEvent(e);
        };
        const handleMove = (e) => {
            if (this.isDragging) {
                e.preventDefault(); // Verhindert Scrollen auf Touch-Geräten
                this.updateFromEvent(e);
            }
        };
        const handleEnd = () => {
            this.isDragging = false;
        };

        this.svg.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);

        this.svg.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    }

    /**
     * Berechnet die Zeit basierend auf der Mausposition relativ zur Mitte.
     */
    updateFromEvent(e) {
        const rect = this.svg.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        // Winkel berechnen
        // atan2(y, x) gibt Winkel zur X-Achse (3 Uhr). 
        // Wir wollen Winkel zur Y-Achse (12 Uhr) im Uhrzeigersinn.
        // dx, dy -> atan2(dy, dx)
        // 12 Uhr: x=0, y=-1 -> atan2(-1, 0) = -PI/2. Wir wollen 0.
        // 3 Uhr: x=1, y=0 -> atan2(0, 1) = 0. Wir wollen PI/2.
        
        let angle = Math.atan2(dy, dx); 
        
        // Transformieren: +90 Grad (PI/2), damit 0 oben ist
        angle += Math.PI / 2; 
        
        // Normalisieren auf 0 bis 2PI
        if (angle < 0) angle += 2 * Math.PI;
        
        // Prozent des Kreises (0.0 bis 1.0)
        let percent = angle / (2 * Math.PI);
        
        // Runden auf Minuten-Raster (60 Schritte), damit es "einrastet"
        const steps = 60;
        percent = Math.round(percent * steps) / steps;

        // Zeit berechnen (Max 60 Minuten = 3600 Sekunden)
        this.totalSeconds = Math.round(percent * 3600); 
        
        // Kleine UX-Korrektur: Wenn man ganz nah an 0 ist, aber leicht links, wird es 60.
        // Das ist okay, entspricht 60 Min. 0 Min ist ganz oben.
        
        this.draw();
        
        if (this.onTimeChange) this.onTimeChange(this.totalSeconds);
    }

    /**
     * Setzt die Zeit manuell (z.B. durch Timer-Logik).
     * @param {number} seconds 
     */
    setTime(seconds) {
        this.totalSeconds = Math.max(0, Math.min(3600, seconds));
        this.draw();
        if (this.display) this.updateDigitalDisplay();
    }

    updateDigitalDisplay() {
        const m = Math.floor(this.totalSeconds / 60);
        const s = this.totalSeconds % 60;
        this.display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    /**
     * Zeichnet den roten Keil basierend auf this.totalSeconds.
     */
    draw() {
        const cx = 50, cy = 50, r = 48;
        const minutes = this.totalSeconds / 60;
        
        // Winkel im Bogenmaß (0 oben, im Uhrzeigersinn)
        const angle = (minutes / 60) * 2 * Math.PI;
        
        // Zielkoordinaten auf Kreisrand berechnen
        // x = cx + r * sin(angle)
        // y = cy - r * cos(angle)
        const x = cx + r * Math.sin(angle);
        const y = cy - r * Math.cos(angle);
        
        // Large Arc Flag: Muss der Bogen > 180 Grad sein?
        const largeArcFlag = angle > Math.PI ? 1 : 0;
        
        let d = "";
        
        if (this.totalSeconds <= 0) {
            d = ""; // Zeit abgelaufen -> Kein Rot
        } else if (this.totalSeconds >= 3600) {
            // Voller Kreis (fast, SVG mag keine kompletten Kreise als Path manchmal, daher 359.9°)
            // Einfacher: Zwei Arcs oder Move close.
            d = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} L ${cx} ${cy} Z`;
        } else {
            // Pfad: 
            // 1. Move zur Mitte (M cx cy)
            // 2. Line nach oben (L cx cy-r)
            // 3. Arc zum Zielpunkt (A ...)
            // 4. Line zurück zur Mitte (Z schließt automatisch zur Startkoordinate, aber Start war Mitte)
            
            // Sauberer Time Timer Style:
            // M 50 50 -> L 50 2 -> A ... -> Z
            d = `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArcFlag} 1 ${x} ${y} Z`;
        }
        
        this.wedge.setAttribute("d", d);
        this.updateDigitalDisplay();
    }
}