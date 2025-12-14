# Fokus Tag Dashboard Pro

Ein minimalistisches, aufgeräumtes Dashboard zur Steigerung der täglichen Produktivität. Das Design ist inspiriert von den klaren, funktionalen Prinzipien des **Bauhauses** und der **Braun-Ära**, um Ablenkungen radikal zu minimieren und maximale kognitive Klarheit zu schaffen.

## ⚙️ Setup und Start

Das Projekt ist ein reines Frontend-Projekt und erfordert keinen Build-Prozess.

1.  **Repository klonen:**
    ```bash
    git clone [REPO_URL]
    cd dashboard
    ```
2.  **Starten:** Öffnen Sie die Datei `index.html` in Ihrem Browser.
    *(Alternativ: Starten Sie einen lokalen Webserver, z.B. mit VS Code Live Server Extension oder `python3 -m http.server`.)*

## 📁 Projektstruktur

Alle JavaScript-Module sind so konzipiert, dass sie auf das globale `window`-Objekt angewiesen sind, um miteinander zu kommunizieren.

dashboard/ ├── css/ │ └── style.css # Tailwind-Ergänzungen und Custom-Styles (Bauhaus/Braun-Anpassungen) ├── img/ │ └── favicon.png # App-Symbol (Minimalistisches Anker-Design: Struktur & Ausrichtung) ├── js/ │ ├── checklist.js # Kernlogik für das Laden, Speichern und Rendern der Tages-Checkliste (Local Storage) │ ├── confetti.js # Logik für den Konfetti-Effekt (visuelles Feedback bei Erfolg) │ ├── main.js # Start-Logik (Initialisierung aller Komponenten nach DOMContentLoaded) │ ├── musicPlayer.js # Steuerung des SoundCloud iFrame-Widgets über die SC Widget API │ ├── timer.js # Pomodoro-Timer, 90-Minuten-Zyklus-Tracker und Modals-Logik │ └── utils.js # Hilfsfunktionen (z.B. UUID-Generator) └── index.html # Hauptstruktur (HTML5) mit Tailwind-Klassen und Komponenten-Containern


## ✨ Kern-Features

* **Deep Work Timer:** Einstellbarer Timer (standardmäßig 45 Minuten) mit Start/Pause-Funktion.
* **Visueller Fortschritt:** Der Timer wird durch einen **roten** Fortschrittskreis visualisiert.
* **90-Minuten-Zyklus-Tracker:** Akkumuliert die Fokuszeit (unabhängig vom Timer-Reset), um nach 90 Minuten eine notwendige Pause zu signalisieren (Blauer Fortschrittsbalken).
* **Dynamische Tages-Checkliste:**
    * Drei Kategorien (`Morgen-Start`, `Fokus-Flow`, `Tages-Abschluss`).
    * Speicherung des Zustands und des Inhalts im Local Storage.
    * Editier-Modal mit Drag-and-Drop-Reihenfolge zur einfachen Verwaltung.
    * Aufgaben können optionale **URLs** (für Links) und **Zeitangaben** (für Quick-Start des Timers) enthalten.
* **Automation:** Wenn ein Timer über die Checkliste gestartet und beendet wird, wird die entsprechende Aufgabe automatisch als erledigt markiert (`handleTaskAutoCheck` in `checklist.js`).
* **Focus FM Integration:** Integrierter SoundCloud Player zur Wiedergabe von Fokus-Soundtracks, steuerbar über die `SC.Widget` API.

## 🎨 Design-Philosophie (Bauhaus-Akzente)

Das Design verwendet ein dunkles, augenschonendes Theme mit minimalen Akzentfarben, die der Bauhaus-Farbpalette entnommen sind, um Bedeutung zu vermitteln:

| Zweck | Farbe (Hex) | Tailwind-Klasse | Bedeutung |
| :--- | :--- | :--- | :--- |
| **Aktion/Erfolg** | `#ef4444` | `text-red-500` | Start, Fortschritt des Timers, Checkboxen, Bestätigung. |
| **Struktur/Zyklus** | `#3b82f6` | `text-blue-500` | 90-Minuten-Zyklus, Modals zur Pause, Links/Tools. |
| **Kategorie/Hinweis** | `#facc15` | `text-yellow-400` | Hervorhebung von Checklisten-Kategorien und Quick-Start-Buttons. |