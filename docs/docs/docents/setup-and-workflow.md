---
sidebar_position: 2
---

import LazyYouTubeEmbed from '@site/src/components/LazyYouTubeEmbed';

# Workspace Configuration: Notepads, Screens, and Tool Use

This section guides you through configuring and using the active workspace during a running lecture.

## 📚 Core Concepts: Notepads vs. Screens
These are fundamental components of the FAILS writing surface:

*   **Notepad:** One of the primary, active canvas where all drawing and calculations occur. You use this for all interactive lecturing.
*   **Screen:** A dedicated viewing area intended *only* for displaying content (lecture notes/projected output). Writing directly on a screen is not possible.

## 📐 Configuring Complex Setups & Layout Management
FAILS supports linking multiple physical display units into one logical lecture environment:

### Multi-Display Setup Steps
1.  **Opening Windows:** Start by opening an initial screen window for the primary projector display, in the initial quick step pop-up.
2.  **Accessing Settings:** Select the initially hidden icon located in the bottom right corner of the appearing screen window to open the full screen settings.
3.  **Granting Permissions (Critical):** Always ensure you grant FAILS permission to manage windows across all connected displays in the browser popup upon first use.
4.  **Adding Displays/Rooms:** Use the `other` display button to display the screen display on the other projector.

You can add as many screens and notebooks as you wish. You may also start the FAILS app on another device and authorize them from the FAILS app cockpit.

## 🖌️ Tool Usage in the Running Lecture (The Toolbox)
When the lecture is active, the toolbox manages various functions:

| Tool | Function | How to Use / Tips |
| :--- | :--- | :--- |
| **Pen Tool** | Core writing and calculation. | Clicking the button multiple times toggles between different pen colors and sizes. *Note: For printing, white is automatically replaced by black.* |
| **Marker Tool** | Emphasis. | Used for underlining text or surrounding important equations with boxes. |
| **Magic Wand** | Selection area definition. | Draw a boundary to select all objects within that "magic area." This allows you to move or delete the entire group of selected items. **Warning:** The undo function is reset after using the Magic Wand. |
| **Laser pointer** | Guidance. | Guide the student's attention with a laser pointer, which is transmitted also the student's devices. 
| **Add form or picture** | Add pictures or forms | Add forms such as rectangles, circles, lines etc.. Again multiple button presses to on button of the form switches between menus for line width, line color or filling color. Use the add picture button to place previously uploaded pictures.|
| **Start Activity** | Start an activity | Start either a poll or a Jupyter lite applet or notebook.
| **Eraser** | Correction. | Clears mistakes. Its display color changes based on the output format (fully opaque in PDF; background-matched live). |
| **Undo Button** | Reversion. | Undoes the immediately preceding drawing action. |


The toolbox moves automatically and try to be close to your writing, but far enough to not obstruct your writing. Use the little arrow if the toolbox should move to another position.


### ⚙️ Advanced Controls and Options
Accessing the **Options Menu** (via the moving toolbar) provides detailed controls:
*   **Touch Input Management:** Toggle touch input On/Off and select different strategies for **palm rejection**, optimizing your writing comfort.
*   **Arrange notebooks and screens:** Open and arrange additional screens and notebooks.
* **Chat:** Send chat messages to all students.
* **Audio/Video transmission:** Start up network connections for stream audio, video and screen shares to your students.


### Arranging Notepads and Screens (Advanced Control)
Within the "Arrange Elements" dialog accessible via the options menu from the moving toolbar:
*   **Visual Layout:** You can see all linked notepads and screens grouped by their assigned room.
*   **Ordering:** Use the **Move to Top** button to adjust the display order of elements within a room.
*  **Additional:** screens and notebooks can be created by the two buttons.
* **Numbers:** use the numbers button to turn on and off displaying the screen and notebook number.
*   **Global Scroll Position:** The lecture content is synchronized across all connected rooms and devices via a shared global scroll position, ensuring continuity regardless of how many physical locations are streaming. The content of the rooms is mirrored to every room, where the top of the first notebook in the room marks the scroll position.

 ## Getting Started with complex display setups
To help you start, we highly recommend watching this introductory video.

<LazyYouTubeEmbed videoId="byS-th1ZWPw" videoTitle="Advanced steps for handling screens and notepads in FAILS" />

---
[The next sections handle specific interactive elements.](interactivity.md)
{/* The text is generated by the suite of Gemma 4 models based in the youtube videos for fails and then manually edited*/}
