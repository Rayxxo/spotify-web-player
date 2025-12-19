import { playTrack, playUris } from "./player.js";

let isPlaylistVisible = false;

const musicIcon = document.querySelector(".music-icon");
const playlistPanel = document.getElementById("playlistPanel");
const player = document.getElementById("playerWrapper");

const base_player_width = 1000; 
const min_player_width = 180; // Minimum width of the player
const DEFAULT_PANEL_WIDTH = 300;
const DEFAULT_PLAYER_WIDTH = 1000;

musicIcon.addEventListener("click", () => {
    if (isPlaylistVisible) {
        isPlaylistVisible = false;
        playlistPanel.classList.remove("active");

        player.style.width = `${DEFAULT_PLAYER_WIDTH}px`;
        playlistPanel.style.width = `${DEFAULT_PANEL_WIDTH}px`;
        player.style.left = "50%";
        player.style.transform = "translateX(-50%) translateY(-50%)";
        return;
    }
    isPlaylistVisible = true;
    playlistPanel.classList.add("active");
});

// RESIZABLE PLAYLIST PANEL

const panel = document.getElementById('playlistPanel');
const handle = document.getElementById('resizeHandle');
let isResizing = false;

handle.addEventListener('mousedown', function(e) {
    isResizing = true;
    document.body.style.cursor = 'ew-resize';
});

// Listen for mousemove on the entire document
document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const screenWidth = window.innerWidth;

    // 1) Resize panel width 
    const panelWidth = screenWidth - e.clientX;
    const minPanel = 200;
    const maxPanel = screenWidth - 800;

    const finalPanelWidth = Math.max(minPanel, Math.min(maxPanel, panelWidth));
    panel.style.width = `${finalPanelWidth}px`;

    // 2) Resize player width. The padding ensures some space between panel and player
    // the availableSpace calculation ensures the player doesn't exceed screen width

    const padding = 40;
    const availableSpace = screenWidth - finalPanelWidth - padding;

    const playerMin = 180;
    const playerMax = 1000;

    const finalPlayerWidth = Math.max(playerMin, Math.min(playerMax, availableSpace));
    player.style.width = `${finalPlayerWidth}px`;

    // 3) Move player left so it stays centered in remaining space
    const remainingSpace = screenWidth - finalPanelWidth;
    const newLeft = remainingSpace / 2;

    player.style.left = `${newLeft}px`;
});


document.addEventListener('mouseup', function(e) {
    isResizing = false;
    document.body.style.cursor = 'default';

});


// DYNAMICALLY ADD SONG ITEMS TO PLAYLIST

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}    

// Fetch all songs from a playlist, handling pagination
async function getPlaylistSongs() {
    const items = [];
    let response = await fetch(
        'https://api.spotify.com/v1/playlists/0V36g6eVuQN6CBXRPxRtDY/tracks?limit=100',
        {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('access_token')
            }
        }
    );

    if (!response.ok) {
        console.error("Failed to fetch playlist tracks:", response.status, response.statusText);
        return items;
    }
    
    // Handle pagination. It will keep fetching and putting the songs into an array until there are no more pages.
    let data = await response.json();
    while (data) {
        items.push(...data.items);

        if (!data.next) break;

        response = await fetch(data.next, {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('access_token')
            }
        });

        data = await response.json();
    }

    // For debugging: log all track names
    for (let i = 0; i < items.length; i++) {
        console.log(items[i].track.name);
    };

    return items;
}

export async function populatePlaylist() {
    const playlistContainer = document.getElementById('playlistItems');
    playlistContainer.innerHTML = ""; // clear existing items

    const songs = await getPlaylistSongs();
    const playUrisArray = songs.map(item => item.track.uri);

    songs.forEach((item) => {
        const listItem = document.createElement('li');
        listItem.classList.add("playlist-item");

        // Handle cases where album images might be missing using nullish coalescing (conceptually the same as ternary operator)
        // .map is used to join multiple artists' names. It's like putting them into an array and then joining with a comma.
        const imageUrl = item.track.album.images[0]?.url ?? "";
        const artists = item.track.artists.map(a => a.name).join(", ");
        
        // data-uri attribute to store the track URI for playback
        listItem.dataset.uri = item.track.uri;
        listItem.innerHTML = `
        <span class="album-art">
            <img src="${imageUrl}" alt="Album Art">
        </span>
        <span class="track-name">${item.track.name}</span>
        <span class="artist-name">${artists}</span>
        <span class="album-name">${item.track.album.name}</span>
        <span class="track-duration">${formatDuration(item.track.duration_ms)}</span>
        `;

        playlistContainer.appendChild(listItem);

        // Click event to play the selected track
        listItem.addEventListener("click", () => {
        // Remove "playing" class from all items first
        document.querySelectorAll(".playlist-item.playing").forEach(el => el.classList.remove("playing"));
        playUris(playUrisArray, songs.indexOf(item));
        listItem.classList.add("playing");
        });
    });

}

populatePlaylist();