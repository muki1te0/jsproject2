const APIKEY = '6486ea7be8d341c2aee0aa5881e8e752'
const recipeGrid = document.getElementById('recipe-grid');
const searchButton = document.getElementById('search-button');
const recipeNameInput = document.getElementById('recipe-name');
const suggestionsBox = document.getElementById('suggestions');
const contentSection = document.getElementById('content-section');
const recipeOverview = document.getElementById('recipe-overview');
const recipeinfo = document.getElementById('recipe-info');
const favoritesGrid = document.getElementById('favorites-grid');
const favoritesSection = document.getElementById('favorites-section');
const emptyFavoritesMessage = document.getElementById('empty-favorites-message');
const favoritesButton = document.getElementById('favorites-button');
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let lastActiveSection = 'trending';

loadPopularRecipes();

searchButton.addEventListener('click', () => {
    const query = recipeNameInput.value;
    if (query) searchRecipes(query);
    suggestionsBox.style.display = 'none';
});

favoritesButton.addEventListener('click', () => {
    displayFavorites();
});

recipeNameInput.addEventListener('input', async () => {
    const query = recipeNameInput.value;
    if (query.length > 2) {
        const response = await fetch(`https://api.spoonacular.com/recipes/autocomplete?apiKey=${APIKEY}&query=${query}&number=5`);
        const data = await response.json();
        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'block';
        data.forEach(recipe => {
            const suggestion = document.createElement('div');
            suggestion.classList.add('suggestion');
            suggestion.textContent = recipe.title;
            suggestion.addEventListener('click', () => {
                recipeNameInput.value = recipe.title;
                searchRecipes(recipe.title);
                suggestionsBox.innerHTML = '';
            });
            suggestionsBox.appendChild(suggestion);
        });
    } else {
        suggestionsBox.innerHTML = '';
    }
});

async function loadPopularRecipes() {
    const response = await fetch(`https://api.spoonacular.com/recipes/random?apiKey=${APIKEY}&number=10`);
    const data = await response.json();
    displayRecipes(data.recipes, recipeGrid);
}

async function searchRecipes(query) {
    const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${APIKEY}&query=${query}`);
    const data = await response.json();
    displayRecipes(data.results, recipeGrid);
}

async function viewRecipe(recipeId) {
    const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${APIKEY}`);
    const recipe = await response.json();

    const inFavorites = favorites.includes(recipeId);

    if (recipeGrid.style.display === 'grid' && contentSection.style.display !== 'none') {
        lastActiveView = 'trending';
    } else if (favoritesSection.style.display === 'block') {
        lastActiveView = 'favorites';
    } else if (recipeNameInput.value) {
        lastActiveView = 'search';
    }

    const ingredientsList = recipe.extendedIngredients.map(ingredient => `
        <li>${ingredient.amount} ${ingredient.unit} of ${ingredient.name}</li>
    `).join('');
    const nutritionResponse = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json?apiKey=${APIKEY}`);
        const nutritionData = await nutritionResponse.json();

    recipeGrid.style.display = 'none';
    favoritesSection.style.display = 'none';
    contentSection.style.display = 'none';
    recipeOverview.style.display = 'block';
    recipeinfo.innerHTML = `
        <h2>${recipe.title}</h2>
        <img src="${recipe.image}" alt="${recipe.title}">
        <h3>Ingredients</h3>
        <ul>${ingredientsList}</ul>
        <span>
            <h3>Instructions</h3>
            <p>${recipe.instructions || "Instructions not available."}</p>
        </span>
        <span>
            <h3>Nutritional Information</h3>
            <p>Calories: ${nutritionData.calories || 'N/A'}</p>
            <p>Protein: ${nutritionData.protein || 'N/A'}</p>
            <p>Fat: ${nutritionData.fat || 'N/A'}</p>
            <p>Carbohydrates: ${nutritionData.carbs || 'N/A'}</p>
        </span>
        <p>Preparation Time: ${recipe.readyInMinutes} mins</p>
        <button id="favorites-toggle-button" onclick="toggleFavorite(${recipe.id})">
            ${inFavorites ? "Remove from Favorites" : "Add to Favorites"}
        </button>
        <button onclick="backToResults()">Back to Results</button>
    `;
}

function displayRecipes(recipes, grid) {
    grid.innerHTML = '';
    recipes.forEach(recipe => {
        const recipeItem = document.createElement('div');
        recipeItem.classList.add('recipe-item');
        recipeItem.innerHTML = `
            <div onclick="viewRecipe(${recipe.id})">
                <img src="${recipe.image}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
                <p>Preparation Time: ${recipe.readyInMinutes} mins</p>
            </div>
        `;
        grid.appendChild(recipeItem);
    });
}

function toggleFavorite(recipeId) {
    const inFavorites = favorites.includes(recipeId);
    const button = document.getElementById('favorites-toggle-button');

    if (inFavorites) {
        favorites = favorites.filter(id => id !== recipeId);
        button.textContent = "Add to Favorites";
    } else {
        favorites.push(recipeId);
        button.textContent = "Remove from Favorites";
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function backToResults() {
    recipeOverview.style.display = 'none';

    if (lastActiveView === 'trending') {
        loadTrendingRecipes();
        recipeGrid.style.display = 'grid';
        contentSection.style.display = 'block';
    } else if (lastActiveView === 'search') {
        searchRecipes(recipeNameInput.value);
        contentSection.style.display = 'block';
        recipeGrid.style.display = 'grid';
    } else if (lastActiveView === 'favorites') {
        displayFavorites(); 
    }
}

function displayFavorites() {
    recipeGrid.style.display = 'none';
    contentSection.style.display = 'none';
    favoritesSection.style.display = 'block';
    
    if (favorites.length === 0) {
        emptyFavoritesMessage.style.display = 'block';
    } else {
        emptyFavoritesMessage.style.display = 'none';
        loadFavorites();
    }
}

async function loadFavorites() {
    const favoriteRecipes = await Promise.all(
        favorites.map(async (recipeId) => {
            const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${APIKEY}`);
            return response.json();
        })
    );
    displayRecipes(favoriteRecipes, favoritesGrid);
}
