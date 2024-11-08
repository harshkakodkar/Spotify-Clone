let currentSong = new Audio();
let songs;
let currFolder;
let currentSongIndex = 0;

// Format time in MM:SS
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

// Get songs from a specified folder
async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`http://127.0.0.1:5500/${folder}/`);
        let text = await response.text();
        console.log(text);

        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        let songList = [];

        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songList.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
            }
        }

        // Show all the songs in the playlist
        let songUL = document.querySelector(".songLists").getElementsByTagName("ul")[0];
        songUL.innerHTML = "";
        for (const song of songList) {
            let decodedSong = decodeURIComponent(song.replaceAll("%20", " "));
            songUL.innerHTML += `<li>
                                <img src="music.svg" alt="">
                                <div class="info">
                                    <div>${decodedSong}</div>
                                    <div>Harsh</div>
                                </div>
                                <div class="playnow">
                                    <span>Play now</span>
                                    <img src="play.svg" class="invert" alt="">
                                </div>
                            </li>`;
        }

        // Attach an event listener to each song
        Array.from(document.querySelector(".songLists").getElementsByTagName("li")).forEach((e, index) => {
            e.addEventListener("click", () => {
                currentSongIndex = index;
                playMusic(songList[currentSongIndex]);
                console.log(songList[currentSongIndex]);
            });
        });

        return songList;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

// Play music and update UI
const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "pause.svg";
    } else {
        play.src = "play.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

// Display album cards
async function displayAlbums() {
    try {
        let response = await fetch('http://127.0.0.1:5500/songs/');
        let text = await response.text();
        console.log(text);

        let div = document.createElement('div');
        div.innerHTML = text;
        let anchors = div.getElementsByTagName('a');
        let cardContainer = document.querySelector('.cardContainer');
        cardContainer.innerHTML = '';

        // Process each folder
        for (let e of anchors) {
            let href = e.getAttribute('href');
            if (href.endsWith('/')) {  // Check if it's a folder
                let folder = href.split('/').filter(Boolean).pop(); // Extract folder name
                console.log(`Found folder: ${folder}`);
                
                let jsonResponse = {
                    title: "Unknown Album",
                    description: "No description available.",
                    image: "https://i.scdn.co/image/ab67616d00001e029bb2d30b01ac2cada8a8ad03"  // Provide a default image path
                };
                
                try {
                    // Fetch the info.json file inside the folder
                    let infoResponse = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                    if (infoResponse.ok) {
                        jsonResponse = await infoResponse.json();
                    } else {
                        console.warn(`info.json not found for folder ${folder}`);
                    }
                } catch (jsonError) {
                    console.error(`Error fetching info.json for folder ${folder}:`, jsonError);
                }

                cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg class="play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.5 11.1998V12.8002C9.5 14.3195 9.5 15.0791 9.95576 15.3862C10.4115 15.6932 11.0348 15.3535 12.2815 14.6741L13.7497 13.8738C15.2499 13.0562 16 12.6474 16 12C16 11.3526 15.2499 10.9438 13.7497 10.1262L12.2815 9.32594C11.0348 8.6465 10.4115 8.30678 9.95576 8.61382C9.5 8.92086 9.5 9.6805 9.5 11.1998Z" />
                        </svg>
                    </div>
                    <img src="${jsonResponse.image}" alt="${jsonResponse.title}">
                    <h2>${jsonResponse.title}</h2>
                    <p>${jsonResponse.description}</p>
                </div>`;
            }
        }

        // Load the playlist whenever the card is clicked
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async () => {
                let folder = e.dataset.folder;
                console.log(`Loading songs from folder: ${folder}`);
                songs = await getSongs(`songs/${folder}`);
                playMusic(songs[0], true);
            });
        });

    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

async function main() {
    // Get the list of all the songs
    songs = await getSongs("songs/ncs");
    playMusic(songs[0], true);

    // Display all the albums on the page
    await displayAlbums();

    // Attach an event listener to play button
    document.querySelector("#play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        let currentTimeFormatted = formatTime(currentSong.currentTime);
        let durationFormatted = formatTime(currentSong.duration);
        document.querySelector(".songtime").innerHTML = `${currentTimeFormatted} / ${durationFormatted}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration) * percent / 100;
    });

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Add an event listener to previous button
    document.querySelector("#previous").addEventListener("click", () => {
        if (currentSongIndex > 0) {
            currentSongIndex--;
            playMusic(songs[currentSongIndex]);
        }
    });

    // Add an event listener to next button
    document.querySelector("#next").addEventListener("click", () => {
        if (currentSongIndex < songs.length - 1) {
            currentSongIndex++;
            playMusic(songs[currentSongIndex]);
        }
    });

    // Add an event to volume
    document.querySelector(".range input").addEventListener("input", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    // Add event listener to mute/unmute the track
    document.querySelector(".volume img").addEventListener("click", e => {
        let volumeImg = e.target;
        if (volumeImg.src.includes("volume.svg")) {
            volumeImg.src = volumeImg.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            volumeImg.src = volumeImg.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
