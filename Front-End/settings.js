/* =====================================================================
   Settings overlay — shared across all app pages.

   Rather than being its own route like leads/sales/campaigns/reports,
   Settings is a modal that is injected into whatever page you're on and
   opened from the existing "Settings" link in the sidebar.

   To add it to a page you only need two lines:
       <link rel="stylesheet" href="settings.css">
       <script src="settings.js"></script>   (after the page's own script)

   Preferences persist in localStorage for this browser.
   ===================================================================== */

(function () {

    var LS = {
        name:          "nexus.displayName",
        role:          "nexus.role",
        theme:         "nexus.theme",          // "dark" | "light"
        motion:        "nexus.reduceMotion",   // "1" | "0"
        notifications: "nexus.notifications"   // "1" | "0"  (default on)
    };


    /* ---- Apply theme + motion IMMEDIATELY (before DOMContentLoaded) so the
            page doesn't flash the wrong theme on load. ------------------- */

    function applyTheme() {
        var dark = localStorage.getItem(LS.theme) === "dark";
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    }

    function applyMotion() {
        var reduce = localStorage.getItem(LS.motion) === "1";
        document.documentElement.classList.toggle("reduce-motion", reduce);
    }

    applyTheme();
    applyMotion();


    /* ---- Globally gate notifications through the toggle. settings.js loads
            after each page's own script, so window.showNotification already
            exists here and we can wrap it once for every page. ----------- */

    var pageNotify = window.showNotification;
    window.showNotification = function (title, message) {
        if (localStorage.getItem(LS.notifications) === "0") return;
        if (typeof pageNotify === "function") pageNotify(title, message);
    };

    function notify(title, message) {
        window.showNotification(title, message);
    }


    // "The Cascades" -> "TC"
    function initials(name) {
        var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return "TC";
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }


    function applyProfileToSidebar() {
        var name = localStorage.getItem(LS.name) || "The Cascades";
        var role = localStorage.getItem(LS.role) || "Admin";

        var strong = document.querySelector(".profile strong");
        var small  = document.querySelector(".profile small");
        var avatar = document.querySelector(".profile .avatar");

        if (strong) strong.textContent = name;
        if (small)  small.textContent  = role;
        if (avatar) avatar.textContent = initials(name);
    }


    /* ---- Consistent SVG icon set (Lucide-style, stroke = currentColor) ----
            Replaces the ad-hoc Unicode glyphs (♟ ♣ ◉ ▥ ◆ 📅) so the whole
            app shares one coherent icon language. Injected here so all five
            pages stay in sync from a single place. --------------------------- */

    var LABEL_ICONS = {
        "Dashboard":  '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
        "Leads":      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        "Campaigns":  '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
        "Sales Team": '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
        "Reports":    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
        "Settings":   '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
    };

    var CAL_ICON  = '<rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>';
    var LOGO_ICON = '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx="0.5"/><rect x="12" y="7" width="3" height="10" rx="0.5"/><rect x="17" y="13" width="3" height="4" rx="0.5"/>';

    function svgIcon(paths, size) {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (size || 20) + '" height="' + (size || 20) +
               '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
               'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
    }

    function applyIcons() {
        // Sidebar nav — match by visible label (robust even when the active
        // link has no href), replacing the leading glyph span with an SVG.
        var navLinks = document.querySelectorAll("nav a");
        Array.prototype.forEach.call(navLinks, function (link) {
            var span = link.querySelector("span");
            if (!span) return;
            var label = (link.textContent || "").replace(/[^A-Za-z ]/g, " ").replace(/\s+/g, " ").trim();
            var key = Object.keys(LABEL_ICONS).find(function (k) { return label.indexOf(k) !== -1; });
            if (key) span.innerHTML = svgIcon(LABEL_ICONS[key]);
        });

        // Brand logo mark
        var logo = document.querySelector(".logo-icon");
        if (logo) logo.innerHTML = svgIcon(LOGO_ICON, 26);

        // Header date button — drop the 📅 emoji, prepend a clean calendar icon
        var dp = document.querySelector(".date-picker");
        if (dp) {
            Array.prototype.slice.call(dp.childNodes).forEach(function (n) {
                if (n.nodeType === 3) n.textContent = n.textContent.replace(/📅/g, "");
            });
            dp.insertAdjacentHTML("afterbegin", svgIcon(CAL_ICON, 16) + " ");
        }
    }


    function buildOverlay() {
        var overlay = document.createElement("div");
        overlay.className = "settings-overlay";
        overlay.id = "settings-overlay";
        overlay.hidden = true;

        overlay.innerHTML =
            '<div class="settings-backdrop" data-close></div>' +
            '<div class="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">' +

                '<header class="settings-head">' +
                    '<div>' +
                        '<h2>Settings</h2>' +
                        '<p>Preferences for this browser</p>' +
                    '</div>' +
                    '<button class="settings-close" data-close aria-label="Close settings">&#10005;</button>' +
                '</header>' +

                '<div class="settings-body">' +

                    '<section class="settings-group">' +
                        '<h3>Profile</h3>' +
                        '<label class="settings-field">' +
                            '<span>Display name</span>' +
                            '<input type="text" id="set-name" placeholder="The Cascades" autocomplete="off">' +
                        '</label>' +
                        '<label class="settings-field">' +
                            '<span>Role</span>' +
                            '<input type="text" id="set-role" placeholder="Admin" autocomplete="off">' +
                        '</label>' +
                    '</section>' +

                    '<section class="settings-group">' +
                        '<h3>Appearance</h3>' +
                        '<label class="settings-toggle">' +
                            '<div>' +
                                '<span class="settings-toggle-title">Dark mode</span>' +
                                '<span class="settings-toggle-sub">Easier on the eyes in low light</span>' +
                            '</div>' +
                            '<input type="checkbox" id="set-theme">' +
                        '</label>' +
                        '<label class="settings-toggle">' +
                            '<div>' +
                                '<span class="settings-toggle-title">Reduce animations</span>' +
                                '<span class="settings-toggle-sub">Minimise motion across the app</span>' +
                            '</div>' +
                            '<input type="checkbox" id="set-motion">' +
                        '</label>' +
                    '</section>' +

                    '<section class="settings-group">' +
                        '<h3>Notifications</h3>' +
                        '<label class="settings-toggle">' +
                            '<div>' +
                                '<span class="settings-toggle-title">Enable notifications</span>' +
                                '<span class="settings-toggle-sub">Pop-up toasts for uploads and errors</span>' +
                            '</div>' +
                            '<input type="checkbox" id="set-notifications">' +
                        '</label>' +
                    '</section>' +

                    '<section class="settings-group">' +
                        '<h3>Data</h3>' +
                        '<div class="settings-row">' +
                            '<div>' +
                                '<strong id="set-data-count">No data loaded</strong>' +
                                '<span>Uploaded CRM records in this session</span>' +
                            '</div>' +
                            '<button class="settings-btn danger" id="set-clear">Clear data</button>' +
                        '</div>' +
                    '</section>' +

                    '<section class="settings-group">' +
                        '<h3>AI Insights</h3>' +
                        '<div class="settings-row">' +
                            '<div>' +
                                '<strong>Gemini backend</strong>' +
                                '<span>/.netlify/functions/generate-insight</span>' +
                            '</div>' +
                            '<span class="settings-pill">Live on deploy</span>' +
                        '</div>' +
                    '</section>' +

                '</div>' +

                '<footer class="settings-foot">' +
                    '<div class="settings-about">' +
                        '<span class="settings-swatch" style="background:#214268"></span>' +
                        '<span class="settings-swatch" style="background:#ebe2d6"></span>' +
                        '<span class="settings-swatch" style="background:#b38f60"></span>' +
                        '<span>The Nexus &middot; v1.0</span>' +
                    '</div>' +
                    '<button class="settings-btn logout" id="set-logout">Log out</button>' +
                '</footer>' +

            '</div>';

        document.body.appendChild(overlay);
        return overlay;
    }


    function refreshDataCount(overlay) {
        var count = 0;
        try { count = JSON.parse(sessionStorage.getItem("crmData") || "[]").length; } catch (e) {}
        var el = overlay.querySelector("#set-data-count");
        if (el) el.textContent = count > 0 ? (count + " records loaded") : "No data loaded";
    }


    var keyHandler = null;

    function openOverlay(overlay) {
        refreshDataCount(overlay);
        overlay.querySelector("#set-name").value          = localStorage.getItem(LS.name) || "";
        overlay.querySelector("#set-role").value          = localStorage.getItem(LS.role) || "";
        overlay.querySelector("#set-theme").checked        = localStorage.getItem(LS.theme) === "dark";
        overlay.querySelector("#set-motion").checked       = localStorage.getItem(LS.motion) === "1";
        overlay.querySelector("#set-notifications").checked = localStorage.getItem(LS.notifications) !== "0"; // default on
        overlay.hidden = false;
        document.addEventListener("keydown", keyHandler);
    }

    function closeOverlay(overlay) {
        overlay.hidden = true;
        document.removeEventListener("keydown", keyHandler);
    }


    document.addEventListener("DOMContentLoaded", function () {

        applyProfileToSidebar();
        applyIcons();

        var overlay = buildOverlay();

        keyHandler = function (e) {
            if (e.key === "Escape") closeOverlay(overlay);
        };

        // Take over the sidebar "Settings" link (was pointing at settings.html).
        var links = document.querySelectorAll('a[href="settings.html"]');
        links.forEach(function (link) {
            link.addEventListener("click", function (e) {
                e.preventDefault();
                openOverlay(overlay);
            });
        });

        // Close on backdrop / X / Escape.
        overlay.querySelectorAll("[data-close]").forEach(function (el) {
            el.addEventListener("click", function () { closeOverlay(overlay); });
        });

        // Profile — live save + reflect in the sidebar immediately.
        var nameInput = overlay.querySelector("#set-name");
        var roleInput = overlay.querySelector("#set-role");

        nameInput.addEventListener("input", function () {
            localStorage.setItem(LS.name, nameInput.value);
            applyProfileToSidebar();
        });
        roleInput.addEventListener("input", function () {
            localStorage.setItem(LS.role, roleInput.value);
            applyProfileToSidebar();
        });

        // Dark mode.
        var themeToggle = overlay.querySelector("#set-theme");
        themeToggle.addEventListener("change", function () {
            localStorage.setItem(LS.theme, themeToggle.checked ? "dark" : "light");
            applyTheme();
        });

        // Reduce animations.
        var motion = overlay.querySelector("#set-motion");
        motion.addEventListener("change", function () {
            localStorage.setItem(LS.motion, motion.checked ? "1" : "0");
            applyMotion();
        });

        // Notifications on/off.
        var notif = overlay.querySelector("#set-notifications");
        notif.addEventListener("change", function () {
            localStorage.setItem(LS.notifications, notif.checked ? "1" : "0");
        });

        // Clear uploaded data (this session).
        overlay.querySelector("#set-clear").addEventListener("click", function () {
            sessionStorage.removeItem("crmData");
            sessionStorage.removeItem("reportAnalytics");
            refreshDataCount(overlay);
            notify("Data cleared", "Uploaded records were removed. Re-upload from the Dashboard.");
        });

        // Log out — drop session data and return to the login page.
        overlay.querySelector("#set-logout").addEventListener("click", function () {
            sessionStorage.clear();
            window.location.href = "index.html";
        });
    });

})();
