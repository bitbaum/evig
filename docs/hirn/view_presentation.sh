#!/bin/bash
# Simple script to view the Digital Brain Presentation

echo "🧠 Digital Brain Präsentation Viewer"
echo "===================================="
echo ""
echo "Wähle ein Format:"
echo ""
echo "1) HTML (im Browser, empfohlen für Präsentation)"
echo "2) PDF (mit Standard PDF-Viewer)"
echo "3) Markdown (im Terminal lesen)"
echo "4) Markdown (in VS Code/Editor öffnen)"
echo ""
read -p "Deine Wahl (1-4): " choice

case $choice in
    1)
        echo "📊 Öffne HTML-Präsentation im Browser..."
        echo "💡 Tipp: Drücke F11 für Vollbild!"
        if command -v firefox &> /dev/null; then
            firefox "$(dirname "$0")/Digital_Brain_Slides.html" &
        elif command -v google-chrome &> /dev/null; then
            google-chrome "$(dirname "$0")/Digital_Brain_Slides.html" &
        elif command -v chromium &> /dev/null; then
            chromium "$(dirname "$0")/Digital_Brain_Slides.html" &
        else
            xdg-open "$(dirname "$0")/Digital_Brain_Slides.html" &
        fi
        ;;
    2)
        echo "📄 Öffne PDF..."
        if command -v evince &> /dev/null; then
            evince "$(dirname "$0")/Digital_Brain_Slides.pdf" &
        elif command -v okular &> /dev/null; then
            okular "$(dirname "$0")/Digital_Brain_Slides.pdf" &
        else
            xdg-open "$(dirname "$0")/Digital_Brain_Slides.pdf" &
        fi
        ;;
    3)
        echo "📖 Zeige Markdown-Präsentation..."
        echo "💡 Tipp: Nutze Pfeiltasten zum Navigieren, 'q' zum Beenden"
        echo ""
        sleep 2
        less "$(dirname "$0")/Digital_Brain_Presentation.md"
        ;;
    4)
        echo "✏️ Öffne Markdown in Editor..."
        if command -v code &> /dev/null; then
            code "$(dirname "$0")/Digital_Brain_Presentation.md"
        elif command -v gedit &> /dev/null; then
            gedit "$(dirname "$0")/Digital_Brain_Presentation.md" &
        else
            xdg-open "$(dirname "$0")/Digital_Brain_Presentation.md" &
        fi
        ;;
    *)
        echo "❌ Ungültige Auswahl!"
        exit 1
        ;;
esac

echo "✅ Fertig!"
