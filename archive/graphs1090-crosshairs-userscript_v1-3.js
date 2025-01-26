// ==UserScript==
// @name         Crosshairs for Graphs (Main and Individual Pages with Toggle)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Add crosshairs to graphs with a toggle button for both main and individual graph pages
// @author       Brian McEntire
// @match        *://*/graphs1090/*
// @match        *://*/*/graphs1090/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // State variable to track whether crosshairs are enabled
    let crosshairsEnabled = true;

    // Create the toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'btn-cursor-plus';
    toggleButton.className = 'btn btn-default btn-sm active'; // Default to "active" (on state)
    toggleButton.textContent = 'Cursor: On';

    // Add event listener for toggling crosshairs
    toggleButton.addEventListener('click', () => {
        crosshairsEnabled = !crosshairsEnabled;
        toggleButton.textContent = crosshairsEnabled ? 'Cursor: On' : 'Cursor: Off';
        toggleButton.classList.toggle('active', crosshairsEnabled); // Add/remove "active" class
    });

    // Add the toggle button to the button group
    const buttonGroup = document.querySelector('.btn-group');
    if (buttonGroup) {
        buttonGroup.insertBefore(toggleButton, buttonGroup.firstChild);
    }

    // Create crosshair elements
    const cursorVT = document.createElement('div');
    const cursorHL = document.createElement('div');

    // Base styles for crosshair lines
    const lineStyle = `
        position: absolute;
        z-index: 9999;
        pointer-events: none;
    `;
    cursorVT.style.cssText = `${lineStyle} width: 1px; background: black; top: 0; bottom: 0;`;
    cursorHL.style.cssText = `${lineStyle} height: 1px; background: black; left: 0; right: 0;`;

    // Add lines to the document body
    document.body.appendChild(cursorVT);
    document.body.appendChild(cursorHL);

    // Determine if this is the main page or an individual graph page
    const graphs = document.querySelectorAll('img');
    if (graphs.length > 1) {
        // Main page logic
        document.addEventListener('mousemove', (e) => {
            if (!crosshairsEnabled) {
                cursorVT.style.display = 'none';
                cursorHL.style.display = 'none';
                return;
            }

            const graph = getGraphUnderCursor(e.pageX, e.pageY);

            if (graph) {
                const rect = graph.getBoundingClientRect();
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

                // Set crosshair position and dimensions relative to the graph
                cursorVT.style.left = `${Math.max(rect.left + scrollLeft, Math.min(rect.right + scrollLeft, e.pageX))}px`;
                cursorVT.style.top = `${rect.top + scrollTop}px`;
                cursorVT.style.height = `${rect.height}px`;

                cursorHL.style.top = `${Math.max(rect.top + scrollTop, Math.min(rect.bottom + scrollTop, e.pageY))}px`;
                cursorHL.style.left = `${rect.left + scrollLeft}px`;
                cursorHL.style.width = `${rect.width}px`;

                // Detect background color and adjust line color
                const bgColor = getBackgroundColor(graph);
                const isDark = isDarkColor(bgColor);
                const lineColor = isDark ? 'white' : 'black';

                cursorVT.style.backgroundColor = lineColor;
                cursorHL.style.backgroundColor = lineColor;

                cursorVT.style.display = 'block';
                cursorHL.style.display = 'block';
            } else {
                cursorVT.style.display = 'none';
                cursorHL.style.display = 'none';
            }
        });
    } else if (graphs.length === 1) {
        // Individual graph page logic
        const graph = graphs[0];
        document.addEventListener('mousemove', (e) => {
            if (!crosshairsEnabled) {
                cursorVT.style.display = 'none';
                cursorHL.style.display = 'none';
                return;
            }

            const rect = graph.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

            if (
                e.pageX >= rect.left + scrollLeft &&
                e.pageX <= rect.right + scrollLeft &&
                e.pageY >= rect.top + scrollTop &&
                e.pageY <= rect.bottom + scrollTop
            ) {
                // Update vertical line position
                cursorVT.style.left = `${e.pageX}px`;
                cursorVT.style.top = `${rect.top + scrollTop}px`;
                cursorVT.style.height = `${rect.height}px`;

                // Update horizontal line position
                cursorHL.style.top = `${e.pageY}px`;
                cursorHL.style.left = `${rect.left + scrollLeft}px`;
                cursorHL.style.width = `${rect.width}px`;

                // Use a fixed yellow color for individual graph pages
                const lineColor = 'yellow';
                cursorVT.style.backgroundColor = lineColor;
                cursorHL.style.backgroundColor = lineColor;

                cursorVT.style.display = 'block';
                cursorHL.style.display = 'block';
            } else {
                cursorVT.style.display = 'none';
                cursorHL.style.display = 'none';
            }
        });
    }

    // Helper function: Get the graph under the mouse cursor (for the main page)
    function getGraphUnderCursor(x, y) {
        for (const el of document.querySelectorAll('img.img-responsive')) {
            if (!el.src || el.offsetParent === null) continue; // Skip hidden or empty-src images

            const rect = el.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

            if (
                x >= rect.left + scrollLeft &&
                x <= rect.right + scrollLeft &&
                y >= rect.top + scrollTop &&
                y <= rect.bottom + scrollTop
            ) {
                return el;
            }
        }
        return null;
    }

    // Helper function: Get computed background color of an element
    function getBackgroundColor(el) {
        const style = window.getComputedStyle(el);
        return style.backgroundColor || 'rgb(255, 255, 255)'; // Default to white
    }

    // Helper function: Determine if a color is dark
    function isDarkColor(color) {
        const rgb = color.match(/\d+/g).map(Number);
        const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000; // Perceived brightness formula
        return brightness < 128; // Threshold for dark vs. light
    }
})();
