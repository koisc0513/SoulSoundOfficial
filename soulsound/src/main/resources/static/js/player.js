/**
 * SoulSound — player.js (GLOBAL AUDIO + NO DELAY)
 */
// ── GLOBAL AUDIO (OUTSIDE DOM LIFECYCLE) ─────────────────────

if (!window.__SOULSOUND_AUDIO__) {
    const audio = document.createElement("audio");

    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.autoplay = false;

    document.body.appendChild(audio);

    window.__SOULSOUND_AUDIO__ = audio;
}

const audio = window.__SOULSOUND_AUDIO__;

const Player = (() => {

    // ── GLOBAL AUDIO (KHÔNG RESET KHI CHUYỂN TRANG) ───────────────
    window.__SOULSOUND_AUDIO__ =
        window.__SOULSOUND_AUDIO__ || document.getElementById('audio-engine');

    const audio        = window.__SOULSOUND_AUDIO__;
    const playBtn      = document.getElementById('player-play-btn');
    const progressBar  = document.querySelector('.progress-bar');
    const progressFill = document.querySelector('.progress-bar__fill');
    const timeElapsed  = document.getElementById('time-elapsed');
    const timeDuration = document.getElementById('time-duration');
    const playerThumb  = document.getElementById('player-thumb');
    const playerTitle  = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const volumeSlider = document.getElementById('volume-slider');
    const playerBar    = document.querySelector('.player-bar');

    let currentTrackId = null;
    let isPlaying      = false;

    const STORAGE_KEY = "soulsound_player_state";

    // ── Persistence ──────────────────────────────────────────────

    function saveState() {
        if (!audio.src) return;

        const state = {
            trackId: currentTrackId,
            src: audio.src,
            time: audio.currentTime,
            playing: isPlaying,
            title: playerTitle?.textContent,
            artist: playerArtist?.textContent,
            thumb: playerThumb?.src,
            volume: audio.volume
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        try {
            const state = JSON.parse(saved);

            currentTrackId = state.trackId;

            if (playerThumb)  playerThumb.src = state.thumb;
            if (playerTitle)  playerTitle.textContent = state.title;
            if (playerArtist) playerArtist.textContent = state.artist;
            if (playerBar)    playerBar.style.display = "flex";

            audio.src = state.src;
            audio.volume = state.volume ?? 0.8;

            audio.addEventListener("loadedmetadata", () => {
                audio.currentTime = state.time || 0;

                if (state.playing) {
                    audio.play().catch(()=>{});
                }
            }, { once: true });

        } catch(e) {
            console.warn("Load player state error", e);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────

    function formatTime(sec) {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function updatePlayBtnUI(playing) {
        if (!playBtn) return;
        playBtn.innerHTML = playing
            ? '<i class="bi bi-pause-fill"></i>'
            : '<i class="bi bi-play-fill"></i>';
        isPlaying = playing;
    }

    function updateTrackBtnUI(trackId, playing) {
        document.querySelectorAll(`[data-track-id="${trackId}"]`).forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;
            icon.className = playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';
        });
    }

    // ── Audio Events ─────────────────────────────────────────────

    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = pct + '%';
        if (timeElapsed) timeElapsed.textContent = formatTime(audio.currentTime);
        saveState();
    });

    audio.addEventListener('loadedmetadata', () => {
        if (timeDuration) timeDuration.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        updatePlayBtnUI(false);
        saveState();
        if (currentTrackId) updateTrackBtnUI(currentTrackId, false);
    });

    audio.addEventListener('pause', () => {
        updatePlayBtnUI(false);
        saveState();
        if (currentTrackId) updateTrackBtnUI(currentTrackId, false);
    });

    audio.addEventListener('play', () => {
        updatePlayBtnUI(true);
        saveState();
        if (currentTrackId) updateTrackBtnUI(currentTrackId, true);
    });

    // Seek

    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (!audio.duration) return;
            const rect = progressBar.getBoundingClientRect();
            audio.currentTime =
                ((e.clientX - rect.left) / rect.width) * audio.duration;
        });
    }

    // Volume

    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            audio.volume = parseFloat(volumeSlider.value);
            saveState();
        });
    }

    // ── Core Play ────────────────────────────────────────────────

    function play(track) {
        if (!track || !track.fileUrl) return;

        const isSameTrack = String(track.id) === String(currentTrackId);

        if (isSameTrack) {
            if (isPlaying) audio.pause();
            else audio.play().catch(console.warn);
            return;
        }

        if (currentTrackId) updateTrackBtnUI(currentTrackId, false);
        currentTrackId = track.id;

        if (playerThumb)
            playerThumb.src = track.thumbnailUrl || '/images/default-thumb.png';

        if (playerTitle)
            playerTitle.textContent = track.title || 'Unknown';

        if (playerArtist)
            playerArtist.textContent = track.artist || '';

        if (playerBar)
            playerBar.style.display = 'flex';

        progressFill.style.width = '0%';

        if (timeElapsed)
            timeElapsed.textContent = '0:00';

        if (timeDuration)
            timeDuration.textContent = '0:00';

        audio.src = track.fileUrl;

        const playPromise = audio.play();

        if (playPromise) {
            playPromise
                .then(() => updateTrackBtnUI(track.id, true))
                .catch(() => updatePlayBtnUI(false));
        }

        saveState();

        setTimeout(() => {
            fetch(`/tracks/${track.id}/play`, {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            }).catch(() => {});
        }, 500);
    }

    function togglePlay() {
        if (!audio.src) return;
        if (isPlaying) audio.pause();
        else audio.play().catch(console.warn);
    }

    // ── Click Track ──────────────────────────────────────────────

    document.addEventListener('mousedown', (e) => {
        const btn = e.target.closest('[data-track-id][data-file-url]');
        if (!btn) return;

        e.preventDefault();

        const icon = btn.querySelector('i');

        if (icon &&
            String(btn.dataset.trackId) !== String(currentTrackId)) {
            icon.className = 'bi bi-arrow-repeat spin';
        }

        play({
            id: btn.dataset.trackId,
            fileUrl: btn.dataset.fileUrl,
            title: btn.dataset.title,
            artist: btn.dataset.artist,
            thumbnailUrl: btn.dataset.thumbnail,
        });
    });

    // Player button

    if (playBtn) {
        playBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            togglePlay();
        });
    }

    document.addEventListener("DOMContentLoaded", loadState);

    return { play, togglePlay };

})();


// Spinner CSS

const spinStyle = document.createElement('style');

spinStyle.textContent = `
.spin { animation: spin 0.6s linear infinite; display:inline-block; }
@keyframes spin {
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
}
`;

document.head.appendChild(spinStyle);

