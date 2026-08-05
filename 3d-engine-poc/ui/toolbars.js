/**
 * ui/toolbars.js — collapsible toolbar sections for narrow screens.
 *
 * On a desktop the control bar is one row of labelled button groups and all of
 * it is worth showing at once. On a phone the same markup is five stacked rows
 * that eat half the yard, and most of it is cold: you pick a cargo type once
 * and then drop containers for a minute.
 *
 * So below the mobile breakpoint every `.toolbar-section` becomes an accordion
 * row — the `.section-title` turns into a chip you tap, and only one section in
 * a bar is open at a time. A collapsed chip still reports what the section is
 * set to ("Spawn Cargo · 20ft"), because a control you cannot see is only
 * acceptable if its state is still legible.
 *
 * Everything here is layout, not game state: the sections, the buttons and
 * their handlers are exactly the ones the desktop bar uses, and above the
 * breakpoint the whole module unwinds itself.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    /**
     * Matches the responsive block in styles/hud.css. Keep in step.
     *
     * The height clause is for a phone turned on its side: 844px is wide enough
     * to escape the width clause, but 390px of height is not enough for a queue
     * down one edge, a readout down the other and a control bar across the
     * bottom — the yard ends up a letterbox in the middle.
     */
    const NARROW = '(max-width: 820px), (max-height: 500px)';

    /* Groups where exactly one button is on, so a collapsed chip can name it. A
       group of independent toggles (the sandbox Tools) has nothing to report. */
    const EXCLUSIVE_ATTRS = ['data-cam', 'data-phys-place', 'data-sb-place', 'data-phys-challenge'];

    function slice(list) { return Array.prototype.slice.call(list); }

    function isExclusive(group) {
        const buttons = slice(group.children);
        if (!buttons.length) return false;
        return buttons.every(function (btn) {
            return btn.classList.contains('palette-btn') || EXCLUSIVE_ATTRS.some(function (attr) {
                return btn.hasAttribute(attr);
            });
        });
    }

    /** A button's label, minus its hotkey chip and its colour swatch. */
    function buttonLabel(btn) {
        return slice(btn.childNodes).map(function (node) {
            if (node.nodeType === 3) return node.textContent;
            if (node.nodeType !== 1) return '';
            if (node.tagName === 'KBD' || node.classList.contains('color-dot')) return '';
            return node.textContent;
        }).join('').trim();
    }

    /** What a collapsed section should say it is set to, or null for nothing. */
    function summaryFor(section) {
        const select = section.querySelector('select');
        if (select) {
            const opt = select.options[select.selectedIndex];
            return { text: opt ? opt.textContent : '', color: '' };
        }

        const group = section.querySelector('.button-group');
        if (!group) return null;

        // Independent toggles have no single answer, so they report a count —
        // enough to tell you X-ray is still on without naming five buttons.
        if (!isExclusive(group)) {
            const on = group.querySelectorAll('.active').length;
            return on ? { text: on + ' on', color: '' } : null;
        }

        const active = group.querySelector('.active');
        if (!active) return null;

        const dot = active.querySelector('.color-dot');
        return { text: buttonLabel(active), color: dot ? dot.style.background : '' };
    }

    /**
     * One control bar. Sections keep their open/closed state across breakpoint
     * changes, so rotating the phone does not reshuffle what you had open.
     */
    function Accordion(bar) {
        const self = this;
        this.bar = bar;
        this.narrow = false;

        this.sections = slice(bar.querySelectorAll('.toolbar-section')).map(function (section) {
            const title = section.querySelector('.section-title');
            if (!title) return null;

            const value = document.createElement('span');
            value.className = 'section-value';
            title.appendChild(value);

            const entry = { section: section, title: title, value: value, open: false, shown: null };

            title.addEventListener('click', function () {
                if (self.narrow) self.toggle(entry);
            });
            title.addEventListener('keydown', function (e) {
                if (!self.narrow || (e.key !== 'Enter' && e.key !== ' ')) return;
                e.preventDefault();
                self.toggle(entry);
            });

            return entry;
        }).filter(Boolean);

        // The spawn palette is the control you come back to, so it is the one
        // section that starts open — and an open section is the clearest hint
        // that the closed chips beside it also expand.
        //
        // Except on a phone held sideways, where the folded bar is already a
        // quarter of the screen and an open section pushes it over the bay.
        // There the hint costs more than it is worth; the chips still expand.
        if (window.matchMedia('(min-height: 560px)').matches) {
            const palette = this.sections.filter(function (entry) {
                return entry.section.querySelector('.palette-btn') ||
                       entry.section.querySelector('#spawn-palette, #physics-palette');
            })[0];
            if (palette) palette.open = true;
            else if (this.sections.length) this.sections[0].open = true;
        }

        /* Picking from an exclusive group is a decision, not an exploration:
           fold the section away again so the yard comes back. Delegated, so it
           runs after the button's own handler has repainted the group. */
        bar.addEventListener('click', function (e) {
            const btn = e.target.closest && e.target.closest('.tool-btn, .palette-btn');
            self.refresh();
            if (!self.narrow || !btn) return;
            const group = btn.parentNode;
            if (group && group.classList.contains('button-group') && isExclusive(group)) {
                const entry = self.entryFor(btn);
                if (entry) self.close(entry);
            }
        });

        bar.addEventListener('change', function () {
            self.refresh();
            if (self.narrow) self.sections.forEach(function (entry) { self.close(entry); });
        });
    }

    Accordion.prototype.entryFor = function (node) {
        return this.sections.filter(function (entry) { return entry.section.contains(node); })[0] || null;
    };

    Accordion.prototype.toggle = function (entry) {
        const opening = !entry.open;
        this.sections.forEach(function (other) { other.open = false; });
        entry.open = opening;
        this.paint();
    };

    Accordion.prototype.close = function (entry) {
        entry.open = false;
        this.paint();
    };

    Accordion.prototype.setNarrow = function (narrow) {
        this.narrow = narrow;
        this.paint();
    };

    /** Repaint the collapsed chips' values — cheap, and safe to call per tick. */
    Accordion.prototype.refresh = function () {
        this.sections.forEach(function (entry) {
            const summary = summaryFor(entry.section);
            const text = summary ? summary.text : '';
            const color = summary ? summary.color : '';
            if (entry.shown === text + '|' + color) return;
            entry.shown = text + '|' + color;

            entry.value.textContent = '';
            if (!text) return;
            if (color) {
                const dot = document.createElement('span');
                dot.className = 'color-dot';
                dot.style.background = color;
                entry.value.appendChild(dot);
            }
            entry.value.appendChild(document.createTextNode(text));
        });
    };

    Accordion.prototype.paint = function () {
        const narrow = this.narrow;
        this.sections.forEach(function (entry) {
            entry.section.classList.toggle('collapsible', narrow);
            entry.section.classList.toggle('is-open', narrow && entry.open);
            if (narrow) {
                entry.title.setAttribute('role', 'button');
                entry.title.setAttribute('tabindex', '0');
                entry.title.setAttribute('aria-expanded', entry.open ? 'true' : 'false');
            } else {
                entry.title.removeAttribute('role');
                entry.title.removeAttribute('tabindex');
                entry.title.removeAttribute('aria-expanded');
            }
        });
        this.refresh();
    };

    /**
     * Wire every control bar on the page. Called once the toolbars are built —
     * the cargo palettes are generated, so this cannot run at parse time.
     */
    function setupToolbars() {
        const bars = slice(document.querySelectorAll('.control-bar')).map(function (bar) {
            return new Accordion(bar);
        });

        const query = window.matchMedia(NARROW);
        function apply() {
            bars.forEach(function (bar) { bar.setNarrow(query.matches); });
        }
        if (query.addEventListener) query.addEventListener('change', apply);
        else if (query.addListener) query.addListener(apply);  // Safari < 14
        apply();

        return {
            refresh: function () { bars.forEach(function (bar) { bar.refresh(); }); }
        };
    }

    Cargo3D.setupToolbars = setupToolbars;
})(window);
