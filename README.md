# Splat Studio

Dieser Gaussian Splatting Editor entstammt aus einer Masterarbeit mit dem Titel "DimSplat. Development of a Diminished Reality Prototype with Gaussian Splats for Mobile Augmented Reality Applications". Dabei baut er auf einer modifizierten Variante des `gsplat.js` Frameworks von Dylan Ebert ([Github](https://github.com/huggingface/gsplat.js/tree/main)) auf. 

Dieser Editor dient dem Testen der Funktionen aus dem im Rahmen der Arbeit umgebauten Framework, welches [hier](https://github.com/jonascholz99/gaussian-splatting) zu finden ist. Der Editor bietet folgende Funktionen:

## Funktionen

### SPLAT Actions

1. Reset
    - Setzt alle Änderungen zurück und stellt den Ausgangszustand wieder her.

2. Select all
    - Wählt alle Splats aus.

3. Select none
    - Hebt die Auswahl aller Splats auf.

4. Invert Selection
    - Kehrt die aktuelle Auswahl der Splats um.

5. Show all
    - Zeigt alle Splats an.

6. Show none
    - Blendet alle Splats aus.

7. Render only selected
    - Rendert nur die ausgewählten Splats.

8. Render except selected
    - Rendert alle Splats außer den ausgewählten.

9. Show center of selected splats
    - Zeigt das Zentrum der ausgewählten Splats an.

### DR Simulation
Simuliert eine DR-Erfahrung, bei der bestimmte Bereiche der Splats hervorgehoben oder maskiert werden können.

### Visualise Octree
Visualisiert die Octree-Struktur, die zur Organisation der Splats verwendet wird.

### Select Splats per index
Wählt eine bestimmte Anzahl von Splats basierend auf ihrem Index aus. Die Anzahl der auszuwählenden Splats kann über ein Eingabefeld angegeben werden.

### Select Splats per Layer
Ermöglicht die Auswahl einer Achse (X, Y oder Z), entlang der die Splats ausgewählt werden sollen.

### Select per Cube

Wählt die Splats aus, die innerhalb des angegebenen Würfels liegen.

### Select Splats Camera Frustum

Wählt die Splats aus, die innerhalb des aktuellen Sichtfelds der Kamera liegen.

### Set transparency

Stellt die Transparenz der Splats auf den über den Schieberegler angegebenen Wert ein.

### Weitere Funktionen

Der Editor enthält zusätzliche Funktionen zur Auswahl und Bearbeitung von Splats, zur Steuerung der Anzeige und zur Durchführung verschiedener Aktionen innerhalb der 3D-Szene.

Für eine detaillierte Übersicht und Beispiele siehe den vollständigen Code im Repository.