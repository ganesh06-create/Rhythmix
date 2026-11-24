
// ================= AUDIO SETUP =================

const audio = new Audio();

audio.src = "/songs/bairan.m4a";
audio.volume = 0.7;


// ================= ELEMENTS =================

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


// Actual audio state ke according icon update hoga

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


// ================= SPACE KEY =================

document.addEventListener("keydown", (event) => {

    if (event.code === "Space") {

        const active = document.activeElement;

        if (
            active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.isContentEditable
        ) {
            return;
        }

        event.preventDefault();

        updatePlayBtn();

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


// ================= UPDATE PROGRESS LINE =================

audio.addEventListener("timeupdate", () => {

    const currentTime = audio.currentTime;
    const duration = audio.duration;

    playedTime.textContent = formatTime(currentTime);

    if (Number.isFinite(duration) && duration > 0) {

        const progress = (currentTime / duration) * 100;

        timeLineInner.style.width = `${progress}%`;

    }

});


// ================= SEEK SONG =================

timeLineOuter.addEventListener("click", (event) => {

    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
    }

    const rect = timeLineOuter.getBoundingClientRect();

    const clickPosition = event.clientX - rect.left;

    const percentage = Math.max(
        0,
        Math.min(1, clickPosition / rect.width)
    );

    audio.currentTime = percentage * audio.duration;

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


// ================= KEYBOARD SEEK CONTROL =================

document.addEventListener("keydown", (event) => {

    const active = document.activeElement;

    if (
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.isContentEditable
    ) {
        return;
    }

    if (event.code === "ArrowLeft") {
        event.preventDefault();

        audio.currentTime = Math.max(0, audio.currentTime - 5);
    }

    if (event.code === "ArrowRight") {
        event.preventDefault();

        if (Number.isFinite(audio.duration)) {
            audio.currentTime = Math.min(
                audio.duration,
                audio.currentTime + 5
            );
        }
    }

});



// ================= KEYBOARD VOLUME CONTROL =================

document.addEventListener("keydown", (event) => {

    if (event.code === "ArrowUp" || event.code === "ArrowDown") {

        const active = document.activeElement;

        // Input ya text field mein typing karte waqt volume change nahi hoga
        if (
            active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.isContentEditable
        ) {
            return;
        }

        event.preventDefault();

        const step = 5;

        if (event.code === "ArrowUp") {
            audio.volume = Math.min(1, audio.volume + step / 100);
        }

        if (event.code === "ArrowDown") {
            audio.volume = Math.max(0, audio.volume - step / 100);
        }

        audio.muted = false;

        volumeSlider.value = audio.volume * 100;

        if (audio.volume > 0) {
            previousVolume = audio.volume * 100;
        }

        updateVolumeIcon();
    }

});


// ================= PROGRESS BAR =================

let isDragging = false;

function updateProgress() {

    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
    }

    const progress = (audio.currentTime / audio.duration) * 100;

    timeLineInner.style.width = `${progress}%`;

    playedTime.textContent = formatTime(audio.currentTime);
}


// Audio play hone par progress update
audio.addEventListener("timeupdate", updateProgress);


// Mouse se progress change
function seekSong(event) {

    const rect = timeLineOuter.getBoundingClientRect();

    let position = (event.clientX - rect.left) / rect.width;

    position = Math.max(0, Math.min(1, position));

    if (Number.isFinite(audio.duration)) {
        audio.currentTime = position * audio.duration;
        updateProgress();
    }

}


// Mouse click
timeLineOuter.addEventListener("click", (event) => {
    seekSong(event);
});


// Drag start
timeLineOuter.addEventListener("pointerdown", (event) => {

    isDragging = true;

    timeLineOuter.setPointerCapture(event.pointerId);

    seekSong(event);

});


// Drag movement
timeLineOuter.addEventListener("pointermove", (event) => {

    if (isDragging) {
        seekSong(event);
    }

});


// Drag end
timeLineOuter.addEventListener("pointerup", () => {
    isDragging = false;
});

timeLineOuter.addEventListener("pointercancel", () => {
    isDragging = false;
});