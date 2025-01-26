// ==UserScript==
// @name         Crosshairs for Graphs1090 (with Cursor and Extend Toggles)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Add crosshairs to graphs with toggle buttons for cursor and extend mode
// @author       Brian McEntire
// @match        *://*/graphs1090/*
// @match        *://*/*/graphs1090/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const COLORS = {
        LIGHT: 'black',
        DARK: 'white',
        EXTEND: 'yellow'
    };

    class CrosshairManager {
        constructor() {
            this.state = {
                crosshairsEnabled: true,
                extendEnabled: false
            };

            this.elements = {
                cursorVT: this.createCrosshairElement('vertical'),
                cursorHL: this.createCrosshairElement('horizontal')
            };

            this.buttons = {
                cursor: this.createButton('cursor-plus', 'Cursor', true),
                extend: this.createButton('extend', 'Extend', false)
            };

            this.initializeButtons();
            this.setupEventListeners();
        }

        createCrosshairElement(type) {
            const element = document.createElement('div');
            const isVertical = type === 'vertical';
            element.style.cssText = `
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                ${isVertical ? 'width: 1px' : 'height: 1px'};
                background: black;
                ${isVertical ? 'top: 0; bottom: 0' : 'left: 0; right: 0'};
            `;
            document.body.appendChild(element);
            return element;
        }

        createButton(id, label, isActive) {
            const button = document.createElement('button');
            button.id = `btn-${id}`;
            button.className = `btn btn-default btn-sm${isActive ? ' active' : ''}`;
            button.textContent = `${label}: ${isActive ? 'On' : 'Off'}`;
            return button;
        }

        initializeButtons() {
            const buttonGroup = document.querySelector('.btn-group');
            if (buttonGroup) {
                buttonGroup.insertBefore(this.buttons.extend, buttonGroup.firstChild);
                buttonGroup.insertBefore(this.buttons.cursor, buttonGroup.firstChild);
            }
        }

        setupEventListeners() {
            this.buttons.cursor.addEventListener('click', () => this.toggleCursor());
            this.buttons.extend.addEventListener('click', () => this.toggleExtend());
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        }

        toggleCursor() {
            this.state.crosshairsEnabled = !this.state.crosshairsEnabled;
            this.updateButtonState(this.buttons.cursor, 'Cursor', this.state.crosshairsEnabled);
        }

        toggleExtend() {
            this.state.extendEnabled = !this.state.extendEnabled;
            this.updateButtonState(this.buttons.extend, 'Extend', this.state.extendEnabled);
        }

        updateButtonState(button, label, isActive) {
            button.textContent = `${label}: ${isActive ? 'On' : 'Off'}`;
            button.classList.toggle('active', isActive);
        }

        handleMouseMove(e) {
            if (!this.state.crosshairsEnabled) {
                this.hideCrosshairs();
                return;
            }

            if (this.state.extendEnabled) {
                this.showExtendedCrosshairs(e);
            } else {
                this.showGraphCrosshairs(e);
            }
        }

        showExtendedCrosshairs(e) {
            const { cursorVT, cursorHL } = this.elements;

            cursorVT.style.cssText = `
                ${cursorVT.style.cssText};
                left: ${e.clientX}px;
                top: 0px;
                height: ${window.innerHeight}px;
                background-color: ${COLORS.EXTEND};
                display: block;
            `;

            cursorHL.style.cssText = `
                ${cursorHL.style.cssText};
                top: ${e.clientY}px;
                left: 0px;
                width: ${window.innerWidth}px;
                background-color: ${COLORS.EXTEND};
                display: block;
            `;
        }

        showGraphCrosshairs(e) {
            const graphs = document.querySelectorAll('img');
            const isSingleGraphPage = graphs.length === 1 && graphs[0].getAttribute('style')?.includes('cursor: zoom-in');
            const graph = isSingleGraphPage ? graphs[0] : this.getGraphUnderCursor(e.pageX, e.pageY);

            if (!graph) {
                this.hideCrosshairs();
                return;
            }

            const rect = graph.getBoundingClientRect();
            const lineColor = isSingleGraphPage ? COLORS.EXTEND : this.getLineColor(graph);

            this.updateCrosshairPosition(rect, e.clientX, e.clientY, lineColor);
        }

        getLineColor(graph) {
            const bgColor = window.getComputedStyle(graph).backgroundColor || 'rgb(255, 255, 255)';
            const rgb = bgColor.match(/\d+/g).map(Number);
            const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
            return brightness < 128 ? COLORS.DARK : COLORS.LIGHT;
        }

        updateCrosshairPosition(rect, clientX, clientY, color) {
            const { cursorVT, cursorHL } = this.elements;
            cursorVT.style.cssText = `
                ${cursorVT.style.cssText};
                left: ${Math.max(rect.left, Math.min(rect.right, clientX))}px;
                top: ${rect.top}px;
                height: ${rect.height}px;
                background-color: ${color};
                display: block;
            `;

            cursorHL.style.cssText = `
                ${cursorHL.style.cssText};
                top: ${Math.max(rect.top, Math.min(rect.bottom, clientY))}px;
                left: ${rect.left}px;
                width: ${rect.width}px;
                background-color: ${color};
                display: block;
            `;
        }

        getGraphUnderCursor(x, y) {
            for (const el of document.querySelectorAll('img.img-responsive')) {
                if (!el.src || el.offsetParent === null) continue;
                const rect = el.getBoundingClientRect();
                if (
                    x >= rect.left + window.scrollX &&
                    x <= rect.right + window.scrollX &&
                    y >= rect.top + window.scrollY &&
                    y <= rect.bottom + window.scrollY
                ) {
                    return el;
                }
            }
            return null;
        }

        hideCrosshairs() {
            this.elements.cursorVT.style.display = 'none';
            this.elements.cursorHL.style.display = 'none';
        }
    }

    // Initialize the crosshair manager when the script loads
    new CrosshairManager();
})();
