const sidebar = document.querySelector(".sidebar");
const sidebarButton = document.getElementById("sidebar-viwer-lines");
const backButton = document.getElementById("backbtn");

const menuItems = document.querySelectorAll(".menu-item");
const container = document.querySelector(".container");

const allowedPages = ["home", "library", "profile", "settings"];

const audio = new Audio();
audio.src = "";
audio.volume = 0.7;


// ------------------------------
// HELPERS
// ------------------------------

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function isTypingTarget(element) {
    return (
        element &&
        (element.tagName === "INPUT" ||
            element.tagName === "TEXTAREA" ||
            element.isContentEditable)
    );
}


// ------------------------------
// SIDEBAR
// ------------------------------

function openSidebar() {
    if (sidebar.classList.contains("active")) return;

    sidebar.classList.add("active");

    // Sidebar band karne ke liye history entry
    history.pushState(
        { ...history.state, sidebar: true },
        "",
        window.location.href
    );
}

function closeSidebar() {
    sidebar.classList.remove("active");
}

// Browser back / history.back() par sidebar band karo
window.addEventListener("popstate", () => {
    closeSidebar();
});

sidebarButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openSidebar();
});

backButton.addEventListener("click", () => {
    if (sidebar.classList.contains("active")) {
        history.back();
    }
});

document.addEventListener("click", (event) => {
    if (!sidebar.classList.contains("active")) return;

    const clickedInsideSidebar = sidebar.contains(event.target);
    const clickedSidebarButton = sidebarButton.contains(event.target);

    if (!clickedInsideSidebar && !clickedSidebarButton) {
        history.back();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar.classList.contains("active")) {
        history.back();
    }
});


// ------------------------------
// SEARCH BAR
// ------------------------------

const searchInput = document.getElementById("songSearch");
const searchBar = document.querySelector(".searchbar");
const searchResult = document.querySelector(".search-result");

// Latest search results yahan store honge
let currentSongs = [];

if (searchInput && searchBar) {
    searchInput.addEventListener("focus", () => {
        searchBar.classList.add("searchbar-focus");
    });

    searchInput.addEventListener("blur", () => {
        searchBar.classList.remove("searchbar-focus");
    });
}

// Set playbar

const SetPlayerBar = async (song) => {
    if (!song || !song.audio) return;

    audio.src = song.audio;


    try {
        await audio.play();
        document.getElementById("current-song-title").textContent = escapeHTML(song.title);

        document.getElementById("current-song-artist").textContent = escapeHTML(
            Array.isArray(song.artists)
                ? song.artists.join(", ")
                : song.artists
        );

        document.getElementById("current-song-image").src = escapeHTML(song.coverImage)

    } catch (error) {
        console.log("song not play:", error);
    }
};

let searchTimer = null;
let searchController = null;

async function runSearch(message) {

    if (searchController) {
        searchController.abort();
    }

    searchController = new AbortController();

    try {
        const response = await fetch("/api/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message }),
            signal: searchController.signal
        });

        const data = await response.json();

        if (!data.success) {
            currentSongs = [];
            searchResult.innerHTML = "";
            return;
        }

        currentSongs = data.songs;

        searchResult.innerHTML = currentSongs.map(song => `
            <div class="search-result-song-card" data-song-id="${escapeHTML(song.id)}">

                <div class="song-cover">
                    <img class="song-cover-img"
                        src="${escapeHTML(song.coverImage)}">
                </div>

                <div class="song-details">
                    <h2>${escapeHTML(song.title)}</h2>
                    <p>${escapeHTML(
            Array.isArray(song.artists)
                ? song.artists.join(", ")
                : song.artists
        )}</p>
                </div>

            </div>
        `).join("");

    } catch (error) {
        if (error.name !== "AbortError") {
            console.error(error);
        }
    }
}

if (searchInput) {
    searchInput.addEventListener("input", () => {

        const message = searchInput.value.trim();

        clearTimeout(searchTimer);

        if (!message) {
            if (searchController) searchController.abort();
            currentSongs = [];
            searchResult.innerHTML = "";
            return;
        }

        // 300ms debounce: har key par request nahi jayegi
        searchTimer = setTimeout(() => runSearch(message), 300);
    });
}

// Click listener sirf EK baar (event delegation)
searchResult.addEventListener("click", (event) => {

    const card = event.target.closest(".search-result-song-card");

    if (!card) return;

    const songId = card.dataset.songId;

    const song = currentSongs.find(item => String(item.id) === songId);

    if (song) {
        SetPlayerBar(song);
    }
});


//===============================================player bar===================================================

const playBtn = document.getElementById("play");

const playedTime = document.getElementById("played-time");
const totalTime = document.getElementById("total-time");

const timeLineOuter = document.getElementById("time-line-outer");
const timeLineInner = document.getElementById("time-line-inner");

const volumeSlider = document.getElementById("volume-slider");
const muteBtn = document.getElementById("mute-btn");
const volumeIcon = muteBtn.querySelector("img");


// ================= PLAY / PAUSE =================

async function updatePlayBtn() {

    // Koi song loaded nahi hai to kuch mat karo
    if (!audio.src) return;

    try {
        if (audio.paused) {
            await audio.play();
        } else {
            audio.pause();
        }
    } catch (error) {
        console.log("song not play:", error);
    }
}

// Actual audio state ke according icon update
audio.addEventListener("play", () => {
    playBtn.classList.add("plying");
    playBtn.classList.remove("pause");

    playBtn.innerHTML = `
        <img src="assets/pausBtn.svg" alt="Pause">
    `;
});

audio.addEventListener("pause", () => {
    playBtn.classList.remove("plying");
    playBtn.classList.add("pause");

    playBtn.innerHTML = `
        <img src="assets/playBtn.svg" alt="Play">
    `;
});

playBtn.addEventListener("click", updatePlayBtn);


// ================= KEYBOARD CONTROLS (SPACE / SEEK / VOLUME) =================

document.addEventListener("keydown", (event) => {

    if (isTypingTarget(document.activeElement)) return;

    switch (event.code) {

        case "Space":
            event.preventDefault();
            updatePlayBtn();
            break;

        case "ArrowLeft":
            event.preventDefault();
            audio.currentTime = Math.max(0, audio.currentTime - 5);
            break;

        case "ArrowRight":
            event.preventDefault();
            if (Number.isFinite(audio.duration)) {
                audio.currentTime = Math.min(
                    audio.duration,
                    audio.currentTime + 5
                );
            }
            break;

        case "ArrowUp":
        case "ArrowDown": {
            event.preventDefault();

            const step = 5;

            if (event.code === "ArrowUp") {
                audio.volume = Math.min(1, audio.volume + step / 100);
            } else {
                audio.volume = Math.max(0, audio.volume - step / 100);
            }

            audio.muted = false;

            volumeSlider.value = Math.round(audio.volume * 100);

            if (audio.volume > 0) {
                previousVolume = audio.volume * 100;
            }

            updateVolumeIcon();
            break;
        }
    }
});


// ================= TIME FORMAT =================

function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}


// ================= TOTAL DURATION =================

audio.addEventListener("loadedmetadata", () => {
    totalTime.textContent = formatTime(audio.duration);
});


// ================= PROGRESS LINE =================

function updateProgress() {

    if (isDragging) return; // drag ke dauran seekSong khud update karta hai

    playedTime.textContent = formatTime(audio.currentTime);

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
        const progress = (audio.currentTime / audio.duration) * 100;
        timeLineInner.style.width = `${progress}%`;
    }
}

audio.addEventListener("timeupdate", updateProgress);


// ================= SEEK (CLICK + DRAG) =================

let isDragging = false;

function seekSong(event) {

    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
    }

    const rect = timeLineOuter.getBoundingClientRect();

    let position = (event.clientX - rect.left) / rect.width;
    position = Math.max(0, Math.min(1, position));

    audio.currentTime = position * audio.duration;

    timeLineInner.style.width = `${position * 100}%`;
    playedTime.textContent = formatTime(audio.currentTime);
}

// pointerdown click ko bhi cover karta hai, alag "click" listener ki zaroorat nahi
timeLineOuter.addEventListener("pointerdown", (event) => {
    isDragging = true;
    timeLineOuter.setPointerCapture(event.pointerId);
    seekSong(event);
});

timeLineOuter.addEventListener("pointermove", (event) => {
    if (isDragging) {
        seekSong(event);
    }
});

timeLineOuter.addEventListener("pointerup", () => {
    isDragging = false;
});

timeLineOuter.addEventListener("pointercancel", () => {
    isDragging = false;
});


// ================= SONG ENDED =================

audio.addEventListener("ended", () => {
    timeLineInner.style.width = "0%";
    playedTime.textContent = "00:00";
});


// ================= VOLUME CONTROL =================

let previousVolume = 70;

volumeSlider.value = 70;

volumeSlider.addEventListener("input", () => {

    const volume = Number(volumeSlider.value);

    audio.volume = volume / 100;
    audio.muted = false;

    if (volume > 0) {
        previousVolume = volume;
    }

    updateVolumeIcon();
});


// ================= MUTE / UNMUTE =================

muteBtn.addEventListener("click", () => {

    if (audio.muted || audio.volume === 0) {

        audio.muted = false;

        if (audio.volume === 0) {
            audio.volume = previousVolume / 100;
            volumeSlider.value = previousVolume;
        }

    } else {
        previousVolume = audio.volume * 100;
        audio.muted = true;
    }

    updateVolumeIcon();
});


// ================= VOLUME ICON =================

function updateVolumeIcon() {

    if (audio.muted || audio.volume === 0) {
        volumeIcon.src = "assets/mute.svg";
    } else {
        volumeIcon.src = "assets/volume.svg";
    }
}

updateVolumeIcon();