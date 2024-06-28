import * as SPLAT from "@jonascholz/gaussian-splatting"

const canvas = document.getElementById("canvas");
const renderer = new SPLAT.WebGLRenderer(canvas);
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
camera.data.far = 100;
const controls = new SPLAT.OrbitControls(camera, canvas);

const splatNumber = document.getElementById("splatNumber");
const selectedSplats = document.getElementById("selectedSplats");
const checkbox_select = document.getElementById("toggle-feature");
let splat;

let _intersectionTester = new SPLAT.IntersectionTester();

let renderPrograms = [];
let currentlySelectedSplats = [];
let raycaster;

let nodeBox, octreeRenderProgram;

async function main()
{
    var url = "./zw1027_4.splat";
    splat = await SPLAT.Loader.LoadAsync(url, scene);


    splatNumber.innerText = "Max number of splats: " + splat.splatCount;

    renderer.addProgram(new SPLAT.AxisProgram(renderer, []));

    const handleResize = () => {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    const frame = () => {
        controls.update();
        renderer.render(scene, camera);

        requestAnimationFrame(frame);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    requestAnimationFrame(frame);

    _intersectionTester = new SPLAT.IntersectionTester(renderer.renderProgram, 30, 1);
    raycaster = new SPLAT.Raycaster(renderer, false);
}

main();

document.getElementById('menu-toggle').addEventListener('click', function() {
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
document.getElementById('reset').addEventListener('click', async function() {
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
document.getElementById('select-all').addEventListener('click', async function() {
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
document.getElementById('select-none').addEventListener('click', async function() {
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
document.getElementById('invert-seclection').addEventListener('click', async function() {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    let tmpList = []
    splat.splats.forEach(singleSplat => {
        if(singleSplat.Selected === 1) {
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
document.getElementById('show-all').addEventListener('click', async function() {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    splat.splats.forEach(singleSplat => {
        singleSplat.Rendered = 1;
    })
    splat.applyRendering();
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                         show none
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('show-none').addEventListener('click', async function() {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    splat.splats.forEach(singleSplat => {
        singleSplat.Rendered = 0;
    })
    splat.applyRendering();
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                    render selected splats
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('render-selected-splats').addEventListener('click', function() {
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
document.getElementById('render-unselected-splats').addEventListener('click', async function() {
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
document.getElementById('render-center-splats').addEventListener('click', async function() {
    removeAllRenderPrograms();
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    let leftCorners = []
    let rightCorners = []
    let centerColor = new Float32Array([1.0, 1.0, 0.0, 0.6]);
    currentlySelectedSplats.forEach(singleSplat => {
        let bounds = singleSplat.bounds;

        let centerCorner1 = new Float32Array([bounds.center().x-0.05, bounds.center().y-0.05, bounds.center().z-0.05]);
        let centerCorner2 = new Float32Array([bounds.center().x+0.05, bounds.center().y+0.05, bounds.center().z+0.05]);

        leftCorners.push(centerCorner1);
        rightCorners.push(centerCorner2);

    })
    let centerProgram = new SPLAT.MultibleCubesProgram(renderer, [], leftCorners, rightCorners, centerColor);
    renderPrograms.push(centerProgram);
    renderer.addProgram(centerProgram);
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                      Visualise Octree
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById('show-octree').addEventListener('click', function() {
    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen
    
    var box = document.getElementById('controlBox');
    box.style.bottom = '30px';
    

    const sliderOctree = document.getElementById('slider-octree-level');
    const level = parseInt(sliderOctree.value, 10);
    octreeRenderProgram = new SPLAT.OctreeHelper(renderer, [],  splat.octree, level);
    renderer.addProgram(octreeRenderProgram);
    
    setSliderValues();
});

document.getElementById('slider-octree-level').addEventListener('change', function() {
    if(nodeBox) {
        nodeBox.ereaseBox(renderer);
    }
    
    setSliderValues();
});

document.getElementById('slider-level-value').addEventListener('change', function() {
    if(nodeBox) {
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
    
    sliderLevelValue.max = splat.octree.findNodesByLevel(level).length-1;

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
        if(nodeData) {
            let splatArray = nodeData.data;
            if(splatArray) {
                splatArray.forEach(singleSplat => {
                    if(nodeBox.contains(singleSplat.PositionVec3)) {
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

document.getElementById('closeButton').addEventListener('click', function() {
    if(nodeBox) {
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
document.getElementById('start-show-splats').addEventListener('click', function() {
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
document.getElementById('select-splats').addEventListener('click', function() {
    clearSelection();

    document.getElementById('side-menu').style.left = '-300px'; // Menü schließen

    let layerValue = document.getElementById('layer-value').value;
    let isPositive = document.getElementById('toggle-feature-pos-neg').checked;
    let selectedAxis = document.getElementById('axis-select').value;

    let selectedSplat = _intersectionTester.testLayer(layerValue, isPositive, selectedAxis);

    if (selectedSplat !== null){
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
document.getElementById("select-splats-cube").addEventListener("click", function() {
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
            for(let singleSplat of nodeData.data) {
                if(box.intersectsBox(singleSplat.bounds)) {
                    singleSplat.Selected = 1;   
                }
            }
        }
    });
    splat.applyRendering();

    setTimeout(function() {
        removeAllRenderPrograms();
    }, 10000);
})

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                    Select splats per camera frustum
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
document.getElementById("select-splats-camera-frustum").addEventListener("click", function() {
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
    cameraFrustum.setFromPoints(nearTopLeft, nearTopRight, nearBottomLeft, nearBottomRight, farTopLeft, farTopRight,farBottomLeft, farBottomRight);

    const nodes = splat._octree.cull(cameraFrustum);
    
    nodes.forEach(node => {
        let nodeData = node.data;
        if (nodeData && nodeData.data) {
            for(let singleSplat of nodeData.data) {
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
document.getElementById("set-transparency").addEventListener("click", function() {
    const slider = document.getElementById('slider');
    
    splat.splats.forEach(async singleSplat => {
        singleSplat.setBlending(parseFloat(slider.value));
    })
    splat.applyRendering();
})

document.getElementById("Reset-transparency").addEventListener("click", function() {

    splat.splats.forEach(async singleSplat => {
        singleSplat.ResetColor();
    })
    splat.applyRendering();
})

function removeAllRenderPrograms() {
    for(let i = 0; i < renderPrograms.length; i++) {
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