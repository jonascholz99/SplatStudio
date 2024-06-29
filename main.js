import * as SPLAT from "@jonascholz/gaussian-splatting"

const canvas = document.getElementById("canvas");
const renderer = new SPLAT.WebGLRenderer(canvas);
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
camera.data.far = 100;
const controls = new SPLAT.OrbitControls(camera, canvas);

const splatNumber = document.getElementById("splatNumber");
const selectedSplats = document.getElementById("selectedSplats");

let splat;

let _intersectionTester = new SPLAT.IntersectionTester();

let renderPrograms = [];
let currentlySelectedSplats = [];
let raycaster;

const tolerance = 0.1;

let nodeBox, octreeRenderProgram;
let firstFrame = true;
let loaderOverlay = document.getElementById('loader-overlay');

let floatingButton;
let frustumCreationActive;
let touchPoints1, touchPoints2;
let frustum1, frustum2;

let currentRing1, currentRing2, currentRectangle;
let cullByCube, boxObject;

let initialCenter, initialSize;
let cameraPosition, cameraRotation;

let frameCounter, updateInterval;

let screenPoints
let nearTopLeft, nearBottomRight, nearTopRight, nearBottomLeft;
let farTopLeft, farTopRight, farBottomLeft, farBottomRight;

let boxFrustum;

let transparency_threshold, blend_value;

let diminishControlBox;
let showFirstFrustumToggle, showSecondFrustumToggle, showRectangleToggle, selectionVolumeToggle, closeDRSimulation, cullByCubeToggle;
let showFirstFrustum, showSecondFrustum, showRectangle, showSelectionVolume;
let firstFrustumDrawn, secondFrustumDrawn, boxDrawn, cullingActive;

function init() {
    diminishControlBox = document.getElementById('diminishBox');
    
    showFirstFrustumToggle = document.getElementById('firstFrustumToggle');
    showFirstFrustumToggle.addEventListener('click', function () {
        showFirstFrustum = !showFirstFrustum
    });
    showFirstFrustum = false;
    
    showSecondFrustumToggle = document.getElementById('secondFrustumToggle');
    showSecondFrustumToggle.addEventListener('click', function () {
        showSecondFrustum = !showSecondFrustum
    });
    showSecondFrustum = false;
    showRectangleToggle = document.getElementById('rectangleToggle');
    showRectangleToggle.addEventListener('click', function () {
        showRectangle = !showRectangle
    });
    showRectangle = false;
    selectionVolumeToggle = document.getElementById('selectionVolumeToggle');
    selectionVolumeToggle.addEventListener('click', function () {
        showSelectionVolume = !showSelectionVolume
    });
    showSelectionVolume = false;
    cullByCubeToggle = document.getElementById('cullByCubeToggle');
    cullByCubeToggle.addEventListener('click', function () {
        cullingActive = !cullingActive
        
        if(!cullingActive) {
            splat.splats.forEach(singleSplat => {
                singleSplat.Rendered = 1;
                singleSplat.Selected = 0;
                singleSplat.ResetColor();
            })
            splat.applyRendering();
        }
    });
    cullingActive = true;
    closeDRSimulation = document.getElementById('closeDRSimulation');
    closeDRSimulation.addEventListener('click', stopDRExperience);
    
    floatingButton = document.getElementById('floatingButton');
    frustumCreationActive = false;
    
    firstFrustumDrawn = false;
    secondFrustumDrawn = false;
    boxDrawn = false;

    touchPoints1 = [];
    touchPoints2 = [];
    frustum1 = null;
    frustum2 = null;

    currentRing1 = null;
    currentRing2 = null;
    currentRectangle = null;
    
    boxObject = null;
    cullByCube = false;

    frameCounter = 0;
    updateInterval = 5;

    boxFrustum = new SPLAT.Frustum();

    blend_value = 1;
    transparency_threshold = 2;
}

async function main() {
    var url = "./zw1027_4.splat";
    splat = await SPLAT.Loader.LoadAsync(url, scene);


    splatNumber.innerText = "Max number of splats: " + splat.splatCount;

    const handleResize = () => {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    const frame = () => {
        controls.update();
        renderer.render(scene, camera);

        if (firstFrame) {
            firstFrame = false;
            loaderOverlay.style.display = 'none';
        }

        if (cullByCube && frameCounter % updateInterval === 0) {
            updateBoxFrustum();
        }

        frameCounter++;
        requestAnimationFrame(frame);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    requestAnimationFrame(frame);

    _intersectionTester = new SPLAT.IntersectionTester(renderer.renderProgram, 30, 1);
    raycaster = new SPLAT.Raycaster(renderer, false);
}

init();
main();

document.getElementById('menu-toggle').addEventListener('click', function () {
    updateSelectedSplats();
    const menu = document.getElementById('side-menu');
    if (menu.style.left === '0px') {
        menu.style.left = '-300px';  // Schließen
    } else {
        menu.style.left = '0px';     // Öffnen
    }
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                         Reset
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('reset').addEventListener('click', async function () {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen
    await clearSelection();
    removeAllRenderPrograms();

    splat.splats.forEach(singleSplat => {
        singleSplat.Selected = 0;
        singleSplat.Rendered = 1;
        singleSplat.ResetColor();
    })
    splat.applyRendering();

});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                         Select all
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('select-all').addEventListener('click', async function () {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen
    await clearSelection();

    splat.splats.forEach(singleSplat => {
        singleSplat.Selected = 1;
        currentlySelectedSplats.push(singleSplat);
    })
    splat.applyRendering();
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                         Select none
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('select-none').addEventListener('click', async function () {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen
    clearSelection();

    splat.splats.forEach(singleSplat => {
        singleSplat.Selected = 0;
    })
    splat.applyRendering();
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                      invert selection
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('invert-seclection').addEventListener('click', async function () {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    let tmpList = []
    splat.splats.forEach(singleSplat => {
        if (singleSplat.Selected === 1) {
            singleSplat.Selected = 0;
        } else {
            singleSplat.Selected = 1;
            tmpList.push(singleSplat);
        }
    })
    splat.applyRendering();

    await clearSelection();
    currentlySelectedSplats = tmpList;
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                         show all
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('show-all').addEventListener('click', async function () {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    splat.splats.forEach(singleSplat => {
        singleSplat.Rendered = 1;
    })
    splat.applyRendering();
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                         show none
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('show-none').addEventListener('click', async function () {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    splat.splats.forEach(singleSplat => {
        singleSplat.Rendered = 0;
    })
    splat.applyRendering();
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                    render selected splats
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('render-selected-splats').addEventListener('click', function () {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    splat.data.resetRendering();
    currentlySelectedSplats.forEach(singleSplat => {
        singleSplat.Rendered = 1;
    })
    splat.applyRendering();
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                    render except selected
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('render-unselected-splats').addEventListener('click', async function () {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    splat.splats.forEach(singleSplat => {
        singleSplat.Rendered = 1;
    })
    currentlySelectedSplats.forEach(singleSplat => {
        singleSplat.Rendered = 0;
    })
    splat.applyRendering();
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                    render center selected
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('render-center-splats').addEventListener('click', async function () {
    removeAllRenderPrograms();
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    let leftCorners = []
    let rightCorners = []
    let centerColor = new Float32Array([1.0, 1.0, 0.0, 0.6]);
    currentlySelectedSplats.forEach(singleSplat => {
        let bounds = singleSplat.bounds;

        let centerCorner1 = new Float32Array([bounds.center().x - 0.05, bounds.center().y - 0.05, bounds.center().z - 0.05]);
        let centerCorner2 = new Float32Array([bounds.center().x + 0.05, bounds.center().y + 0.05, bounds.center().z + 0.05]);

        leftCorners.push(centerCorner1);
        rightCorners.push(centerCorner2);

    })
    let centerProgram = new SPLAT.MultibleCubesProgram(renderer, [], leftCorners, rightCorners, centerColor);
    renderPrograms.push(centerProgram);
    renderer.addProgram(centerProgram);
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                     Simulate DR Experience
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('simulate-dr').addEventListener('click', function () {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    document.addEventListener('mouseup', handleMouseDown, true);

    floatingButton.textContent = "Mask";
    floatingButton.style.bottom = '20px';

    cullByCube = false;
    boxObject = null;
});

floatingButton.addEventListener('click', function () {
    floatingButton.style.bottom = '-100px';
    if (floatingButton.textContent === "Mask") {
        frustumCreationActive = true;
    } else if (floatingButton.textContent === "Mask again") {
        frustumCreationActive = true;
    } else if (floatingButton.textContent === "Diminish") {
        cullByCube = true;
        boxObject.ereaseBox(renderer);
        diminishControlBox.style.bottom = '30px';
    }
});

function handleMouseDown(event) {
    if (event.button === 0) {
        if (frustumCreationActive && touchPoints1.length < 2) {
            if (touchPoints1.length === 0) {
                addTouchPoint(touchPoints1, 1, event);
            } else {
                addTouchPoint(touchPoints1, 2, event);
            }

            if (touchPoints1.length === 2) {
                frustum1 = createFrustumFromTouchPoints(touchPoints1);
                console.log("First Frustum Created");

                floatingButton.textContent = "Mask again";
                floatingButton.style.bottom = '20px';
                frustumCreationActive = false;

                setTimeout(function () {
                    hideScreenDrawings();
                }, 2000);
            }
        } else if (frustumCreationActive && touchPoints2.length < 2) {
            if (touchPoints2.length === 0) {
                addTouchPoint(touchPoints2, 1, event);
            } else {
                addTouchPoint(touchPoints2, 2, event);
            }

            if (touchPoints2.length === 2) {
                frustum2 = createFrustumFromTouchPoints(touchPoints2);
                console.log("Second Frustum Created");

                floatingButton.textContent = "Diminish";
                floatingButton.style.bottom = '20px';

                if (frustum1 && frustum2) {
                    const intersectionPoints = frustum1.intersectFrustum(frustum2);

                    drawIntersectionVolume(intersectionPoints);
                }
            }
        }
    }
}

function addTouchPoint(touchPoints, number, event) {
    let x = (event.clientX / canvas.clientWidth) * 2 - 1;
    let y = -(event.clientY / canvas.clientHeight) * 2 + 1;

    touchPoints.push({x, y});

    drawRing(x, y, number);
}

function drawRing(posX, posY, ringNumber) {
    const x1 = ((posX + 1) / 2) * canvas.clientWidth;
    const y1 = ((1 - posY) / 2) * canvas.clientHeight;

    if (ringNumber === 1 && currentRing1) {
        currentRing1.remove();
    }
    if (ringNumber === 2 && currentRing2) {
        currentRing2.remove();
    }

    const ring = document.createElement('div');
    ring.classList.add('ring');
    ring.style.left = `${x1}px`;
    ring.style.top = `${y1}px`;
    document.body.appendChild(ring);

    if (ringNumber === 1) {
        currentRing1 = ring;
    } else if (ringNumber === 2) {
        currentRing2 = ring;
    }
}

function drawRectangle(tx1, ty1, tx2, ty2) {
    const x1 = ((tx1 + 1) / 2) * canvas.clientWidth;
    const y1 = ((1 - ty1) / 2) * canvas.clientHeight
    const x2 = ((tx2 + 1) / 2) * canvas.clientWidth;
    const y2 = ((1 - ty2) / 2) * canvas.clientHeight

    if (currentRectangle) {
        currentRectangle.remove();
    }

    const rect = document.createElement('div');
    rect.classList.add('rectangle');
    rect.style.left = `${Math.min(x1, x2)}px`;
    rect.style.top = `${Math.min(y1, y2)}px`;
    rect.style.width = `${Math.abs(x2 - x1)}px`;
    rect.style.height = `${Math.abs(y2 - y1)}px`;
    document.body.appendChild(rect);

    currentRectangle = rect;
}

function hideScreenDrawings() {
    if (currentRing1) {
        currentRing1.remove();
    }

    if (currentRing2) {
        currentRing2.remove();
    }

    if (currentRectangle) {
        currentRectangle.remove();
    }
}

function createFrustumFromTouchPoints(touchPoints) {
    let nearTopLeft = camera.screenToWorldPoint(touchPoints[0].x, touchPoints[0].y);
    let nearBottomRight = camera.screenToWorldPoint(touchPoints[1].x, touchPoints[1].y);
    let nearTopRight = camera.screenToWorldPoint(touchPoints[1].x, touchPoints[0].y);
    let nearBottomLeft = camera.screenToWorldPoint(touchPoints[0].x, touchPoints[1].y);

    let farTopLeft = nearTopLeft.add(camera.screenPointToRay(touchPoints[0].x, touchPoints[0].y).multiply(15));
    let farTopRight = nearTopRight.add(camera.screenPointToRay(touchPoints[1].x, touchPoints[0].y).multiply(15));
    let farBottomLeft = nearBottomLeft.add(camera.screenPointToRay(touchPoints[0].x, touchPoints[1].y).multiply(15));
    let farBottomRight = nearBottomRight.add(camera.screenPointToRay(touchPoints[1].x, touchPoints[1].y).multiply(15));

    let frustum = new SPLAT.Frustum();
    frustum.setFromPoints(nearTopLeft, nearTopRight, nearBottomLeft, nearBottomRight, farTopLeft, farTopRight, farBottomLeft, farBottomRight);

    return frustum;
}

function drawIntersectionVolume(box) {

    boxObject = box;
    initialCenter = boxObject.center();
    initialSize = boxObject.size();

    cameraPosition = camera.position.clone();
    cameraRotation = camera.rotation.clone();

    boxObject.drawBox(renderer);

    hideScreenDrawings();
}

function updateBoxFrustum() {

    if (!firstFrustumDrawn && showFirstFrustum) {
        firstFrustumDrawn = true;
        frustum1.drawFrustum(renderer, [true, true, true, true, true, true]);
    } else if (firstFrustumDrawn && !showFirstFrustum) {
        firstFrustumDrawn = false;
        frustum1.ereaseFrustum(renderer);
    }

    if (!secondFrustumDrawn && showSecondFrustum) {
        secondFrustumDrawn = true;
        frustum2.drawFrustum(renderer, [true, true, true, true, true, true]);
    } else if (secondFrustumDrawn && !showSecondFrustum) {
        secondFrustumDrawn = false;
        frustum2.ereaseFrustum(renderer);
    }

    screenPoints = boxObject.getCorners().map(corner => camera.worldToScreenPoint(corner));


    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const point of screenPoints) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }
    
    if(showRectangle) {
        drawRectangle(minX, minY, maxX, maxY);
    } else {
        hideScreenDrawings();
    }

    if(!boxDrawn && showSelectionVolume) {
        boxDrawn = true;
        boxObject.drawBox(renderer);
    } else if(boxDrawn && !showSelectionVolume) {
        boxDrawn = false;
        boxObject.ereaseBox(renderer);
    }
    
    if (cullingActive && (!positionsAreClose(camera.position, cameraPosition, tolerance) || !rotationsAreClose(camera.rotation, cameraRotation, tolerance))) {
        cameraPosition = camera.position.clone();
        cameraRotation = camera.rotation.clone();

        nearTopLeft = camera.screenToWorldPoint(minX, maxY);
        nearBottomRight = camera.screenToWorldPoint(maxX, minY);
        nearTopRight = camera.screenToWorldPoint(maxX, maxY);
        nearBottomLeft = camera.screenToWorldPoint(minX, minY);

        farTopLeft = nearTopLeft.add(camera.screenPointToRay(minX, maxY).multiply(camera.data.far));
        farTopRight = nearTopRight.add(camera.screenPointToRay(maxX, maxY).multiply(camera.data.far));
        farBottomLeft = nearBottomLeft.add(camera.screenPointToRay(minX, minY).multiply(camera.data.far));
        farBottomRight = nearBottomRight.add(camera.screenPointToRay(maxX, minY).multiply(camera.data.far));
        
        boxFrustum.setFromPoints(nearTopLeft, nearTopRight, nearBottomLeft, nearBottomRight, farTopLeft, farTopRight, farBottomLeft, farBottomRight);

        const iterator = new SPLAT.OctreeIterator(splat._octree.root, boxFrustum);

        splat.data.resetRendering();
        
        function processSingleSplat(singleSplat) {
            const distance = boxFrustum.distanceToPoint(singleSplat.PositionVec3);
            if (distance > 0) {             
                singleSplat.Rendered = 1;
                const transparency = Math.min(distance / transparency_threshold, 1.0);
                singleSplat.setTransparency(transparency);
                singleSplat.setBlending(1);
            } 
        }
        
        const promises = [];
        const nodes = [];
        for (let result = iterator.next(); !result.done; result = iterator.next()) {
            nodes.push(result.value);
        }

        nodes.forEach(node => {
            const nodeDataArray = node.data?.data;

            if (nodeDataArray) {

                promises.push(
                    new Promise((resolve) => {
                        nodeDataArray.forEach(singleSplat => {
                            processSingleSplat(singleSplat);
                        });
                        resolve();
                    })
                );
            }
        });

        Promise.all(promises).then(() => {
            splat.applyRendering();
        });
    }
}

function stopDRExperience() {
    if (firstFrustumDrawn) {
        firstFrustumDrawn = false;
        frustum1.ereaseFrustum(renderer);
    }
    
    if (secondFrustumDrawn) {
        secondFrustumDrawn = false;
        frustum2.ereaseFrustum(renderer);
    }

    hideScreenDrawings();
    if(boxDrawn) {
        boxObject.ereaseBox(renderer);
    }

    splat.splats.forEach(singleSplat => {
        singleSplat.Rendered = 1;
        singleSplat.Selected = 0;
        singleSplat.ResetColor();
    })
    splat.applyRendering();

    cullByCube = false;
    boxObject = null;
    touchPoints1 = [];
    touchPoints2 = [];
    frustum1 = null;
    frustum2 = null;
    frustumCreationActive = false;
    
    diminishControlBox.style.bottom = '-300px';
}

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                      Visualise Octree
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('show-octree').addEventListener('click', function () {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    var box = document.getElementById('controlBox');
    box.style.bottom = '30px';


    const sliderOctree = document.getElementById('slider-octree-level');
    const level = parseInt(sliderOctree.value, 10);
    octreeRenderProgram = new SPLAT.OctreeHelper(renderer, [], splat.octree, level);
    renderer.addProgram(octreeRenderProgram);

    setSliderValues();
});

document.getElementById('slider-octree-level').addEventListener('change', function () {
    if (nodeBox) {
        nodeBox.ereaseBox(renderer);
    }

    setSliderValues();
});

document.getElementById('slider-level-value').addEventListener('change', function () {
    if (nodeBox) {
        nodeBox.ereaseBox(renderer);
    }

    setSliderValues();
});

function setSliderValues() {
    const sliderOctree = document.getElementById('slider-octree-level');
    const level = parseInt(sliderOctree.value, 10);
    document.getElementById('octreeLevel').textContent = level;

    const sliderLevelValue = document.getElementById('slider-level-value');
    let value = parseInt(sliderLevelValue.value);
    document.getElementById('levelNumber').textContent = value;

    sliderLevelValue.max = splat.octree.findNodesByLevel(level).length - 1;

    visualiseOctree(value, level);
}

function visualiseOctree(value, level) {
    splat.data.resetRendering();
    splat.splats.forEach(async singleSplat => {
        singleSplat.Selected = 0;
    })

    let node = splat.octree.findNodesByLevel(level)[value];
    nodeBox = new SPLAT.Box3(node.min, node.max);

    let allNodes = splat.octree.cull(nodeBox);
    allNodes.forEach(node => {
        let nodeData = node.data
        if (nodeData) {
            let splatArray = nodeData.data;
            if (splatArray) {
                splatArray.forEach(singleSplat => {
                    if (nodeBox.contains(singleSplat.PositionVec3)) {
                        singleSplat.Selected = 1;
                        singleSplat.Rendered = 1;
                    }
                });
            }
        }
    });
    splat.applyRendering();

    nodeBox.drawBox(renderer, new SPLAT.Vector4(1.0, 1.0, 1.0, 0.1), new SPLAT.Vector4(1.0, 0.0, 0.0, 1.0));
}

document.getElementById('closeButton').addEventListener('click', function () {
    if (nodeBox) {
        nodeBox.ereaseBox(renderer);
    }

    renderer.removeProgram(octreeRenderProgram);
    clearSelection();
    removeAllRenderPrograms();

    splat.splats.forEach(singleSplat => {
        singleSplat.Selected = 0;
        singleSplat.Rendered = 1;
        singleSplat.ResetColor();
    })
    splat.applyRendering();

    var box = document.getElementById('controlBox');
    box.style.bottom = '-300px';
});


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                    Select splats per index
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('start-show-splats').addEventListener('click', function () {
    clearSelection();

    const splatCount = parseInt(document.getElementById('number-splats').value, 10);


    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen
    for (let i = 0; i < splatCount; i++) {
        splat.selectSplat(i, true);

        currentlySelectedSplats.push(splat.splats[i]);
    }
    splat.applyRendering();
});


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                    Select splats per axis
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('select-splats').addEventListener('click', function () {
    clearSelection();

    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    let layerValue = document.getElementById('layer-value').value;
    let isPositive = document.getElementById('toggle-feature-pos-neg').checked;
    let selectedAxis = document.getElementById('axis-select').value;

    let selectedSplat = _intersectionTester.testLayer(layerValue, isPositive, selectedAxis);

    if (selectedSplat !== null) {
        selectedSplat.forEach(singleSplat => {
            singleSplat.Selected = 1
            currentlySelectedSplats.push(singleSplat);
        });
        splat.applyRendering();
    }

});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                    Select splats per cube
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById("select-splats-cube").addEventListener("click", function () {
    clearSelection();
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    removeAllRenderPrograms();

    const x1 = parseFloat(document.getElementById('vecX_uc').value);
    const y1 = parseFloat(document.getElementById('vecY_uc').value);
    const z1 = parseFloat(document.getElementById('vecZ_uc').value);

    const x2 = parseFloat(document.getElementById('vecX_lc').value);
    const y2 = parseFloat(document.getElementById('vecY_lc').value);
    const z2 = parseFloat(document.getElementById('vecZ_lc').value);

    let color = new Float32Array([1.0, 1.0, 0.0, 0.6]);

    let upperLeftCorner = new Float32Array([x1, y1, z1]);
    let bottomRightCorner = new Float32Array([x2, y2, z2]);

    var renderProgram = new SPLAT.CubeVisualisationProgram(renderer, [], [upperLeftCorner, bottomRightCorner], color);
    renderPrograms.push(renderProgram);
    renderer.addProgram(renderProgram);

    let box = new SPLAT.Box3(new SPLAT.Vector3(x1, y1, z1), new SPLAT.Vector3(x2, y2, z2));
    let nodes = splat._octree.cull(box);

    nodes.forEach(node => {
        let nodeData = node.data;
        if (nodeData && nodeData.data) {
            for (let singleSplat of nodeData.data) {
                if (box.intersectsBox(singleSplat.bounds)) {
                    singleSplat.Selected = 1;
                }
            }
        }
    });
    splat.applyRendering();

    setTimeout(function () {
        removeAllRenderPrograms();
    }, 10000);
})

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                    Select splats per camera frustum
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById("select-splats-camera-frustum").addEventListener("click", function () {
    clearSelection();
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    let minX = -1, minY = -1;
    let maxX = 1, maxY = 1;

    let nearTopLeft = camera.screenToWorldPoint(minX, maxY);
    let nearBottomRight = camera.screenToWorldPoint(maxX, minY);
    let nearTopRight = camera.screenToWorldPoint(maxX, maxY);
    let nearBottomLeft = camera.screenToWorldPoint(minX, minY);

    let farTopLeft = nearTopLeft.add(camera.screenPointToRay(minX, maxY).multiply(camera.data.far));
    let farTopRight = nearTopRight.add(camera.screenPointToRay(maxX, maxY).multiply(camera.data.far));
    let farBottomLeft = nearBottomLeft.add(camera.screenPointToRay(minX, minY).multiply(camera.data.far));
    let farBottomRight = nearBottomRight.add(camera.screenPointToRay(maxX, minY).multiply(camera.data.far));

    const cameraFrustum = new SPLAT.Frustum();
    cameraFrustum.setFromPoints(nearTopLeft, nearTopRight, nearBottomLeft, nearBottomRight, farTopLeft, farTopRight, farBottomLeft, farBottomRight);

    const nodes = splat._octree.cull(cameraFrustum);

    nodes.forEach(node => {
        let nodeData = node.data;
        if (nodeData && nodeData.data) {
            for (let singleSplat of nodeData.data) {
                singleSplat.Selected = 1;
                currentlySelectedSplats.push(singleSplat);
            }
        }
    });

    splat.applyRendering();
});


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                    Set transparency
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById("set-transparency").addEventListener("click", function () {
    const slider = document.getElementById('slider');

    splat.splats.forEach(async singleSplat => {
        singleSplat.setBlending(parseFloat(slider.value));
    })
    splat.applyRendering();
})

document.getElementById("Reset-transparency").addEventListener("click", function () {

    splat.splats.forEach(async singleSplat => {
        singleSplat.ResetColor();
    })
    splat.applyRendering();
})

function removeAllRenderPrograms() {
    for (let i = 0; i < renderPrograms.length; i++) {
        var program = renderPrograms.pop();
        renderer.removeProgram(program)
    }
}

function updateSelectedSplats() {
    selectedSplats.innerText = "currently selected: " + currentlySelectedSplats.length + " splats";
}

async function clearSelection() {
    currentlySelectedSplats.forEach(singleSplat => {
        singleSplat.Select = 0
    })
    splat.updateRenderingOfSplats();

    currentlySelectedSplats.splice(0, currentlySelectedSplats.length);
}

function isWithinTolerance(value1, value2, tolerance) {
    return Math.abs(value1 - value2) <= Math.abs(value1 * tolerance);
}

function positionsAreClose(position1, position2, tolerance) {
    return isWithinTolerance(position1.x, position2.x, tolerance) &&
        isWithinTolerance(position1.y, position2.y, tolerance) &&
        isWithinTolerance(position1.z, position2.z, tolerance);
}

function rotationsAreClose(rotation1, rotation2, tolerance) {
    return isWithinTolerance(rotation1.x, rotation2.x, tolerance) &&
        isWithinTolerance(rotation1.y, rotation2.y, tolerance) &&
        isWithinTolerance(rotation1.z, rotation2.z, tolerance);
}