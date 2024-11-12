const container = document.querySelector('.container');
const search = document.querySelector('#search-button');
const weatherBox = document.querySelector('.weather-box');
const weatherDetails = document.querySelector('.weather-details');
const error404 = document.querySelector('.not-found');
const forecast = document.querySelector('.forecast');
const forecastList = document.getElementById('forecast-list');
const tempToggle = document.getElementById('temp-toggle');
const toggleLabel = document.getElementById('toggle-label');
const geolocationButton = document.getElementById('geolocation');
const locationInput = document.getElementById('location-input');
const suggestionsBox = document.getElementById('suggestions');

let isCelsius = true;
let currentTempCelsius, forecastTempsCelsius = [];

const APIKey = '6a612a5bd5bbcffc563beca8db121fee';
const geocodeURL = 'http://api.openweathermap.org/geo/1.0/direct';

tempToggle.addEventListener('change', () => {
    isCelsius = !isCelsius;
    toggleLabel.textContent = isCelsius ? '°C' : '°F';
    updateTemperatures();
});

geolocationButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoordinates(latitude, longitude);
        }, error => {
            alert('Unable to retrieve your location.');
            console.error(error);
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
});

locationInput.addEventListener('input', () => {
    const query = locationInput.value;
    if (query.length > 2) {
        fetchSuggestions(query);
    } else {
        suggestionsBox.style.display = 'none';
    }
});

document.addEventListener('click', (e) => {
    if (!suggestionsBox.contains(e.target) && e.target !== locationInput) {
        suggestionsBox.style.display = 'none';
    }
});

search.addEventListener('click', () => {
    const city = document.querySelector('.search-box input').value;

    if (city === '')
        return;

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${APIKey}`)
        .then(response => response.json())
        .then(json => {

            if (json.cod === '404') {
                container.style.height = 'min-content';
                weatherBox.style.display = 'none';
                weatherDetails.style.display = 'none';
                forecast.style.display = 'none';
                error404.style.display = 'block';
                error404.classList.add('fadeIn');
                return;
            }

            error404.style.display = 'none';
            error404.classList.remove('fadeIn');

            currentTempCelsius = json.main.temp;
            updateTemperatures(); 

            const image = document.querySelector('.weather-box img');
            const temperature = document.querySelector('.weather-box .temperature');
            const description = document.querySelector('.weather-box .description');
            const humidity = document.querySelector('.weather-details .humidity span');
            const wind = document.querySelector('.weather-details .wind span');

            switch (json.weather[0].main) {
                case 'Clear':
                    image.src = 'images/clear.png';
                    break;

                case 'Rain':
                    image.src = 'images/rain.png';
                    break;

                case 'Snow':
                    image.src = 'images/snow.png';
                    break;

                case 'Clouds':
                    image.src = 'images/cloud.png';
                    break;

                case 'Haze':
                case 'Mist':
                case 'Fog':
                    image.src = 'images/mist.png'; 
                    break;
                default:
                    image.src = '';
            }

            temperature.innerHTML = `${parseInt(json.main.temp)}<span>°C</span>`;
            description.innerHTML = `${json.weather[0].description}`;
            humidity.innerHTML = `${json.main.humidity}%`;
            wind.innerHTML = `${parseInt(json.wind.speed)}Km/h`;

            weatherBox.style.display = 'block';
            weatherDetails.style.display = 'flex';
            forecast.style.display = 'block'
            weatherBox.classList.add('fadeIn');
            weatherDetails.classList.add('fadeIn');
            forecast.classList.add('fadeIn');
            container.style.height = 'min-content';
        });

    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${APIKey}`)
        .then(response => response.json())
        .then(json => {

            if (json.cod === '404') {
                container.style.height = '400px';
                weatherBox.style.display = 'none';
                weatherDetails.style.display = 'none';
                error404.style.display = 'block';
                error404.classList.add('fadeIn');
                return;
            }

            error404.style.display = 'none';
            error404.classList.remove('fadeIn');

            forecastTempsCelsius = [];
            forecastList.innerHTML = '';

            const dailyForecasts = json.list.filter(item => item.dt_txt.includes("12:00:00"));

            dailyForecasts.forEach(day => {
                const date = new Date(day.dt_txt);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const high = Math.ceil(day.main.temp_max);
                const low = Math.floor(day.main.temp_min);
                const condition = day.weather[0].main;
                forecastTempsCelsius.push({ high, low });
                let icon = '';

                switch (day.weather[0].main) {
                    case 'Clear':
                        icon = '<i class="fa-solid fa-sun"></i>';
                        break;
    
                    case 'Rain':
                        icon = '<i class="fa-solid fa-cloud-rain"></i>';
                        break;
    
                    case 'Snow':
                        icon = '<i class="fa-solid fa-snowflake"></i>';
                        break;
    
                    case 'Clouds':
                        icon = '<i class="fa-solid fa-cloud"></i>';
                        break;
    
                    case 'Haze':
                    case 'Mist':
                    case 'Fog':
                        icon = '<i class="fa-solid fa-smog"></i>'; 
                        break;
                    default:
                        icon = '';
                }

                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span class = "forecast-item">
                        <span>
                            ${dayName}: <br>
                            ${condition}
                            ${icon}
                        </span>
                        <span>
                            <span class="forecast-high">High: ${high}°C</span> <br>
                            <span class="forecast-low">Low: ${low}°C</span>
                        </span>
                    </span>
                `;

                forecastList.appendChild(listItem);
            });
            updateTemperatures();
        });
});

function fetchSuggestions(query) {
    fetch(`${geocodeURL}?q=${query}&limit=5&appid=${APIKey}`)
        .then(response => response.json())
        .then(data => {
            displaySuggestions(data);
        })
        .catch(error => {
            console.error('Error fetching suggestions:', error);
        });
}

function displaySuggestions(locations) {
    suggestionsBox.innerHTML = '';

    locations.forEach(location => {
        const suggestionItem = document.createElement('div');
        suggestionItem.textContent = `${location.name}, ${location.country}`;
        suggestionItem.addEventListener('click', () => {
            locationInput.value = location.name;
            suggestionsBox.innerHTML = ''; 

            fetchWeatherByCoordinates(location.lat, location.lon);
        });
        suggestionsBox.appendChild(suggestionItem);
    });

    suggestionsBox.style.display = locations.length > 0 ? 'block' : 'none';
}

function fetchWeatherByCoordinates(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${APIKey}`)
        .then(response => response.json())
        .then(json => {
            if (json.cod === '404') {
                container.style.height = 'min-content';
                weatherBox.style.display = 'none';
                weatherDetails.style.display = 'none';
                forecast.style.display = 'none';
                error404.style.display = 'block';
                error404.classList.add('fadeIn');
                return;
            }

            error404.style.display = 'none';
            error404.classList.remove('fadeIn');

            currentTempCelsius = json.main.temp;
            updateTemperatures();

            const image = document.querySelector('.weather-box img');
            const temperature = document.querySelector('.weather-box .temperature');
            const description = document.querySelector('.weather-box .description');
            const humidity = document.querySelector('.weather-details .humidity span');
            const wind = document.querySelector('.weather-details .wind span');

            switch (json.weather[0].main) {
                case 'Clear':
                    image.src = 'images/clear.png';
                    break;
                case 'Rain':
                    image.src = 'images/rain.png';
                    break;
                case 'Snow':
                    image.src = 'images/snow.png';
                    break;
                case 'Clouds':
                    image.src = 'images/cloud.png';
                    break;
                case 'Haze':
                case 'Mist':
                case 'Fog':
                    image.src = 'images/mist.png'; 
                    break;
                default:
                    image.src = '';
            }

            temperature.innerHTML = `${parseInt(json.main.temp)}<span>°C</span>`;
            description.innerHTML = `${json.weather[0].description}`;
            humidity.innerHTML = `${json.main.humidity}%`;
            wind.innerHTML = `${parseInt(json.wind.speed)}Km/h`;

            weatherBox.style.display = 'block';
            weatherDetails.style.display = 'flex';
            forecast.style.display = 'block';
            weatherBox.classList.add('fadeIn');
            weatherDetails.classList.add('fadeIn');
            forecast.classList.add('fadeIn');
            container.style.height = 'min-content';
        });

    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${APIKey}`)
        .then(response => response.json())
        .then(json => {
            forecastTempsCelsius = [];
            forecastList.innerHTML = '';

            const dailyForecasts = json.list.filter(item => item.dt_txt.includes("12:00:00"));

            dailyForecasts.forEach(day => {
                const date = new Date(day.dt_txt);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const high = Math.round(day.main.temp_max);
                const low = Math.round(day.main.temp_min);
                const condition = day.weather[0].main;
                forecastTempsCelsius.push({ high, low });
                let icon = '';

                switch (condition) {
                    case 'Clear':
                        icon = '<i class="fa-solid fa-sun"></i>';
                        break;
                    case 'Rain':
                        icon = '<i class="fa-solid fa-cloud-rain"></i>';
                        break;
                    case 'Snow':
                        icon = '<i class="fa-solid fa-snowflake"></i>';
                        break;
                    case 'Clouds':
                        icon = '<i class="fa-solid fa-cloud"></i>';
                        break;
                    case 'Haze':
                    case 'Mist':
                    case 'Fog':
                        icon = '<i class="fa-solid fa-smog"></i>';
                        break;
                    default:
                        icon = '';
                }

                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span class = "forecast-item">
                        <span>
                            ${dayName}: <br>
                            ${condition}
                            ${icon}
                        </span>
                        <span>
                            <span class="forecast-high">High: ${high}°C</span> <br>
                            <span class="forecast-low">Low: ${low}°C</span>
                        </span>
                    </span>
                `;
                forecastList.appendChild(listItem);
            });

            updateTemperatures();
        });
}

function toFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function toCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5/9;
}

function updateTemperatures() {
    const temperature = document.querySelector('.weather-box .temperature');
    if (isCelsius) {
        temperature.innerHTML = `${parseInt(currentTempCelsius)}<span>°C</span>`;
    } else {
        temperature.innerHTML = `${parseInt(toFahrenheit(currentTempCelsius))}<span>°F</span>`;
    }

    forecastList.querySelectorAll('li').forEach((li, index) => {
        const highTemp = isCelsius ? forecastTempsCelsius[index].high : toFahrenheit(forecastTempsCelsius[index].high);
        const lowTemp = isCelsius ? forecastTempsCelsius[index].low : toFahrenheit(forecastTempsCelsius[index].low);

        li.querySelector('.forecast-high').textContent = `High: ${parseInt(highTemp)}°${isCelsius ? 'C' : 'F'}`;
        li.querySelector('.forecast-low').textContent = `Low: ${parseInt(lowTemp)}°${isCelsius ? 'C' : 'F'}`;
    });
}