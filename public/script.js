let csvData = [];

async function loadCSVData() {      // charge les données csv
  try {
    const response = await fetch('../db.csv');
    if (!response.ok) throw new Error('Erreur HTTP : ' + response.status);

    const csvText = await response.text();
    csvData = parseCSV(csvText);

    console.log('Données stockées:', csvData);

    displaySongs(csvData);  // Appel ici, après chargement

  } catch (error) {
    console.error('Erreur:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadCSVData();
});

document.getElementById('searchBar').addEventListener('input', (event) => {
  searchSong(event.target.value);
});

document.querySelector('.header').addEventListener('click', (event) => {
  // Si le clic n’est PAS sur un bouton (ni un enfant de bouton)
  if (!event.target.closest('button')) {
    switchView('home');
  }
});




function parseCSV(csvText) {             // converti les données du csv en tableau javasrcipt
  if (!csvText) return [];

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      if (header === 'PlayCount') {
        obj[header] = parseInt(values[i], 10) || 0;
      } else if (header === 'ReleaseDate') {
        obj[header] = new Date(values[i]);
      } else {
        obj[header] = values[i];
      }
    });
    return obj;
  });
}
                                        // affiche les chansson dans le browser
function displaySongs(data) {
  const songList = document.getElementById('songList');
  if (!songList) {
    console.error("Élément avec l'id 'songList' introuvable dans le DOM");
    return;
  }

  songList.innerHTML = '';

  if (!data || !Array.isArray(data) || data.length === 0) {
    songList.innerHTML = '<p>Aucune chanson trouvée.</p>';
    return;
  }

  data.forEach(song => { // parcour aux nombres de ligne chansons pour créer les chansons
    
    
    const songDiv = document.createElement('div');
    songDiv.classList.add('song');

    const img = document.createElement('img');  // Images
    img.src = song.Png || 'https://cdn.glitch.global/05de98a1-79c1-4327-a9f1-7d0c6536ee65/logo.png?v=1747693747727'; // image par défaut si aucune
    img.alt = song.Title || 'Artwork';
    img.classList.add('song-image');
    
    
    const buttonsDiv = document.createElement('div'); // Div pour les bouttons
    buttonsDiv.classList.add('buttons-div');
    
    const playButton = document.createElement('button'); // Bouton d'ajout pour playlist
    playButton.textContent = '🎵';
    playButton.addEventListener('click', () => {
    addToPlaylist(song.Title,song.Mp3)
  });
    
    const clipButton = document.createElement('button'); // Bouton (lien) vers clip (Youtube)
    clipButton.textContent = '🎬';
    clipButton.addEventListener('click', () => {
    window.open(`${song.Mp4}`, '_blank')
  });

    const title = document.createElement('p')
    title.textContent = `${song.Title}`;
    title.classList.add('song-title')

    buttonsDiv.appendChild(playButton); // Imbriquement
    buttonsDiv.appendChild(clipButton);

    songDiv.appendChild(img)
    songDiv.appendChild(title);
    songDiv.appendChild(buttonsDiv);

    songList.appendChild(songDiv);
  });
}

  displaySongs(csvData)


function searchSong(input) { /*recherche*/
  const searchTerm = input.trim().toLowerCase();

  if (!searchTerm) {
    displaySongs(csvData); // Si rien tapé, on réaffiche tout
    return;
  }

  const filteredSongs = csvData.filter(song => {
    const title = (song.Title || '').toLowerCase();
    return title.includes(searchTerm);
  });

  displaySongs(filteredSongs);
}

function addPlayCount(title) {
  fetch("../increment", { // <-- URL publique de ton serveur Glitch
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data.message || data.error);
    })
    .catch((error) => {
      console.error("Erreur PlayCount :", error);
    });
}




/*Main function*/


function switchView(view) {
  // On ferme tout d'abord tout
  closeBrowser();
  closePlaylist();

  // Puis on ouvre ce qu'il faut selon le bouton
  if (view === "search") {
    openBrowser();
  } else if (view === "home") {
    // rien à ouvrir, on reste sur l'accueil
  } else if (view === "playlist") {
    openPlaylist();
  }
}


function openBrowser() {
  document.getElementById("browser").style.display = "block";
}

function closeBrowser() {
  document.getElementById("browser").style.display = "none";
}

function openPlaylist() {
  document.getElementById("playlistContainer").style.display = "block";
  document.body.classList.add("noscroll");
}

function closePlaylist() {
  document.getElementById("playlistContainer").style.display = "none";
  document.body.classList.remove("noscroll");
}

/* playlist function*/


document.addEventListener("DOMContentLoaded", function () {
    loadPlaylist();
});

function addToPlaylist(songTitle, songSrc) {
    let playlistContent = document.getElementById("playlistContent");

    // Vérifier si la chanson est déjà dans la playlist
    if ([...playlistContent.children].some(song => song.getAttribute("data-src") === songSrc)) {
        return;
    }

    let songDiv = document.createElement("div");
    songDiv.classList.add("song");
    songDiv.setAttribute("draggable", "true");
    songDiv.setAttribute("data-src", songSrc);
    songDiv.innerHTML = `<p>${songTitle}</p>
                         <button onclick="removeFromPlaylist(this)">Retirer</button>`;

    addDragAndDropEvents(songDiv);

    playlistContent.appendChild(songDiv);
    savePlaylist();
}


function addDragAndDropEvents(songDiv) {
    songDiv.addEventListener('dragstart', dragStart);
    songDiv.addEventListener('dragover', dragOver);
    songDiv.addEventListener('drop', drop);
    songDiv.addEventListener('dragenter', dragEnter);
    songDiv.addEventListener('dragleave', dragLeave);
}

let dragSrcEl = null;

function dragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', null); // Nécessaire pour Firefox
    this.style.opacity = "0.5";
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function drop(e) {
    e.preventDefault();
    if (dragSrcEl !== this) {
        let playlistContent = document.getElementById("playlistContent");
        let children = [...playlistContent.children];
        let srcIndex = children.indexOf(dragSrcEl);
        let targetIndex = children.indexOf(this);

        // Réordonner les éléments dans le DOM
        if (srcIndex < targetIndex) {
            playlistContent.insertBefore(dragSrcEl, this.nextSibling);
        } else {
            playlistContent.insertBefore(dragSrcEl, this);
        }
        dragSrcEl.style.opacity = "1";
        savePlaylist();
    }
}

function dragEnter(e) {
    this.style.backgroundColor = '#444';
}

function dragLeave(e) {
    this.style.backgroundColor = '';
}

function filterSongs() {
    let input = document.querySelector(".search-bar").value.toLowerCase();
    let songs = document.querySelectorAll(".container .song");

    songs.forEach(song => {
        let title = song.querySelector("p").textContent.toLowerCase();
        song.style.display = title.includes(input) ? "block" : "none";
    });
}

// Gestion du lecteur audio
let audioElement = document.getElementById("audioElement");
let playPauseButton = document.getElementById("playPauseButton");
let prevButton = document.getElementById("prevButton");
let nextButton = document.getElementById("nextButton");
let playerTitle = document.getElementById("playerTitle");
let currentTimeDisplay = document.getElementById("currentTime");
let totalTimeDisplay = document.getElementById("totalTime");

let currentSongIndex = -1;
let playlistSongs = [];

function updatePlaylistSongs() {
    playlistSongs = [...document.querySelectorAll("#playlistContent .song")].map(song => ({
        title: song.querySelector("p").textContent,
        src: song.getAttribute("data-src")
    }));
}

function playSong(index) {
    updatePlaylistSongs();

    if (playlistSongs.length === 0) return;

    if (index < 0) index = playlistSongs.length - 1;
    if (index >= playlistSongs.length) index = 0;

    currentSongIndex = index;
    let song = playlistSongs[currentSongIndex];

    audioElement.src = song.src;
    playerTitle.textContent = song.title;
    audioElement.play();
    playPauseButton.textContent = "⏸";
}

playPauseButton.addEventListener("click", function () {
    if (audioElement.paused) {
        if (currentSongIndex === -1) {
            playSong(0);
        } else {
            audioElement.play();
        }
        playPauseButton.textContent = "⏸";
    } else {
        audioElement.pause();
        playPauseButton.textContent = "▶";
    }
});

prevButton.addEventListener("click", function () {
    if (playlistSongs.length > 0) {
        playSong(currentSongIndex - 1);
    }
});

nextButton.addEventListener("click", function () {
    if (playlistSongs.length > 0) {
        playSong(currentSongIndex + 1);
    }
});

audioElement.addEventListener("ended", function () {
    if (currentSongIndex !== -1 && playlistSongs[currentSongIndex]) {
        const finishedTitle = playlistSongs[currentSongIndex].title;
        addPlayCount(finishedTitle);  // Incrémente si chanson jouée entièrement
    }

    playSong(currentSongIndex + 1);  // Passe à la suivante
});


// Mise à jour du temps actuel et du temps total
audioElement.addEventListener("timeupdate", function () {
    let currentMinutes = Math.floor(audioElement.currentTime / 60);
    let currentSeconds = Math.floor(audioElement.currentTime % 60);
    currentTimeDisplay.textContent = `${currentMinutes}:${currentSeconds < 10 ? "0" : ""}${currentSeconds}`;

    let totalMinutes = Math.floor(audioElement.duration / 60);
    let totalSeconds = Math.floor(audioElement.duration % 60);
    if (!isNaN(totalMinutes) && !isNaN(totalSeconds)) {
        totalTimeDisplay.textContent = `${totalMinutes}:${totalSeconds < 10 ? "0" : ""}${totalSeconds}`;
    }
});

let progressContainer = document.getElementById("progressContainer");
let progressBar = document.getElementById("progressBar");

audioElement.addEventListener("timeupdate", function () {
    if (audioElement.duration) {
        let progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
        progressBar.style.width = progressPercent + "%";
    }
});

// Réinitialisation du lecteur audio si la playlist est vide
function checkAndResetPlayer() {
    let playlistContent = document.getElementById("playlistContent");
    if (playlistContent.children.length === 0) {
        resetPlayer();
    }
}

function resetPlayer() {
    // Réinitialiser le titre
    document.getElementById("playerTitle").textContent = "No playing";

    // Réinitialiser les temps
    document.getElementById("currentTime").textContent = "0:00";
    document.getElementById("totalTime").textContent = "0:00";

    // Arrêter la lecture de la musique
    audioElement.pause();
    audioElement.currentTime = 0;

    // Réinitialiser la barre de progression
    document.getElementById("progressBar").style.width = "0%";
}

function removeFromPlaylist(button) {
    button.parentElement.remove();
    savePlaylist();
    checkAndResetPlayer(); // Vérifier si la playlist est vide et réinitialiser le lecteur
}

function savePlaylist() {
    let songs = [...document.querySelectorAll("#playlistContent .song")].map(song => ({
        title: song.querySelector("p").textContent,
        src: song.getAttribute("data-src")
    }));

    localStorage.setItem("playlist", JSON.stringify(songs));

    // Vérifier si la playlist est vide et réinitialiser le lecteur
    checkAndResetPlayer();
}

function loadPlaylist() {
    let storedPlaylist = localStorage.getItem("playlist");
    if (storedPlaylist) {
        let playlistContent = document.getElementById("playlistContent");
        playlistContent.innerHTML = ""; // Vider la liste avant chargement
        JSON.parse(storedPlaylist).forEach(song => {
            let songDiv = document.createElement("div");
            songDiv.classList.add("song");
            songDiv.setAttribute("draggable", "true");
            songDiv.setAttribute("data-src", song.src);
            songDiv.innerHTML = `<p>${song.title}</p>
                                 <button onclick="removeFromPlaylist(this)">Retirer</button>`;

            addDragAndDropEvents(songDiv);

            playlistContent.appendChild(songDiv);
        });
    }

    // Vérifier si la playlist est vide et réinitialiser le lecteur
    checkAndResetPlayer();
}

// Permet à l'utilisateur de cliquer sur la barre pour avancer dans la chanson
progressContainer.addEventListener("click", function (e) {
    let clickPosition = (e.offsetX / progressContainer.offsetWidth) * audioElement.duration;
    audioElement.currentTime = clickPosition;
});     