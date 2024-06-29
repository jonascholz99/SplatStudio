# Splat Studio

This Gaussian Splatting Editor is derived from a master's thesis titled "DimSplat. Development of a Diminished Reality Prototype with Gaussian Splats for Mobile Augmented Reality Applications". It is based on a modified version of the `gsplat.js` framework by Dylan Ebert ([Github](https://github.com/huggingface/gsplat.js/tree/main)).

This editor serves to test the functions of the framework modified in the context of the thesis, which can be found [here](https://github.com/jonascholz99/gaussian-splatting). The editor offers the following functions:

## Functions

### SPLAT Actions

1. **Reset**
    - Resets all changes and restores the initial state.

2. **Select all**
    - Selects all splats.

3. **Select none**
    - Deselects all splats.

4. **Invert Selection**
    - Inverts the current selection of splats.

5. **Show all**
    - Displays all splats.

6. **Show none**
    - Hides all splats.

7. **Render only selected**
    - Renders only the selected splats.

8. **Render except selected**
    - Renders all splats except the selected ones.

9. **Show center of selected splats**
    - Displays the center of the selected splats.

### DR Simulation
Simulates a diminished reality (DR) experience where certain areas of the splats can be highlighted or masked.

### Visualise Octree
Visualizes the octree structure used to organize the splats.

### Select Splats per Index
Selects a specific number of splats based on their index. The number of splats to be selected can be specified via an input field.

### Select Splats per Layer
Allows selection of an axis (X, Y, or Z) along which the splats should be selected.

### Select per Cube
Selects the splats that lie within the specified cube.

### Select Splats Camera Frustum
Selects the splats that are within the current camera view frustum.

### Set Transparency
Sets the transparency of the splats to the value specified by the slider.

### Additional Functions
The editor includes additional functions for selecting and editing splats, controlling the display, and performing various actions within the 3D scene.

For a detailed overview and examples, see the full code in the repository.