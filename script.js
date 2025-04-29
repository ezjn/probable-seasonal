// City to country mapping
const cityToCountry = {
    // UK cities
    'london': 'UK',
    'manchester': 'UK',
    'birmingham': 'UK',
    'edinburgh': 'UK',
    'glasgow': 'UK',
    'liverpool': 'UK',
    'bristol': 'UK',
    'leeds': 'UK',
    'sheffield': 'UK',
    'newcastle': 'UK'
};

// Category styling
const categoryStyles = {
    'fruit': {
        bg: 'bg-red-50',
        text: 'text-red-700',
        icon: '🍎'
    },
    'veg': {
        bg: 'bg-green-50',
        text: 'text-green-700',
        icon: '🥬'
    },
    'forage': {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        icon: '🌿'
    },
    'unknown': {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        icon: '🌱'
    }
};

// Get DOM elements
const cityInput = document.getElementById('cityInput');
const dateInput = document.getElementById('dateInput');
const goBtn = document.getElementById('goBtn');
const resultsDiv = document.getElementById('results');

// Set default date to today
dateInput.valueAsDate = new Date();

// Store the produce data
let produceData = null;
let isLoading = false;

// Show loading state
function showLoading() {
    resultsDiv.innerHTML = `
        <div class="flex items-center justify-center p-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span class="ml-2 text-gray-600">Loading produce data...</span>
        </div>
    `;
}

// Show error state with details
function showError(message, details = null) {
    let errorHtml = `
        <div class="bg-red-50 text-red-700 p-4 rounded-md">
            <p class="font-medium">${message}</p>
    `;
    
    if (details) {
        errorHtml += `
            <p class="mt-2 text-sm text-red-600">
                Details: ${details}
            </p>
        `;
    }
    
    errorHtml += `</div>`;
    resultsDiv.innerHTML = errorHtml;
}

// Load the JSON data
async function loadProduceData() {
    if (isLoading) return;
    isLoading = true;
    showLoading();

    try {
        console.log('Fetching produce data...');
        const response = await fetch('produce_data.json');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Response text:', text.substring(0, 100) + '...');
        
        try {
            produceData = JSON.parse(text);
        } catch (parseError) {
            throw new Error(`JSON parse error: ${parseError.message}`);
        }
        
        // Validate the data structure
        if (!produceData || !produceData.UK) {
            throw new Error('Invalid data format: missing UK data');
        }
        
        // Check if we have data for all months
        for (let i = 0; i < 12; i++) {
            if (!Array.isArray(produceData.UK[i])) {
                throw new Error(`Invalid data format: missing month ${i}`);
            }
        }
        
        console.log('Produce data loaded successfully');
        resultsDiv.innerHTML = ''; // Clear loading state
    } catch (error) {
        console.error('Error loading produce data:', error);
        showError(
            'Error loading produce data. Please try again later.',
            `${error.name}: ${error.message}`
        );
    } finally {
        isLoading = false;
    }
}

// Helper function to determine region based on city
function getRegion(city) {
    const normalizedCity = city.toLowerCase().trim();
    return cityToCountry[normalizedCity] || null;
}

// Function to display results
function displayResults(produce) {
    if (!produce || produce.length === 0) {
        showError('No seasonal produce found for this location. Try another city!');
        return;
    }

    // Group produce by category
    const groupedProduce = produce.reduce((acc, item) => {
        const category = item.category || 'unknown';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {});

    // Create the HTML for each category
    const categoryLists = Object.entries(groupedProduce).map(([category, items]) => {
        const style = categoryStyles[category] || categoryStyles.unknown;
        const itemsList = items.map(item => {
            const imageName = item.name.toLowerCase().replace(/\s+/g, '-');
            return `
                <div class="${style.bg} p-3 rounded-md flex items-center">
                    <img 
                        src="images/${imageName}.svg" 
                        alt="${item.name}" 
                        class="w-8 h-8 mr-3"
                        onerror="this.style.display='none'"
                    >
                    <span class="${style.text}">${style.icon} ${item.name}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="mb-6">
                <h3 class="text-lg font-medium mb-3 capitalize">${category}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${itemsList}
                </div>
            </div>
        `;
    }).join('');

    resultsDiv.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-xl font-semibold text-gray-800 mb-6">Seasonal Produce</h2>
            ${categoryLists}
        </div>
    `;
}

// Add click event listener
goBtn.addEventListener('click', () => {
    const city = cityInput.value;
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    const region = getRegion(city);
    if (!region) {
        showError('Sorry, we don\'t have data for that city yet. Try one of our supported UK cities.');
        return;
    }

    if (!produceData) {
        loadProduceData();
        return;
    }

    const selectedDate = new Date(dateInput.value);
    const currentMonth = selectedDate.getMonth();
    const seasonalProduce = produceData[region][currentMonth];
    displayResults(seasonalProduce);
});

// Load the produce data when the page loads
loadProduceData(); 