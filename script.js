// City to country mapping with coordinates
const cityData = {
    // UK cities with approximate coordinates
    'london': { country: 'UK', lat: 51.5074, lon: -0.1278 },
    'manchester': { country: 'UK', lat: 53.4808, lon: -2.2426 },
    'birmingham': { country: 'UK', lat: 52.4862, lon: -1.8904 },
    'edinburgh': { country: 'UK', lat: 55.9533, lon: -3.1883 },
    'glasgow': { country: 'UK', lat: 55.8642, lon: -4.2518 },
    'liverpool': { country: 'UK', lat: 53.4084, lon: -2.9916 },
    'bristol': { country: 'UK', lat: 51.4545, lon: -2.5879 },
    'leeds': { country: 'UK', lat: 53.8008, lon: -1.5491 },
    'sheffield': { country: 'UK', lat: 53.3811, lon: -1.4701 },
    'newcastle': { country: 'UK', lat: 54.9783, lon: -1.6178 }
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

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Function to find nearest supported city
function findNearestCity(inputCity) {
    const normalizedInput = inputCity.toLowerCase().trim();
    
    // First check for exact match
    if (cityData[normalizedInput]) {
        return { city: normalizedInput, distance: 0 };
    }
    
    // If no exact match, find the nearest city
    let nearestCity = null;
    let minDistance = Infinity;
    
    for (const [city, data] of Object.entries(cityData)) {
        const distance = calculateDistance(
            data.lat, data.lon,
            cityData[normalizedInput]?.lat || data.lat,
            cityData[normalizedInput]?.lon || data.lon
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
        }
    }
    
    return { city: nearestCity, distance: Math.round(minDistance) };
}

// Helper function to determine region based on city
function getRegion(city) {
    const nearest = findNearestCity(city);
    if (nearest.distance > 0) {
        showInfo(`Using data for ${nearest.city} (nearest supported city, ${nearest.distance}km away)`);
    }
    return cityData[nearest.city]?.country || null;
}

// Function to show info message
function showInfo(message) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'bg-blue-50 text-blue-700 p-4 rounded-md mb-4';
    infoDiv.textContent = message;
    resultsDiv.insertBefore(infoDiv, resultsDiv.firstChild);
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