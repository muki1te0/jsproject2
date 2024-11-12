const APIKEY = '6e2211449007b1a9eaf047821b4ba86b'
const contentSection = document.querySelector('.content');
const movieGrid = document.getElementById('movie-grid');
const searchButton = document.getElementById('search-button');
const movieNameInput = document.getElementById('movie-name');
const suggestionsBox = document.getElementById('suggestions');
const movieOverview = document.getElementById('movie-overview');
const watchlistGrid = document.getElementById('watchlist-grid');
const watchlistSection = document.getElementById('watchlist');
const emptyWatchlistMessage = document.getElementById('empty-watchlist-message');
const watchlistButton = document.getElementById('watchlist-button');
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

loadTrendingMovies();

document.addEventListener("DOMContentLoaded", () => {
    showTrendingMovies();
});

searchButton.addEventListener('click', () => {
    const query = movieNameInput.value;
    if (query) searchMovies(query);
    suggestionsBox.style.display = 'none';
});

watchlistButton.addEventListener('click', () => {
    if (watchlistSection.style.display === 'none') {
        displayWatchlist();
    } else {
        showTrendingMovies();
    }
});

movieNameInput.addEventListener('input', async () => {
    const query = movieNameInput.value;
    if (query.length > 2) {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${APIKEY}&query=${query}`);
        const data = await response.json();
        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'block';
        data.results.slice(0, 10).forEach(movie => {
            const suggestion = document.createElement('div');
            suggestion.classList.add('suggestion');
            const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
            suggestion.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w45${movie.poster_path}" alt="${movie.title}" class="suggestion-poster">
                <div class="suggestion-info">
                    <span class="suggestion-title">${movie.title} (${releaseYear})</span>
                </div>
            `;
            suggestion.addEventListener('click', () => {
                movieNameInput.value = movie.title;
                searchMovies(movie.title);
                suggestionsBox.innerHTML = '';
            });
            suggestionsBox.appendChild(suggestion);
        });
    } else {
        suggestionsBox.innerHTML = '';
    }
});

async function searchMovies(query, sortCriterion = 'popularity') {
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${APIKEY}&query=${query}`);
    const data = await response.json();
    const sortedMovies = sortMovies(data.results, sortCriterion);
    displayMovies(sortedMovies, movieGrid);
}

function displayMovies(movies, grid) {
    grid.innerHTML = ''; 
    movies.forEach(movie => {
        const movieItem = document.createElement('div');
        movieItem.classList.add('movie-item');
        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        movieItem.innerHTML = `
            <div onclick="viewDetails(${movie.id})">
                <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" alt="${movie.title}">
                <h3>${movie.title} (${releaseYear})</h3>
            </div>
        `;
        grid.appendChild(movieItem);
    });
}

async function viewDetails(movieId) {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${APIKEY}`);
    const movie = await response.json();
    const inWatchlist = watchlist.includes(movieId);

    const response2 = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${APIKEY}`);
    const creditsData = await response2.json();
    const cast = creditsData.cast.slice(0, 6).map(actor => actor.name);
    const director = creditsData.crew.find(member => member.job === "Director");

    movieGrid.style.display = 'none';
    contentSection.style.display = 'none';
    watchlistSection.style.display = 'none';
    movieOverview.style.display = 'flex';

    movieOverview.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
        <div class = "movie-info">
            <span>
                <h1>${movie.title}</h1>
                <p>${movie.overview}</p>
                <p>Release Date: ${movie.release_date}</p>
                <p>Rating: ${movie.vote_average}</p>
                <p>Runtime: ${movie.runtime} min</p>
                <p>Director: ${director ? director.name : 'N/A'}</p>
                <p>Cast: ${cast.join(', ')}</p>
            </span>
            <span>
                <button id="watchlist-toggle-button" onclick="toggleWatchlist(${movie.id})">
                    ${inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                </button>
                <button onclick="backToResults()">Back to Results</button>
            </span>
        </div>
    `;
}

function toggleWatchlist(movieId) {
    const inWatchlist = watchlist.includes(movieId);
    const button = document.getElementById('watchlist-toggle-button');

    if (inWatchlist) {
        watchlist = watchlist.filter(id => id !== movieId);
        button.textContent = "Add to Watchlist";
    } else {
        watchlist.push(movieId);
        button.textContent = "Remove from Watchlist";
    }

    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

function backToResults() {
    movieOverview.style.display = 'none';
    movieGrid.style.display = 'grid';
    contentSection.style.display = 'block';
}

function addToWatchlist(movieId) {
    if (!watchlist.includes(movieId)) {
        watchlist.push(movieId);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
    }
}

async function loadTrendingMovies(sortCriterion = 'popularity') {
    const response = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${APIKEY}`);
    const data = await response.json();
    const sortedMovies = sortMovies(data.results, sortCriterion);
    displayMovies(sortedMovies, movieGrid);
}

function showTrendingMovies() {
    contentSection.style.display = 'block';
    watchlistSection.style.display = 'none';
    movieOverview.style.display = 'none';  
    loadTrendingMovies();
}

async function loadWatchlist(sortCriterion = 'popularity') {
    const watchlistMovies = await Promise.all(
        watchlist.map(async (movieId) => {
            const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${APIKEY}`);
            return response.json();
        })
    );
    const sortedMovies = sortMovies(watchlistMovies, sortCriterion);
    displayMovies(sortedMovies, watchlistGrid);
}

function displayWatchlist() {
    contentSection.style.display = 'none';
    watchlistSection.style.display = 'block';

    if (watchlist.length === 0) {
        emptyWatchlistMessage.style.display = 'block';
        watchlistGrid.innerHTML = '';
    } else {
        emptyWatchlistMessage.style.display = 'none';
        loadWatchlist();
    }
}

function sortMovies(movies, criterion) {
    return movies.sort((a, b) => {
        if (criterion === 'popularity') {
            return b.popularity - a.popularity;
        } else if (criterion === 'release_date') {
            return new Date(b.release_date) - new Date(a.release_date);
        } else if (criterion === 'vote_average') {
            return b.vote_average - a.vote_average;
        }
        return 0;
    });
}

function applySorting() {
    const sortBy = document.getElementById('sort-by').value;
    if (movieNameInput.value) {
        searchMovies(movieNameInput.value, sortBy);
    } else if (watchlistSection.style.display === 'block') {
        loadWatchlist(sortBy);
    } else {
        loadTrendingMovies(sortBy);
    }
}

function removeFromWatchlist(movieId, event) {
    event.stopPropagation();

    watchlist = watchlist.filter((id) => id !== movieId);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    loadWatchlist();
}
