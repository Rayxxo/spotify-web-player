import { trackbar } from "./bartracker.js";

const token = localStorage.getItem('access_token');
const songs = JSON.parse(localStorage.getItem('songs'));

let deviceId;
let albumstarted = false;
let progressTimer = null;
let lastState = null;
let isDragging = false;
let isPlaying = false;
let lastSongName = null;
let isVolumeDragging = false;
let isShuffleOn = false;
let lastVolume = 0.5;
let lastVolumeSetTime = 0;


// Creates the Spotify Connect Player in your main Spotify App
window.onSpotifyWebPlaybackSDKReady = () => {
   const player = new Spotify.Player({
        name: 'Crom Player blehhh',
        getOAuthToken: cb => { cb(token); }
   });

   // Waits for Spotify to transfer playback to the browser
    player.addListener('ready', async ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    deviceId = device_id;

    await transferPlayback(device_id);
    setTimeout(() => {
        setVolume(0.5);
    }, 700);
    });

    /*
    player.getCurrentState().then(state => {
        if (!state) return;

        console.log("You are currently playing a song");
        const current_track = state.track_window.current_track;
        const songName = current_track.name;
        document.getElementById("song-name").textContent = songName;
    });

    */

    // This event fires whenever the playback state changes:
   // play, pause, next, previous, seek, or new track
    player.addListener('player_state_changed', (state) => {

        lastState = state;
        const current_track = state.track_window.current_track;
        const songName = current_track.name;
        const currentURI = state.track_window.current_track.uri;

        document.querySelectorAll(".playlist-item").forEach(item => {
            item.classList.toggle("playing", item.dataset.uri === currentURI);
        });
        console.log("Song Name", songName);
        
        if (songName !== lastSongName) {
            lastSongName = songName;

            const songTitle = document.getElementById("song-name");
            songTitle.classList.add("song-hide");

            setTimeout(() => {
                songTitle.textContent = songName;

                songTitle.classList.remove("song-hide");
            }, 150);
        }
        
        

        const icon = document.getElementById("playPauseIcon");
        // If the user paused it would pause the ProgressTimer (go to function for explanation)
        if (state.paused) {
            clearInterval(progressTimer);
            progressTimer = null;
            icon.classList.remove("fa-pause");
            icon.classList.add("fa-play");

        } else {
            startProgessing();
            icon.classList.remove("fa-play");
            icon.classList.add("fa-pause");
        }

    });


    player.connect();

    }


// This function plays an array of URIs on the current device.
// It accepts an optional offset parameter to start playback from a specific track in the array. (basically it starts at the first song)
export async function playUris(uris, offset = 0) {
  if (!deviceId || !uris?.length) return;

  await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uris,
        offset: { position: offset }
      })
    }
  );
}

export function playTrack(trackUri) {
    return playUris([trackUri]);
}

async function seekTo(positionMs) {
    await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${Math.floor(positionMs)}`, {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + token
        }
    });
} 

async function setVolume(volumePercent) {
    await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.floor(volumePercent * 100)}`, {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    lastVolumeSetTime = Date.now(); 
}


// Progress Bar Dragging Logic
const progressBar = document.querySelector(".progress-bar-container");

const knob = document.querySelector(".progress-bar-knob");
knob.draggable = false;

knob.addEventListener("mousedown", () => {

    isDragging = true;
    clearInterval(progressTimer);
    console.log("You clicked down on the bar");

    progressBar.classList.add("dragging");
});

progressBar.addEventListener("mousedown", (e) => {
    if (!lastState) return;

    // Calculate the clicked position as a percentage of the progress bar width
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const seekMs = percent * lastState.duration;

    // Update the UI immediately
    document.querySelector(".progress-bar-fill").style.width = `${percent * 100}%`;
    document.querySelector(".progress-bar-knob").style.left = `${percent * 100}%`;
    document.getElementById("currentTime").textContent = formatTime(seekMs);

    lastState.position = seekMs;

    isDragging = true;
    clearInterval(progressTimer);

    progressBar.classList.add("dragging");
});



document.addEventListener("mousemove", (e) => {
    if(!isDragging || !lastState) return;
    console.log("You are dragging it around");
    
    // Calculate the moved position as a percentage of the progress bar width
    const rect = progressBar.getBoundingClientRect();
    let moveX = e.clientX - rect.left
    moveX = Math.max(0, Math.min(rect.width, moveX));

    console.log(moveX);
    const percent = moveX / rect.width;
    const seekMs = percent * lastState.duration;

    document.querySelector('.progress-bar-fill').style.width = `${percent * 100}%`;
    document.querySelector('.progress-bar-knob').style.left = `${percent * 100}%`;
    document.getElementById("currentTime").textContent = formatTime(seekMs);

    lastState.position = seekMs;

    progressBar.classList.add("dragging");
});

document.addEventListener("mouseup", () => {
    if (!isDragging || !lastState) return;

    console.log("Mouse Up should update UI");

    isDragging = false;
    seekTo(lastState.position);

    const percent = (lastState.position / lastState.duration) * 100;

    document.querySelector('.progress-bar-fill').style.width = `${percent}%`;
    document.querySelector('.progress-bar-knob').style.left = `${percent}%`;
    document.getElementById("currentTime").textContent = formatTime(lastState.position);

    clearInterval(progressTimer);
    progressTimer = null;

    progressBar.classList.remove("dragging");
});

const volumeBar = document.querySelector(".volume-bar-container");

volumeBar.addEventListener("mousedown", (e) => {
    isVolumeDragging = true;
    volumeBar.classList.add("dragging");

    // Same calculation as before
    const rect = volumeBar.getBoundingClientRect();
    let clickX = e.clientX - rect.left;
    clickX = Math.max(0, Math.min(rect.width, clickX));
    const percent = clickX / rect.width;

    document.querySelector(".volume-bar-fill").style.width = `${percent * 100}%`;
    document.querySelector(".volume-bar-knob").style.left = `${percent * 100}%`;

    setVolume(percent);
});

document.addEventListener("mousemove", (e) => {
    if (!isVolumeDragging) return;

    const rect = volumeBar.getBoundingClientRect();
    let moveX = e.clientX - rect.left;
    moveX = Math.max(0, Math.min(rect.width, moveX));
    const percent = moveX / rect.width;

    document.querySelector(".volume-bar-fill").style.width = `${percent * 100}%`;
    document.querySelector(".volume-bar-knob").style.left = `${percent * 100}%`;

});

document.addEventListener("mouseup", () => {
    if (!isVolumeDragging) return;

    isVolumeDragging = false;
    volumeBar.classList.remove("dragging");
    setVolume(parseFloat(document.querySelector(".volume-bar-fill").style.width) / 100);
});



// This function formats milliseconds into a MM:SS format for display on the UI.

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}    

// This function updates the UI of the progress bar over time using setInterval().
// It runs every 300ms and simulates the song moving forward by increasing
// lastState.position. If lastState is empty (which is the JSON object Spotify
// sends through the SDK), the function simply returns and does nothing.
// It takes the current song position and total duration from lastState,
// converts that into a percentage, and then updates the progress bar fill,
// knob position, and the displayed time on the UI.
function startProgessing() {
    if(progressTimer) return;

    progressTimer = setInterval(() => {
        if (!lastState) return;

        const progress = lastState.position += 5;
        lastState.position = progress;
        const duration = lastState.duration;

        const percent = (progress / duration) * 100;

        document.getElementById("currentTime").textContent = formatTime(progress);
        document.getElementById("durationTime").textContent = formatTime(duration);
        document.querySelector('.progress-bar-fill').style.width = `${percent}%`;
        document.querySelector('.progress-bar-knob').style.left = `${percent}%`;
    }, 5);
}

// This function transfers playback to the web player device created earlier.
async function transferPlayback(deviceId) {
    const response = await fetch("https://api.spotify.com/v1/me/player", 
    {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            device_ids: [deviceId],
            play: false
        })
    });

    console.log("Transfer Status:", response.status);
}

// Will poll the current volume every second and update the volume bar UI accordingly,
// this helps if another device is changing the volume.
setInterval(async () => {
  if(isVolumeDragging || Date.now() - lastVolumeSetTime < 1000) return;

  const res = await fetch("https://api.spotify.com/v1/me/player", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();

  if (data?.device?.volume_percent !== undefined) {
    const percent = data.device.volume_percent / 100;

    volumeBar.querySelector(".volume-bar-fill").style.width = `${data.device.volume_percent}%`;
    volumeBar.querySelector(".volume-bar-knob").style.left = `${data.device.volume_percent}%`;  
    lastVolume = percent;
  }
}, 1000); // every 1 seconds

// Playback Control Functions
async function pause() {
    const response = await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, 
    {
        method: "PUT",
        headers: {
            "Authorization" : "Bearer " + token
        }
    }

    );

    console.log("Pause Status: " + response.status);
}
async function prev() {
    const response = await fetch(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, 
    {
        method: "POST",
        headers: {
            "Authorization" : "Bearer " + token
        }
    }

    );

    console.log("Prev Status: " + response.status);
}

async function next() {
    const response = await fetch(`https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`, 
    {
        method: "POST",
        headers: {
            "Authorization" : "Bearer " + token
        }
    }

    );

    console.log("Next Status: " + response.status);
}

/*
let progressTimer = null;
function startProgessing(){
    console.log("Progressing each second");
    if(!progressTimer) {
        progressTimer = setInterval(() => trackbar(token), 100);
    }
}

function pauseProgessing(){
    console.log("Stop progression");
    clearInterval(progressTimer);
    progressTimer = null;
}

*/

const shuffleBtn = document.getElementById("shuffleIcon");

shuffleBtn.onclick = async () => {
  isShuffleOn = !isShuffleOn;

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/shuffle?state=${isShuffleOn}&device_id=${deviceId}`,
    {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (isShuffleOn) {
        shuffleBtn.classList.add("active");
    } else {
        shuffleBtn.classList.remove("active");
    }

  console.log("Shuffle Status:", response.status);
};


document.getElementById("playpause").onclick = async () => {
  if (!lastState) return;

  if (lastState.paused) {
    await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: { "Authorization": "Bearer " + token }
    });
  } else {
    await pause();
  }

};

document.getElementById("next").onclick = () => {
    next();
} 
document.getElementById("prev").onclick = () => {
    prev();
}