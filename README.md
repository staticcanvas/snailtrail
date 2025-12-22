# <img src="https://raw.githubusercontent.com/staticcanvas/general-resources/main/logos/snailtrail/dist/png/snailtrail-128x128.png" width="32" > **SnailTrail**  Debug bar

> Simple Debug Panel for Static Sites

A lightweight debug panel for static sites built for Jekyll, Eleventy, Hugo, and other static site generators. Inspired by Laravel's debug bar, Snail Trail provides real-time performance metrics, **resource** analysis, and development insights—all accessible via a sleek pull-up panel.


[![gitlab-license](https://img.shields.io/gitlab/license/staticcanvas/snailtrail?style=flat-square&logo=gitlab&labelColor=000000&color=8700d7&logoColor=ff00ff)](https://gitlab.com/staticcanvas) [![gitlab-pipeline](https://img.shields.io/gitlab/pipeline-status/staticcanvas/snailtrail?style=flat-square&logo=gitlab&labelColor=000000&color=8700d7&logoColor=ff00ff)](https://gitlab.com/staticcanvas) [![gitlab-issues](https://img.shields.io/gitlab/issues/open/staticcanvas/snailtrail?style=flat-square&logo=gitlab&labelColor=000000&color=8700d7&logoColor=ff00ff)](https://gitlab.com/staticcanvas) [![npm-version](https://img.shields.io/npm/v/@staticcanvas/snailtrail?style=flat-square&logo=npm&labelColor=000000&color=8700d7&logoColor=ff00ff)](https://www.npmjs.com/package/snailtrail) [![jsr-version](https://img.shields.io/jsr/v/%40staticcanvas/snailtrail?style=flat-square&logo=jsr&labelColor=000000&color=8700d7&logoColor=ff00ff)](https://jsr.io/%40staticcanvas/snailtrail) [![jsdelivr-hitsperweek](https://img.shields.io/jsdelivr/npm/hw/@staticcanvas/snailtrail?style=flat-square&logo=jsdelivr&labelColor=000000&color=8700d7&logoColor=ff00ff)](https://cdn.jsdelivr.net/package/npm/snailtrail) [![unpkg-version](https://img.shields.io/npm/v/@staticcanvas/snailtrail?style=flat-square&logo=unpkg&label=unpkg&labelColor=000000&color=8700d7&logoColor=ff00ff)](https://www.npmjs.com/package/snailtrail) [![npm-sizeMin](https://img.shields.io/bundlephobia/min/@staticcanvas/snailtrail?style=flat-square&logo=npm&labelColor=000000&color=8700d7&logoColor=ff00ff)](https://www.npmjs.com/package/snailtrail) [![npm-sizeZipped](https://img.shields.io/bundlephobia/minzip/@staticcanvas/snailtrail?style=flat-square&logo=npm&labelColor=000000&color=8700d7&logoColor=ff00ff)](https://www.npmjs.com/package/snailtrail)

## 🟣 **Features** 

- **Performance Monitoring** - ***TTFB***, ***FCP***, ***LCP***, ***Resource Timing***
- **Resource Analysis** - Track scripts, ***`stylesheets`***, ***`images`*** with sizes and load times
- **Environment Info** - ***`Viewport`***, ***`user agent`***, ***`connection type`***, ***`color scheme`***
- **JavaScript State** - `LocalStorage`, `SessionStorage`, `cookies`, event `listeners`
- **DOM Analysis** - Node count, depth, accessibility checks (missing alt tags)
- **Console Interception** - Capture and display console messages within the panel
- **Build Information** - Display build timestamps, git hashes, environment
- **Keyboard Shortcut** - Toggle with `Ctrl+Shift+D`
- **Mobile Friendly** - Debug on any device without DevTools
- **Customizable** - Drag to resize, persistent state
- **[logcad](https://gitlab.com/staticcanvas/esmutils/libs/generic/logcad.mjs) intergration**, catches dispatched log messages from `logd`
- **Simple usage:** `localstorage` variable, window `__BUILD_TIMESTAMP__`, `__BUILD_HASH__`, `__BUILD_ENV__`
- **UI memory**: Remember UI state: `open`, `close`, `height`

## 🟣 **Quick Start**

### 🎮 Keyboard Shortcuts


- `Ctrl+Shift+D` - Toggle debug panel visibility

### 🛠️ Installation

🔘 **`Option 1:` Direct Include auto load**
 1. Link script file local or from cdn:
     ```html
     <!-- Add before closing </body> tag -->
     <script src="path/to/snailtrail-debugger.js"></script>
     <!-or->
     // PENDING <-------
     ```
 2. Basic Usage Vanilla JS, just set the localstorage varriable `__snail_debug` to `true`;

     ```javascript
     // In browser console or your script set `__snail_debug` to `true`
     localStorage.__snail_debug = 'true';
     // if you've linked debugger.js as standard script, it will auto run initialization automatically
     // can always set a button to do this
     // Looks for
     // - `__snail_debug` in LocalStorage
     // - `__BUILD_TIMESTAMP__`, `__BUILD_HASH__`, `__BUILD_ENV__` in window
     ```

🔘 **`Option 2:` ES Module ( `type="module"` )** 
 1. Install snail trail debugger
     ```bash
     npm install snailtrail-debugger # use npm
     # or via cdn: jsdelivr
     <script src="https://cdn.jsdelivr.net/npm/snailtrail-debugger@latest/dist/snailtrail.js"></script>
     ```
 2. Import requred functions 

     ```javascript
     import { SnailTrailDebugger, initSnailTrailDebugger } from 'snailtrail-debugger';
     ```

 3.  Modern Usage with ES6
   **Enable the debugger:**
      ```javascript
      // In browser console or your script set `__snail_debug` to `true`
      // Initialize the debugger
      const SnailTrailDebugger = new SnailTrailDebugger({
        storageKey: '__snail_debug'
        parnelId: 'debug-panel'
        buildInfo: {
          timestamp: '2024-11-14 10:30:00',
          hash: 'abc123def456',
          env: 'production'
        }
      });
      // call init function to setup event listners
      initSnailTrailDebugger();
      ```


## 🟣 **Static Site Generator Integration**

### 🔸 Jekyll

```html
<!-- _includes/debug.html -->
<script>
  window.__BUILD_TIMESTAMP__ = '{{ site.time | date: "%Y-%m-%d %H:%M:%S" }}';
  window.__BUILD_HASH__ = '{{ site.github.build_revision }}';
  window.__BUILD_ENV__ = '{{ jekyll.environment }}';
</script>
<script src="{{ '/assets/js/snail-trail-debugger.js' | relative_url }}"></script>

<!-- In your layout -->
{% if jekyll.environment == "development" %}
  {% include debug.html %}
{% endif %}
```

### 🔸 Eleventy (11ty)

```javascript
// .eleventy.js
eleventyConfig.addShortcode("buildInfo", function() {
  return `
    <script>
      window.__BUILD_TIMESTAMP__ = '${new Date().toISOString()}';
      window.__BUILD_HASH__ = '${process.env.GIT_COMMIT || 'local'}';
      window.__BUILD_ENV__ = '${process.env.ELEVENTY_ENV || 'development'}';
    </script>
  `;
});
```

```html
<!-- _includes/layouts/base.njk -->
{% if env == "development" %}
  {% buildInfo %}
  <script src="/assets/js/snail-trail-debugger.js"></script>
{% endif %}
```

### 🔸 Hugo

```html
<!-- layout🔸 s/partials/debug.html -->
<script>
  window.__BUILD_TIMESTAMP__ = '{{ now.Format "2006-01-02 15:04:05" }}';
  window.__BUILD_HASH__ = '{{ getenv "GIT_COMMIT" }}';
  window.__BUILD_ENV__ = '{{ hugo.Environment }}';
</script>
<script src="{{ "js/snail-trail-debugger.js" | relURL }}"></script>

<!-- In your baseof.html -->
{{ if eq hugo.Environment "development" }}
  {{ partial "debug.html" . }}
{{ end }}
```

## 🟣 **Debug Panel Tabs**

### 1. Performance
- Page load time
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- DNS lookup & TCP connection times
- Top 5 slowest resources

### 2. Resources
- Total page weight
- Failed resources count
- All loaded scripts with sizes and load times
- All stylesheets with metrics
- Images with dimensions and sizes

### 3. Environment
- Current URL
- User agent
- Viewport dimensions
- Screen resolution & pixel ratio
- Color scheme preference (dark/light)
- Connection type (4G, WiFi, etc.)

### 4. JS State
- LocalStorage size
- SessionStorage size
- Cookies (names only)
- Active event listeners estimate
- Real-time console log capture (last 20 messages)

### 5. DOM
- Total DOM nodes
- Maximum DOM depth
- Iframe count
- Forms count
- Images without alt attributes
- Internal vs external links

### 6. Build Info
- Build timestamp
- Git commit hash
- Environment (dev/staging/prod)
- Build Environment


## **Styling**

The debugger includes minimal default styles. You can customize by targeting these classes:

```css
.debug-panel { /* Main container */ }
.debug-handle { /* Drag handle */ }
.debug-controls { /* Top control bar */ }
.debug-tabs { /* Tab buttons */ }
.debug-content { /* Content area */ }
.tab-content { /* Individual tab panels */ }
.debug-list { /* List items */ }
```

## **API Methods**

```javascript
// Refresh all data
window.snailDebugger.refresh();

// Destroy and remove panel
window.snailDebugger.destroy();

// Access console log programmatically
console.log(window.snailDebugger.consoleLog);
```

##  **Use Cases**

- **Local Development** - Monitor performance during development
- **Client Demos** - Show technical metrics to stakeholders
- **Mobile Testing** - Debug without remote DevTools
- **Performance Audits** - Quick performance overview
- **Accessibility Checks** - Find images missing alt attributes
- **Build Verification** - Confirm correct build artifacts deployed

## **Best Practices**

1. **Only enable in development** - Use environment checks in your templates
2. **Inject build info** - Makes debugging production issues easier
3. **Use keyboard shortcut** - Quick toggle without scrolling
4. **Monitor console tab** - Catch JavaScript errors early
5. **Check failed resources** - Identify broken asset links

## **Security Note**

The debugger only collects **client-side data** that's already accessible through the browser. It does not:
- Send data to external servers
- Access sensitive cookie values
- Expose server-side information
- Store data beyond LocalStorage

However, **always disable in production** unless needed for specific debugging scenarios.

## **Troubleshooting**

**Panel doesn't appear:**
- Check `localStorage.__snail_debug` is set to `'true'` (string, not boolean)
- Ensure script is loaded after DOM is ready
- Check browser console for JavaScript errors

**Build info shows "Not configured":**
- Verify build variables are being injected
- Check `window.__BUILD_TIMESTAMP__` etc. are defined before debugger initializes

**Performance metrics show N/A:**
- Some metrics require HTTPS (like connection type)
- LCP requires user interaction on some browsers
- Wait for full page load before checking

## **License**

[MIT License](https://gitlab.com/staticcanvas/snailtrail/blob/main/LICENSE) - feel free to use in personal and commercial projects.

## **Acknowledgments**

- Laravel Debug Bar by **Taylor Otwell**
- Symfony Web Debug Toolbar by **Fabien Potencier**
- Browser DevTools by **Google**

## **Contributing**

Contributions welcome! Please feel free to submit a Pull Request.

## **Support**

- 🐛 [Report a bug](https://github.com/staticcanvas/snailtrail/issues)
- 💡 [Request a feature](https://github.com/staticcanvas/snailtrail/issues)
- 📖 [Documentation](https://github.com/staticcanvas/snailtrail/wiki)

---

Made with 🐌 and ☕ for the static site community