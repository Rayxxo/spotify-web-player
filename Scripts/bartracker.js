
let lastprogress = 0;




export async function trackbar(token) {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', 
    {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    }
    );

    const data = await response.json();

    const progress = data.progress_ms;
    const duration = data.item.duration_ms;
    const isPlaying = data.is_playing;
    
    lastprogress = progress;
    
    
    const percent = (progress / duration) * 100;

    document.getElementById("currentTime").textContent = formatTime(progress);
    document.getElementById("durationTime").textContent = formatTime(duration);

    if (isPlaying == true) {
        console.log("It is playing, is the bar progressing?");
        document.querySelector('.progress-bar-fill').style.width = `${percent}%`;
        document.querySelector('.progress-bar-knob').style.left = `${percent}%`;


    } else {
        document.querySelector('.progress-bar-fill').style.width = document.querySelector('.progress-bar-fill').style.width;
        document.querySelector('.progress-bar-knob').style.left = document.querySelector('.progress-bar-knob').style.left

    }
}
