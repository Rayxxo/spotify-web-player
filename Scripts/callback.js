const params = new URLSearchParams(window.location.search);
const code = params.get("code");

console.log("Authorization code:", code);

async function getToken() {
    const verifier = localStorage.getItem('code_verifier');
    const url = "https://accounts.spotify.com/api/token";
    const clientId = "5c764b60587f471587571d2a2d353a06"; 
    const redirectUri = "http://127.0.0.1:5500/callback.html";

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            code_verifier: verifier,
        })
    }

    const body = await fetch(url, payload);
    const response = await body.json();

    console.log("TOKEN RESPONSE:", response);

    localStorage.setItem('access_token', response.access_token);
}

async function getUserProfile() {
    const token = localStorage.getItem('access_token');

    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            Authorization : 'Bearer ' + token
        }
    });

    const data = await response.json();
    console.log("User Profile:", data);
}

async function getAlbum() {
    const token = localStorage.getItem('access_token');

    const response = await fetch('https://api.spotify.com/v1/albums/2jX6yKrWw9bY7JAYHhhtqZ?si=clpOBKiLTJO4t1aY90bRNA', {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }
    );

    const data = await response.json();
    const songsURI = [];

    for (let i = 0; i < data.tracks.items.length; i++) {
        songsURI.push(data.tracks.items[i].uri);
    }

    localStorage.setItem('songs', JSON.stringify(songsURI));

    console.log("Album:", data);
    console.log("Songs IDs:", songsURI);
}



function musicplayer(token) {
    const player = new Spotify.Player({
        name: 'Crom Spotify',
        getOAuthToken: cb => cb(token),
        volume: 0.5
    });

    player.addListener('ready', ({ device_id }) => {
        console.log('Device ready:', device_id);
        localStorage.setItem('device_id', device_id);
    });

    return player;
}

function redirect() {
    window.location.href = 'player.html';
}


async function initApp() {
    await getToken();
    await getUserProfile();
    await getAlbum();

    window.setTimeout(redirect, 10000);
   
}

initApp();






