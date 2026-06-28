// ============================================================
// BDIX IPTV — Glassmorphism SPA Logic (Firebase Powered)
// ============================================================
import { db } from "./firebase-config.js";
import { collection, getDocs, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

(function () {
  "use strict";

  // ── State ────────────────────────────────────────────
  let activeCategory = "All";
  let searchQuery = "";
  let activeChannelId = null;
  let hls = null;

  let CHANNELS = [];
  let CATEGORIES = ["All"];

  // ── DOM refs ─────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const categoryBar = $("#category-bar");
  const channelList = $("#channel-list");
  const searchInput = $("#search-input");
  const searchClear = $("#search-clear");
  const channelCount = $("#channel-count");
  const noResults = $("#no-results");
  const videoPlayer = $("#video-player");
  const playerOverlay = $("#player-overlay");
  const playingStatus = $("#playing-status");
  const statusIndicator = $(".status-indicator");
  const qualityContainer = $("#quality-container");
  const qualityMenu = $("#quality-menu");

  // Now Playing banner refs
  const npTitle = $("#np-title");
  const npCategory = $("#np-category");
  const npLive = $("#np-live");
  const npImg = $("#np-img");
  const npPlaceholder = $("#np-placeholder");

  // ── Initialise ───────────────────────────────────────
  async function init() {
    bindEvents();

    // Set initial loading state
    channelList.innerHTML = `<div style="text-align:center; padding: 40px; color: #94a3b8;">Loading channels...</div>`;

    await fetchCategories();

    // Listen for real-time updates to channels
    const q = query(collection(db, "channels"), orderBy("id", "asc"));
    onSnapshot(q, (snapshot) => {
      CHANNELS = [];
      snapshot.forEach((doc) => {
        CHANNELS.push({ docId: doc.id, ...doc.data() });
      });

      renderChannels();

      // Auto-play from URL if provided
      if (!activeChannelId) {
        const urlParams = new URLSearchParams(window.location.search);
        const id = parseInt(urlParams.get("id"));
        if (id) playChannel(id);
      }
    });
  }

  // Fetch Categories once
  async function fetchCategories() {
    try {
      const snap = await getDocs(collection(db, "categories"));
      CATEGORIES = ["All"];
      snap.forEach(doc => {
        if (doc.data().name !== "All") {
          CATEGORIES.push(doc.data().name);
        }
      });
      renderCategoryBar();
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }

  // ── Now Playing banner ───────────────────────────────
  function updateNowPlaying(channel) {
    if (!channel) {
      npTitle.textContent = "Select a channel to start";
      npCategory.textContent = "Welcome";
      npLive.classList.add("hidden");
      npImg.classList.add("hidden");
      npImg.src = "";
      npPlaceholder.classList.remove("hidden");
      return;
    }

    npTitle.textContent = channel.name;
    npCategory.textContent = channel.category || "Live TV";
    npLive.classList.remove("hidden");

    if (channel.logo) {
      npImg.src = channel.logo;
      npImg.classList.remove("hidden");
      npPlaceholder.classList.add("hidden");
      npImg.onerror = () => {
        npImg.classList.add("hidden");
        npPlaceholder.classList.remove("hidden");
        npPlaceholder.textContent = (channel.name || "?").charAt(0).toUpperCase();
      };
    } else {
      npImg.classList.add("hidden");
      npPlaceholder.classList.remove("hidden");
      npPlaceholder.textContent = (channel.name || "?").charAt(0).toUpperCase();
    }
  }

  // ── Video Player Logic ───────────────────────────────
  window.playChannel = function(id) {
    const channel = CHANNELS.find((c) => c.id === id);
    if (!channel) return;

    activeChannelId = id;
    playerOverlay.classList.add("hidden");
    playingStatus.textContent = `Playing: ${channel.name}`;
    statusIndicator.classList.add("active");

    // Update Now Playing banner
    updateNowPlaying(channel);

    // Update active state in sidebar
    $$(".channel-card").forEach(card => {
      if (parseInt(card.dataset.id) === id) {
        card.classList.add("active");
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        card.classList.remove("active");
      }
    });

    // Play stream using HLS.js
    if (Hls.isSupported()) {
      if (hls) {
        hls.destroy();
      }
      hls = new Hls({
        capLevelToPlayerSize: true,
        maxMaxBufferLength: 30
      });
      hls.loadSource(channel.streamUrl);
      hls.attachMedia(videoPlayer);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        videoPlayer.play().catch(e => console.log("Autoplay prevented:", e));

        // Setup Quality Selector
        if (hls.levels && hls.levels.length > 1) {
          qualityContainer.classList.remove("hidden");
          qualityMenu.innerHTML = `<button class="quality-option w-full text-left px-4 py-2 text-sm hover:bg-card-hover transition-colors text-primary font-semibold" data-level="-1">Auto</button>`;

          // Reverse array to show highest quality at the top (usually they come lowest first)
          const sortedLevels = [...hls.levels].map((level, index) => ({ level, index })).reverse();

          sortedLevels.forEach(({ level, index }) => {
            const height = level.height ? level.height + 'p' : 'Unknown';
            qualityMenu.innerHTML += `<button class="quality-option w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors" data-level="${index}">${height}</button>`;
          });

          $$(".quality-option").forEach(btn => {
            btn.addEventListener("click", (e) => {
              const level = parseInt(e.target.dataset.level);
              hls.currentLevel = level;

              $$(".quality-option").forEach(b => {
                b.classList.remove("text-primary", "font-semibold");
                b.classList.add("text-slate-300");
              });
              e.target.classList.add("text-primary", "font-semibold");
              e.target.classList.remove("text-slate-300");
            });
          });
        } else {
          qualityContainer.classList.add("hidden");
        }
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              playingStatus.textContent = `Network Error: ${channel.name}`;
              statusIndicator.classList.remove("active");
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (videoPlayer.canPlayType("application/vnd.apple.mpegurl")) {
      qualityContainer.classList.add("hidden");
      // Native HLS support (Safari)
      videoPlayer.src = channel.streamUrl;
      videoPlayer.addEventListener("loadedmetadata", function () {
        videoPlayer.play().catch(e => console.log("Autoplay prevented:", e));
      });
    }
  }

  // ── Category bar ─────────────────────────────────────
  function renderCategoryBar() {
    categoryBar.innerHTML = CATEGORIES.map((cat) => {
      const active = cat === activeCategory;
      return `
        <button class="category-btn ${active ? "active" : ""} px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap" data-category="${cat}">
          ${cat}
        </button>`;
    }).join("");
  }

  // ── Channel List ─────────────────────────────────────
  function getFilteredChannels() {
    return CHANNELS.filter((ch) => {
      const matchesCat = activeCategory === "All" || ch.category === activeCategory;
      const matchesSearch = !searchQuery ||
        ch.name.toLowerCase().includes(searchQuery) ||
        ch.category.toLowerCase().includes(searchQuery);
      return matchesCat && matchesSearch;
    });
  }

  function renderChannels() {
    const filtered = getFilteredChannels();
    channelCount.textContent = `${filtered.length} channel${filtered.length === 1 ? "" : "s"}`;

    if (!filtered.length) {
      channelList.innerHTML = "";
      noResults.classList.remove("hidden");
      noResults.classList.add("flex");
      return;
    }

    noResults.classList.add("hidden");
    noResults.classList.remove("flex");

    channelList.innerHTML = filtered.map((ch, idx) => {
      const isActive = ch.id === activeChannelId;
      const firstLetter = ch.name ? ch.name.charAt(0).toUpperCase() : '?';

      return `
        <div class="channel-card ${isActive ? "active" : ""} flex items-center p-2.5 rounded-xl cursor-pointer fade-in" data-id="${ch.id}" onclick="playChannel(${ch.id})">
          <div class="channel-logo-tile w-11 h-11 rounded-lg flex items-center justify-center mr-3 shrink-0 overflow-hidden relative">
            <span class="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-300">${firstLetter}</span>
            ${ch.logo ? `<img src="${ch.logo}" alt="" class="w-full h-full object-contain relative z-10 p-1 bg-white" loading="lazy" onerror="this.style.display='none'"/>` : ''}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-[0.95rem] font-semibold whitespace-nowrap overflow-hidden text-ellipsis mb-0.5 text-white">${ch.name}</h3>
            <span class="text-[11px] text-slate-400 uppercase tracking-wider font-medium">${ch.category}</span>
          </div>
          <span class="card-index text-[0.85rem] font-bold ml-2.5 text-slate-500">${idx + 1}</span>
        </div>`;
    }).join("");
  }

  // ── Events ───────────────────────────────────────────
  function bindEvents() {
    // Category clicks
    categoryBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-btn");
      if (!btn) return;
      activeCategory = btn.dataset.category;
      renderCategoryBar();
      renderChannels();
    });

    // Search
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      searchClear.classList.toggle("visible", searchQuery.length > 0);
      renderChannels();
    });

    searchClear.addEventListener("click", () => {
      searchInput.value = "";
      searchQuery = "";
      searchClear.classList.remove("visible");
      searchInput.focus();
      renderChannels();
    });

    // Keyboard
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchClear.click();
      }
    });
  }

  // ── Boot ─────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", init);
})();
