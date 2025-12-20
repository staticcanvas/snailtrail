/**
 * 🐌 Snail Trail Debugger
 * A comprehensive debug panel for static sites (Jekyll, Eleventy, Hugo)
 * Activated via localStorage._debug = 'true'
 */

class SnailTrailDebugger {
    constructor(options = {}) {
        this.options = {
            storageKey: "__snail_debug",
            panelId: "debug-panel",
            buildInfo: options.buildInfo || {}, // { timestamp, hash, env }
            theme: "theme-snailtrail",
            logname: "stdebugger",
            ...options,
        };

        this.isEnabled =
            localStorage.getItem(this.options.storageKey) === "true";
        this.panel = null;
        this.consoleLog = [];
        this.performanceObserver = null;
        this.lcpValue = null;
        this.eventListenerCount = 0;
        this.eventListeners = new Map(); // Track by element

        if (this.isEnabled) {
            this.init();
        }
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.injectHTML();
        this.loadTheme();
        this.interceptConsole();
        this.setupEventListeners();
        this.trackEventListeners();
        this.collectData();
        this.observeLCP();
        this.setupResizeHandler();
        this.listenForDebugLogs();
        this.loadStoredDebugLogs();
    }

    loadTheme() {
        // 1. Select your debug panel
        const debugPanel = document.querySelector(".debug-panel");

        // 2. Define your available themes (matching your CSS class names)
        const themes = [
            "theme-newspaper",
            "theme-snailtrail",
            "theme-cyberpunk",
            "theme-industrial",
            "theme-forest",
            "theme-blueprint",
            "theme-ocean",
            "theme-amber",
            "theme-dracula",
            "theme-github-light",
            "theme-github-dark",
        ];

        function switchTheme(themeName) {
            // Remove all known theme classes first
            debugPanel.classList.remove(...themes);

            // Add the selected theme class
            if (themeName) {
                logd(
                    { name: "stdebugger", logname: "debuglogger" },
                    "applyTheme",
                    `Applying theme "${themeName}"...`,
                    { themeName: themeName },
                    false,
                );
                debugPanel.classList.add(themeName);
            }

            // Optional: Save to local storage so it persists on refresh
            logd(
                { name: "stdebugger", logname: "debuglogger" },
                "applyTheme",
                `Saving theme "${themeName}" to local storage...`,
                null,
                false,
            );
            localStorage.setItem("snailtrail-theme", themeName);
        }

        // 3. Set your theme
        switchTheme(this.options.theme);
    }

    injectHTML() {
        const html = `
    <div id="debug-panel" class="debug-panel debug-panel-hidden" style="height: 400px">
        <div id="debug-handle" class="debug-handle">
            <span>&bull; DRAG TO RESIZE &bull;</span>
        </div>
        <div class="debug-controls">
            <span class="debug-title">🐌 st-debugger</span>
            <button id="debug-toggle">SHOW</button>
        </div>
        <div class="debug-content">
            <div class="debug-tabs">
                <button class="tab-button active" data-tab="performance">Performance</button>
                <button class="tab-button" data-tab="resources">Resources</button>
                <button class="tab-button" data-tab="environment">Environment</button>
                <button class="tab-button" data-tab="js-state">JS State</button>
                <button class="tab-button" data-tab="dom">DOM</button>
                <button class="tab-button" data-tab="build">Build Info</button>
            </div>
            <div id="debug-tabs-container">
                <div id="performance" class="tab-content active">
                    <h3>Performance & Timing</h3>
                    <ul class="debug-list">
                        <li><span class="list-key">Page load time (window.load):</span> <span class="list-value" id="perf-load"></span></li>
                        <li><span class="list-key">Time to First Byte (TTFB):</span> <span class="list-value" id="perf-ttfb"></span></li>
                        <li><span class="list-key">First Contentful Paint (FCP):</span> <span class="list-value" id="perf-fcp"></span></li>
                        <li><span class="list-key">Largest Contentful Paint (LCP):</span> <span class="list-value" id="perf-lcp"></span></li>
                        <li><span class="list-key">DNS Lookup:</span> <span class="list-value" id="perf-dns"></span></li>
                        <li><span class="list-key">TCP Connect:</span> <span class="list-value" id="perf-tcp"></span></li>
                    </ul>
                    <h4>Resource Timing (Top 5 Slowest)</h4>
                    <ul class="debug-list" id="perf-resources-list"></ul>
                </div>
                <div id="resources" class="tab-content">
                    <h3>Resources</h3>
                    <ul class="debug-list">
                        <li><span class="list-key">Total Page Weight:</span> <span class="list-value" id="res-total-weight"></span></li>
                        <li><span class="list-key">Failed Resources (404s/Errors):</span> <span class="list-value" id="res-failed-count"></span></li>
                    </ul>
                    <h4>Loaded Scripts</h4>
                    <ul class="debug-list" id="res-scripts-list"></ul>
                    <h4>Loaded Stylesheets</h4>
                    <ul class="debug-list" id="res-styles-list"></ul>
                    <h4>Images</h4>
                    <ul class="debug-list" id="res-images-list"></ul>
                </div>
                <div id="environment" class="tab-content">
                    <h3>Environment</h3>
                    <ul class="debug-list">
                        <li><span class="list-key">Current URL:</span> <span class="list-value" id="env-url"></span></li>
                        <li><span class="list-key">User Agent:</span> <span class="list-value" id="env-ua"></span></li>
                        <li><span class="list-key">Viewport Dimensions:</span> <span class="list-value" id="env-viewport"></span></li>
                        <li><span class="list-key">Screen Resolution/Ratio:</span> <span class="list-value" id="env-screen"></span></li>
                        <li><span class="list-key">Color Scheme Preference:</span> <span class="list-value" id="env-scheme"></span></li>
                        <li><span class="list-key">Connection Type:</span> <span class="list-value" id="env-connection"></span></li>
                    </ul>
                </div>
                <div id="js-state" class="tab-content">
                    <h3>JavaScript State</h3>
                    <ul class="debug-list">
                        <li><span class="list-key">LocalStorage Size:</span> <span class="list-value" id="js-ls-size"></span></li>
                        <li><span class="list-key">SessionStorage Size:</span> <span class="list-value" id="js-ss-size"></span></li>
                        <li><span class="list-key">Cookies (Names):</span> <span class="list-value" id="js-cookies"></span></li>
                        <li><span class="list-key">Active Event Listeners (Estimate):</span> <span class="list-value" id="js-listeners"></span></li>
                        <li><span class="list-key">Active Event Listeners (List):</span> <span class="list-value" id="js-events"></span></li>
                    </ul>
                    <h4>Console Messages & Errors (Intercepted)</h4>
                    <ul class="debug-list debug-log" id="js-console-log"></ul>
                </div>
                <div id="dom" class="tab-content">
                    <h3>DOM</h3>
                    <ul class="debug-list">
                        <li><span class="list-key">Total DOM Nodes:</span> <span class="list-value" id="dom-nodes"></span></li>
                        <li><span class="list-key">Max DOM Depth:</span> <span class="list-value" id="dom-depth"></span></li>
                        <li><span class="list-key">Iframes Present:</span> <span class="list-value" id="dom-iframes"></span></li>
                        <li><span class="list-key">Forms on Page:</span> <span class="list-value" id="dom-forms"></span></li>
                        <li><span class="list-key">Images without Alt:</span> <span class="list-value" id="dom-no-alt"></span></li>
                        <li><span class="list-key">Internal Links:</span> <span class="list-value" id="dom-links-int"></span></li>
                        <li><span class="list-key">External Links:</span> <span class="list-value" id="dom-links-ext"></span></li>
                    </ul>
                </div>
                <div id="build" class="tab-content">
                    <h3>Build/Static Site Specific</h3>
                    <ul class="debug-list">
                        <li><span class="list-key">Build Timestamp:</span> <span class="list-value" id="build-timestamp"></span></li>
                        <li><span class="list-key">Git Commit Hash:</span> <span class="list-value" id="build-hash"></span></li>
                        <li><span class="list-key">Environment:</span> <span class="list-value" id="build-env"></span></li>
                        <li><span class="list-key">Arcitecture:</span> <div class="list-value" id="build-arc"></div></li>
                    </ul>
                    <p class="note">💡 Tip: Inject build info via <code>new SnailTrailDebugger({ buildInfo: { timestamp, hash, env } })</code></p>
                </div>
            </div>
        </div>
    </div>`;

        document.body.insertAdjacentHTML("beforeend", html);
        this.panel = document.getElementById("debug-panel");
    }

    setupEventListeners() {
        const toggleBtn = document.getElementById("debug-toggle");
        const tabButtons = document.querySelectorAll(".tab-button");

        toggleBtn.addEventListener("click", () => this.togglePanel());

        tabButtons.forEach((btn) => {
            btn.addEventListener("click", (e) =>
                this.switchTab(e.target.dataset.tab),
            );
        });

        // Keyboard shortcut: Ctrl+Shift+D
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === "D") {
                logd(
                    { name: "stdebugger", logname: "debuglogger" },
                    "keydown",
                    "Keyboard shortcut: Ctrl+Shift+D",
                    null,
                    false,
                );
                e.preventDefault();
                this.togglePanel();
            }
        });
    }

    trackEventListeners() {
        const self = this;

        // Store the ORIGINAL functions before ANY wrapping
        const originalAdd = EventTarget.prototype.addEventListener;
        const originalRemove = EventTarget.prototype.removeEventListener;

        // Wrap addEventListener
        EventTarget.prototype.addEventListener = function (
            type,
            listener,
            options,
        ) {
            // FIRST: Call the original function to ensure it works
            const result = originalAdd.call(this, type, listener, options);

            // THEN: Track it (non-blocking)
            try {
                self.eventListenerCount++;

                // Track the listener for this element
                if (!self.eventListeners.has(this)) {
                    self.eventListeners.set(this, new Map());
                }
                const elementListeners = self.eventListeners.get(this);
                if (!elementListeners.has(type)) {
                    elementListeners.set(type, new Set());
                }
                elementListeners.get(type).add(listener);

                // Update the display
                self.setContent("js-listeners", self.eventListenerCount);

                // also need to generate html for events in js-events element as a list of event types, template below:
                // Example:
                // <li> <span class="js-event-meta-element">.elementType(span,b,div)</span> <span class=js-event-meta-type></span> </li>
                // can we use innerHTML?
                self.setInnerHtml(
                    "js-events",
                    "<li>" +
                        Array.from(self.eventListeners.entries())
                            .map(([element, typesMap]) => {
                                return Array.from(typesMap.entries())
                                    .map(([type, listenersSet]) => {
                                        return `<div class="js-event-meta-container"><span class="js-event-meta-element">
                      ${element.id ? `#${element.id}` : ""}${element.className ? `.${element.className.split(" ").join(".")}` : ""}
                    </span>
                    <span class="js-event-meta-type">
                      ${type} (${listenersSet.size})
                    </span></div>`;
                                    })
                                    .join("");
                            })
                            .join(""),
                ) + "</li>";
            } catch (e) {
                // Silently fail tracking, don't break the event listener
                console.warn("Failed to track event listener:", e);
            }

            return result;
        };

        // Wrap removeEventListener
        EventTarget.prototype.removeEventListener = function (
            type,
            listener,
            options,
        ) {
            // FIRST: Call the original function to ensure it works
            const result = originalRemove.call(this, type, listener, options);

            // THEN: Update tracking (non-blocking)
            try {
                if (self.eventListeners.has(this)) {
                    const elementListeners = self.eventListeners.get(this);
                    if (elementListeners.has(type)) {
                        const listeners = elementListeners.get(type);
                        if (listeners.has(listener)) {
                            listeners.delete(listener);
                            self.eventListenerCount--;

                            // Cleanup empty sets/maps
                            if (listeners.size === 0) {
                                elementListeners.delete(type);
                            }
                            if (elementListeners.size === 0) {
                                self.eventListeners.delete(this);
                            }

                            // Update the display
                            self.setContent(
                                "js-listeners",
                                self.eventListenerCount,
                            );
                        }
                    }
                }
            } catch (e) {
                // Silently fail tracking, don't break the removal
                console.warn("Failed to untrack event listener:", e);
            }

            return result;
        };
    }

    togglePanel() {
        const isHidden = this.panel.classList.toggle("debug-panel-hidden");
        const toggleBtn = document.getElementById("debug-toggle");
        toggleBtn.textContent = isHidden ? "SHOW" : "HIDE";

        // Save state
        localStorage.setItem("_debug_collapsed", isHidden);
    }

    switchTab(tabName) {
        document
            .querySelectorAll(".tab-button")
            .forEach((btn) => btn.classList.remove("active"));
        document
            .querySelectorAll(".tab-content")
            .forEach((content) => content.classList.remove("active"));

        document
            .querySelector(`[data-tab="${tabName}"]`)
            .classList.add("active");
        document.getElementById(tabName).classList.add("active");
    }

    collectData() {
        // Wait for window load to collect complete data
        window.addEventListener("load", () => {
            this.collectPerformanceData();
            this.collectResourceData();
            this.collectEnvironmentData();
            this.collectJSStateData();
            this.collectDOMData();
            this.collectBuildData();
        });
    }

    collectPerformanceData() {
        const perf = performance.timing;
        const nav = performance.getEntriesByType("navigation")[0];

        // Page load time
        const loadTime = perf.loadEventEnd - perf.navigationStart;
        this.setContent("perf-load", `${loadTime}ms`);

        // TTFB
        const ttfb = perf.responseStart - perf.requestStart;
        this.setContent("perf-ttfb", `${ttfb}ms`);

        // FCP
        const fcp = performance.getEntriesByName("first-contentful-paint")[0];
        this.setContent(
            "perf-fcp",
            fcp ? `${Math.round(fcp.startTime)}ms` : "N/A",
        );

        // LCP (observed separately)
        this.setContent(
            "perf-lcp",
            this.lcpValue ? `${Math.round(this.lcpValue)}ms` : "Measuring...",
        );

        // DNS & TCP
        const dns = perf.domainLookupEnd - perf.domainLookupStart;
        const tcp = perf.connectEnd - perf.connectStart;
        this.setContent("perf-dns", `${dns}ms`);
        this.setContent("perf-tcp", `${tcp}ms`);

        // Top 5 slowest resources
        const resources = performance
            .getEntriesByType("resource")
            .map((r) => ({ name: r.name, duration: Math.round(r.duration) }))
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5);

        const resourcesList = document.getElementById("perf-resources-list");
        if (resourcesList) {
            resourcesList.innerHTML =
                resources.length > 0
                    ? resources
                          .map(
                              (r) =>
                                  `<li><span class="list-key">${this.truncateURL(r.name)}:</span> ${r.duration}ms</li>`,
                          )
                          .join("")
                    : "<li>No resources loaded yet</li>";
        }
    }

    observeLCP() {
        try {
            const po = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.lcpValue = lastEntry.startTime;
                this.setContent("perf-lcp", `${Math.round(this.lcpValue)}ms`);
            });
            po.observe({ entryTypes: ["largest-contentful-paint"] });
            this.performanceObserver = po;
        } catch (e) {
            this.setContent("perf-lcp", "Not supported");
        }
    }

    collectResourceData() {
        const resources = performance.getEntriesByType("resource");

        // Total weight
        let totalSize = 0;
        resources.forEach((r) => {
            if (r.transferSize) totalSize += r.transferSize;
        });
        this.setContent("res-total-weight", this.formatBytes(totalSize));

        // Failed resources (we can't detect 404s directly, but can track errors)
        this.setContent("res-failed-count", "0 (monitor console for errors)");

        // Scripts
        const scripts = resources.filter((r) => r.initiatorType === "script");
        const scriptsList = document.getElementById("res-scripts-list");
        if (scriptsList) {
            scriptsList.innerHTML =
                scripts.length > 0
                    ? scripts
                          .map(
                              (s) =>
                                  `<li><span class="list-key">${this.truncateURL(s.name)}:</span> ${this.formatBytes(s.transferSize)} (${Math.round(s.duration)}ms)</li>`,
                          )
                          .join("")
                    : "<li>No scripts detected</li>";
        }

        // Stylesheets
        const styles = resources.filter(
            (r) => r.initiatorType === "link" || r.initiatorType === "css",
        );
        const stylesList = document.getElementById("res-styles-list");
        if (stylesList) {
            stylesList.innerHTML =
                styles.length > 0
                    ? styles
                          .map(
                              (s) =>
                                  `<li><span class="list-key">${this.truncateURL(s.name)}:</span> ${this.formatBytes(s.transferSize)} (${Math.round(s.duration)}ms)</li>`,
                          )
                          .join("")
                    : "<li>No stylesheets detected</li>";
        }

        // Images
        const images = Array.from(document.images);
        const imagesList = document.getElementById("res-images-list");
        if (imagesList) {
            if (images.length === 0) {
                imagesList.innerHTML = "<li>No images detected</li>";
            } else {
                imagesList.innerHTML = images
                    .slice(0, 10)
                    .map((img) => {
                        const resource = resources.find(
                            (r) => r.name === img.src,
                        );
                        return `<li><span class="list-key">${this.truncateURL(img.src)}:</span> ${img.naturalWidth}×${img.naturalHeight} ${resource ? this.formatBytes(resource.transferSize) : ""}</li>`;
                    })
                    .join("");

                if (images.length > 10) {
                    imagesList.innerHTML += `<li><em>... and ${images.length - 10} more images</em></li>`;
                }
            }
        }
    }

    collectEnvironmentData() {
        this.setContent("env-url", window.location.href);
        this.setContent("env-ua", navigator.userAgent);
        this.setContent(
            "env-viewport",
            `${window.innerWidth}×${window.innerHeight}px`,
        );
        this.setContent(
            "env-screen",
            `${screen.width}×${screen.height}px @ ${window.devicePixelRatio}x`,
        );

        const scheme = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "Dark"
            : "Light";
        this.setContent("env-scheme", scheme);

        const connection =
            navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection;
        this.setContent(
            "env-connection",
            connection ? connection.effectiveType : "N/A",
        );
    }

    collectJSStateData() {
        // LocalStorage size
        let lsSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                lsSize += localStorage[key].length + key.length;
            }
        }
        this.setContent("js-ls-size", this.formatBytes(lsSize * 2)); // *2 for UTF-16

        // SessionStorage size
        let ssSize = 0;
        for (let key in sessionStorage) {
            if (sessionStorage.hasOwnProperty(key)) {
                ssSize += sessionStorage[key].length + key.length;
            }
        }
        this.setContent("js-ss-size", this.formatBytes(ssSize * 2));

        // Cookies
        const cookies = document.cookie
            .split(";")
            .map((c) => c.trim().split("=")[0])
            .filter(Boolean);
        this.setContent(
            "js-cookies",
            cookies.length ? cookies.join(", ") : "None",
        );

        // Event listeners (tracked by our wrapper)
        this.setContent("js-listeners", this.eventListenerCount);

        // Console log
        this.updateConsoleLog();
    }

    collectDOMData() {
        const allElements = document.querySelectorAll("*");
        this.setContent("dom-nodes", allElements.length);

        // Max depth
        let maxDepth = 0;
        const getDepth = (el, depth = 0) => {
            if (depth > maxDepth) maxDepth = depth;
            Array.from(el.children).forEach((child) =>
                getDepth(child, depth + 1),
            );
        };
        getDepth(document.body);
        this.setContent("dom-depth", maxDepth);

        this.setContent(
            "dom-iframes",
            document.querySelectorAll("iframe").length,
        );
        this.setContent("dom-forms", document.forms.length);

        const imgsNoAlt = Array.from(document.images).filter(
            (img) => !img.alt,
        ).length;
        this.setContent("dom-no-alt", imgsNoAlt);

        const links = Array.from(document.links);
        const internal = links.filter(
            (a) => a.hostname === location.hostname,
        ).length;
        const external = links.length - internal;
        this.setContent("dom-links-int", internal);
        this.setContent("dom-links-ext", external);
    }

    collectBuildData() {
        const { timestamp, hash, env, arc } = this.options.buildInfo;
        this.setContent("build-timestamp", timestamp || "Not configured");
        this.setContent("build-hash", hash || "Not configured");
        this.setContent("build-env", env || "Not configured");
        this.setContent("build-arc", arc || "Not configured");
    }

    interceptConsole() {
        const types = ["log", "warn", "error", "info"];

        types.forEach((type) => {
            const original = console[type];
            console[type] = (...args) => {
                this.consoleLog.push({
                    type,
                    message: args
                        .map((a) =>
                            typeof a === "object" ? JSON.stringify(a) : a,
                        )
                        .join(" "),
                    timestamp: new Date().toISOString(),
                });
                this.updateConsoleLog();
                original.apply(console, args);
            };
        });

        // Track errors
        window.addEventListener("error", (e) => {
            this.consoleLog.push({
                type: "error",
                message: `${e.message} at ${e.filename}:${e.lineno}:${e.colno}`,
                timestamp: new Date().toISOString(),
            });
            this.updateConsoleLog();
        });
    }

    updateConsoleLog() {
        const logEl = document.getElementById("js-console-log");
        if (!logEl) return;

        const last20 = this.consoleLog.slice(-20).reverse();
        logEl.innerHTML =
            last20
                .map((entry) => {
                    const time = new Date(entry.timestamp).toLocaleTimeString();
                    const typeClass = `log-${entry.type}`;

                    // Check if this is a styled log entry
                    if (entry.isStyled) {
                        return `<li class="${typeClass}"><span class="list-key">[${time}]</span> ${entry.message}</li>`;
                    } else {
                        // Regular console log
                        return `<li class="${typeClass}"><span class="list-key">[${time}] ${entry.type.toUpperCase()}:</span> ${this.escapeHTML(entry.message)}</li>`;
                    }
                })
                .join("") || "<li>No console messages yet</li>";
    }

    listenForDebugLogs() {
        window.addEventListener("debuglog", (e) => {
            const logEntry = e.detail;

            // Add to internal log array
            this.consoleLog.push({
                type: logEntry.type || "debug",
                message: this.renderStyledLog(logEntry),
                timestamp: logEntry.timestamp,
                isStyled: true,
            });

            // Update the display
            this.updateConsoleLog();
        });
    }

    loadStoredDebugLogs() {
        try {
            const storedLogs = JSON.parse(
                localStorage.getItem("_debug_log") || "[]",
            );

            storedLogs.forEach((logEntry) => {
                this.consoleLog.push({
                    type: logEntry.type || "debug",
                    message: this.renderStyledLog(logEntry),
                    timestamp: logEntry.timestamp,
                    isStyled: true,
                });
            });

            this.updateConsoleLog();
        } catch (e) {
            console.error("Failed to load debug logs:", e);
        }
    }

    renderStyledLog(logEntry) {
        if (!logEntry.styles) {
            // Fallback for non-styled logs
            return `${logEntry.action || ""} ${logEntry.message || ""}`;
        }

        return logEntry.styles
            .map((seg) => {
                const styles = [
                    `color: ${seg.c || "inherit"}`,
                    seg.bg ? `background: ${seg.bg}` : "",
                    seg.b ? "font-weight: bold" : "",
                    "padding: 2px 4px",
                    "border-radius: 2px",
                    "display: inline-block",
                ]
                    .filter(Boolean)
                    .join("; ");

                return `<span style="${styles}">${this.escapeHTML(seg.text)}</span>`;
            })
            .join("");
    }

    setupResizeHandler() {
        const handle = document.getElementById("debug-handle");
        if (!handle || !this.panel) return;

        let isResizing = false;
        let startY = 0;
        let startHeight = 0;

        handle.addEventListener("mousedown", (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = this.panel.offsetHeight;
            document.body.style.userSelect = "none";
        });

        document.addEventListener("mousemove", (e) => {
            if (!isResizing || !this.panel) return;
            const delta = startY - e.clientY;
            const newHeight = Math.max(
                200,
                Math.min(window.innerHeight - 50, startHeight + delta),
            );
            this.panel.style.height = `${newHeight}px`;
        });

        document.addEventListener("mouseup", () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.userSelect = "";
            }
        });
    }

    // Utility methods
    setContent(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // innerHtml
    setInnerHtml(id, value) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = value;
    }

    formatBytes(bytes) {
        if (bytes === 0) return "0 B";
        if (!bytes) return "N/A";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    truncateURL(url, maxLength = 50) {
        if (url.length <= maxLength) return url;
        const parts = url.split("/");
        const filename = parts[parts.length - 1];
        return ".../" + filename;
    }

    escapeHTML(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    // Public API
    refresh() {
        this.collectData();
    }

    destroy() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        if (this.panel) {
            this.panel.remove();
        }
    }
}

function initSnailTrailDebugger() {
    // *************************************************
    // SETUP EVENT LISTENERS AND INITIALIZE
    // *************************************************
    if (localStorage.getItem("_debug") === "true") {
        document.addEventListener("DOMContentLoaded", () => {
            const panel = document.getElementById("debug-panel");
            const toggleButton = document.getElementById("debug-toggle");
            const handle = document.getElementById("debug-handle");
            const tabs = document.querySelectorAll(".debug-tabs .tab-button");
            const tabContents = document.querySelectorAll(".tab-content");

            // Initial state control
            let isHidden = true; // Panel starts minimized/hidden

            //panel.style.height = '35px'; // Initial height (handle + controls)
            //#FIX: manually set hight in html object
            // also need to set the inline css height for the content area

            // check localstorage for calaspse state
            if (localStorage.getItem("_debug_collapsed") === "false") {
                isHidden = false;
                panel.style.height = "400px";
                panel.classList.remove("debug-panel-hidden");
            }

            // --- 1. TOGGLE (SHOW/HIDE) FUNCTIONALITY ---
            const togglePanel = () => {
                // isHidden = !isHidden;
                panel.classList.toggle("debug-panel-hidden", isHidden);
                toggleButton.textContent = isHidden ? "SHOW" : "HIDE";

                if (!isHidden) {
                    panel.style.height = "400px";
                    panel.classList.remove("debug-panel-hidden");
                    localStorage.setItem("_debug_collapsed") === "false";
                } else {
                    localStorage.setItem("_debug_collapsed") === "true";
                    setTimeout(() => {
                        panel.style.height = "35px"; // Must match CSS controls + handle height
                    }, 300);
                }
            };

            // toggleButton.addEventListener('click', togglePanel);

            // --- 2. DRAG-TO-RESIZE FUNCTIONALITY ---
            let isDragging = false;
            let startY;
            let startHeight;

            // Start Drag
            handle.addEventListener("mousedown", (e) => {
                // Only allow resize if the panel is currently shown (not minimized)
                if (!isHidden) {
                    isDragging = true;
                    startY = e.clientY;
                    startHeight = panel.offsetHeight;

                    // Disable CSS transition during drag for smooth movement
                    panel.style.transition = "none";
                    document.body.style.cursor = "ns-resize"; // Change cursor for feedback
                }
            });

            // Drag Movement
            document.addEventListener("mousemove", (e) => {
                if (!isDragging) return;

                const deltaY = e.clientY - startY;
                // New height = start height - (mouse movement change on Y-axis)
                const newHeight = startHeight - deltaY;

                // Define height boundaries
                const minHeight = 100;
                const maxHeight = window.innerHeight * 0.95;

                if (newHeight >= minHeight && newHeight <= maxHeight) {
                    panel.style.height = `${newHeight}px`;
                }
            });

            // End Drag
            document.addEventListener("mouseup", () => {
                if (isDragging) {
                    isDragging = false;
                    // Re-enable CSS transition for smooth toggle animation later
                    panel.style.transition =
                        "height 0.3s ease-in-out, transform 0.3s ease-in-out";
                    document.body.style.cursor = "default";
                }
            });

            // --- 3. TAB SWITCHING FUNCTIONALITY ---
            tabs.forEach((button) => {
                button.addEventListener("click", (e) => {
                    const tabId = e.target.getAttribute("data-tab");

                    // 1. Deactivate all tabs and content
                    tabs.forEach((btn) => btn.classList.remove("active"));
                    tabContents.forEach((content) =>
                        content.classList.remove("active"),
                    );

                    // 2. Activate the clicked button and corresponding content
                    e.target.classList.add("active");
                    document.getElementById(tabId).classList.add("active");
                });
            });
        });
    }
}

// ES6 Module Exports //
export { SnailTrailDebugger, initSnailTrailDebugger };

// Export Scope: Vanilla has autoload functionality //
// !Note:use type module to use import
if (
    typeof module !== "undefined" &&
    module.exports &&
    typeof window !== "undefined" &&
    localStorage.getItem("_debug") === "true"
) {
    window.SnailTrailDebugger = new SnailTrailDebugger({
        storageKey: "__snail_debug",
        panelId: "debug-panel",
        buildInfo: {
            // These should be injected during your build process
            timestamp: window.__BUILD_TIMESTAMP || null,
            hash: window.__BUILD_HASH || null,
            env: window.__BUILD_ENV || null,
        },
    });
    // Auto Setup Debugger
    initSnailTrailDebugger();
}

// CommonJS (Node.js/require)
// !NOTE Mulpiple you return in an object array
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        SnailTrailDebugger,
        initSnailTrailDebugger,
    };
}
