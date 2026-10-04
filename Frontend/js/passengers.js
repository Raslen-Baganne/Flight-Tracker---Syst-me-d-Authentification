/**
 * Flight & Passengers Tracker
 * Passengers JavaScript File
 * Handles RandomUser API and REST Countries API integration
 */

// API URLs
const RANDOM_USER_API = 'https://randomuser.me/api/';
const REST_COUNTRIES_API = 'https://restcountries.com/v3.1/name/';

// Country code mapping for REST Countries API
const countryMapping = {
    'France': 'France',
    'United States': 'United States',
    'Germany': 'Germany',
    'United Kingdom': 'United Kingdom',
    'Spain': 'Spain',
    'Italy': 'Italy',
    'Netherlands': 'Netherlands',
    'Belgium': 'Belgium',
    'Switzerland': 'Switzerland',
    'Canada': 'Canada',
    'Japan': 'Japan',
    'China': 'China',
    'Australia': 'Australia',
    'Brazil': 'Brazil',
    'India': 'India',
    'Portugal': 'Portugal',
    'Austria': 'Austria',
    'Sweden': 'Sweden',
    'Norway': 'Norway',
    'Denmark': 'Denmark',
    'Poland': 'Poland',
    'Ireland': 'Ireland',
    'Finland': 'Finland',
    'Greece': 'Greece',
    'Turkey': 'Turkey',
    'Russia': 'Russia',
    'Mexico': 'Mexico',
    'Argentina': 'Argentina',
    'South Korea': 'South Korea',
    'Singapore': 'Singapore',
    'Thailand': 'Thailand',
    'Malaysia': 'Malaysia',
    'Indonesia': 'Indonesia',
    'United Arab Emirates': 'United Arab Emirates',
    'UAE': 'United Arab Emirates',
    'Saudi Arabia': 'Saudi Arabia',
    'Egypt': 'Egypt',
    'South Africa': 'South Africa',
    'Morocco': 'Morocco',
    'Nigeria': 'Nigeria',
    'Kenya': 'Kenya',
    'Tunisia': 'Tunisia',
    'Qatar': 'Qatar',
    'Algeria': 'Algeria',
    'Libya': 'Libya'
};

$(document).ready(function() {
    console.log('Passengers page initialized');
    
    // Check for selected flight
    checkSelectedFlight();
    
    // Demo data button
    $('#loadDemoData').on('click', function() {
        loadDemoFlightData();
    });
    
    // Refresh passengers button
    $('#refreshPassengers').on('click', function() {
        const flight = JSON.parse(localStorage.getItem('selectedFlight'));
        if (flight) {
            loadPassengers();
            // Load destination country info if available
            if (flight.destination && flight.destination.country) {
                loadCountryInfo(flight.destination.country);
            } else {
                loadCountryInfo(flight.country);
            }
        }
    });
});

/**
 * Check if a flight is selected
 */
function checkSelectedFlight() {
    const selectedFlight = localStorage.getItem('selectedFlight');
    
    if (selectedFlight) {
        const flight = JSON.parse(selectedFlight);
        displaySelectedFlight(flight);
        loadPassengers();
        // Load destination country info if available, otherwise use origin country
        if (flight.destination && flight.destination.country) {
            loadCountryInfo(flight.destination.country);
        } else {
            loadCountryInfo(flight.country);
        }
    } else {
        // Show no flight alert
        $('#noFlightAlert').removeClass('d-none');
        $('#mainContent').addClass('d-none');
        $('#selectedFlightInfo').addClass('d-none');
    }
}

/**
 * Load demo flight data
 */
function loadDemoFlightData() {
    const demoFlight = {
        callsign: 'TU724',
        country: 'Tunisia',
        altitude: 10500,
        velocity: 250,
        heading: 45,
        latitude: '36.8065',
        longitude: '10.1815',
        departure: {
            code: 'TUN',
            city: 'Tunis',
            country: 'Tunisia'
        },
        destination: {
            code: 'CDG',
            city: 'Paris',
            country: 'France'
        }
    };
    
    localStorage.setItem('selectedFlight', JSON.stringify(demoFlight));
    
    // Hide alert and show content
    $('#noFlightAlert').addClass('d-none');
    $('#mainContent').removeClass('d-none');
    
    displaySelectedFlight(demoFlight);
    loadPassengers();
    // Load destination country info
    if (demoFlight.destination) {
        loadCountryInfo(demoFlight.destination.country);
    } else {
        loadCountryInfo(demoFlight.country);
    }
}

/**
 * Display selected flight info
 * @param {Object} flight - Flight data object
 */
function displaySelectedFlight(flight) {
    $('#noFlightAlert').addClass('d-none');
    $('#selectedFlightInfo').removeClass('d-none');
    $('#mainContent').removeClass('d-none');
    
    // Basic flight info
    $('#currentFlightCallsign').text(flight.callsign);
    $('#currentFlightCountry').text(flight.country);
    $('#currentFlightAltitude').text(`${flight.altitude.toLocaleString()} m`);
    $('#currentFlightVelocity').text(`${flight.velocity ? flight.velocity.toLocaleString() : '--'} m/s`);
    $('#currentFlightHeading').text(`${flight.heading ? flight.heading : '--'}°`);
    
    // Departure info
    if (flight.departure) {
        $('#flightDepartureCode').text(flight.departure.code);
        $('#flightDepartureCity').text(flight.departure.city);
        $('#flightDepartureCountry').text(flight.departure.country);
    } else {
        $('#flightDepartureCode').text('---');
        $('#flightDepartureCity').text('N/A');
        $('#flightDepartureCountry').text('');
    }
    
    // Destination info
    if (flight.destination) {
        $('#flightDestinationCode').text(flight.destination.code);
        $('#flightDestinationCity').text(flight.destination.city);
        $('#flightDestinationCountry').text(flight.destination.country);
    } else {
        $('#flightDestinationCode').text('---');
        $('#flightDestinationCity').text('N/A');
        $('#flightDestinationCountry').text('');
    }
}

/**
 * Load passengers from RandomUser API
 */
function loadPassengers() {
    // Show loading
    $('#passengersLoading').removeClass('d-none');
    $('#passengersList').addClass('d-none');
    
    // Generate random number of passengers (5-15)
    const passengerCount = Math.floor(Math.random() * 11) + 5;
    
    // AJAX request to RandomUser API
    $.ajax({
        url: `${RANDOM_USER_API}?results=${passengerCount}&nat=fr,us,gb,de,es,it`,
        method: 'GET',
        dataType: 'json',
        timeout: 15000,
        success: function(response) {
            console.log('Passengers data received:', response);
            
            if (response && response.results && response.results.length > 0) {
                displayPassengers(response.results);
            } else {
                showPassengersError('Aucun passager trouvé.');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching passengers:', error);
            // Generate demo passengers
            const demoPassengers = generateDemoPassengers(passengerCount);
            displayPassengers(demoPassengers);
        }
    });
}

/**
 * Generate demo passengers when API fails
 * @param {number} count - Number of passengers
 * @returns {Array} Array of passenger objects
 */
function generateDemoPassengers(count) {
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Lucas', 'Emma', 'Louis', 'Chloé', 'Thomas', 'Léa',
                        'John', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'James', 'Anna', 'Robert', 'Julia'];
    const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
                       'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const nationalities = ['French', 'American', 'British', 'German', 'Spanish', 'Italian'];
    
    const passengers = [];
    
    for (let i = 0; i < count; i++) {
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        passengers.push({
            name: {
                first: firstName,
                last: lastName
            },
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
            dob: {
                age: Math.floor(Math.random() * 50) + 18
            },
            nat: ['FR', 'US', 'GB', 'DE', 'ES', 'IT'][Math.floor(Math.random() * 6)],
            picture: {
                medium: `https://randomuser.me/api/portraits/${gender === 'male' ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`
            },
            gender: gender
        });
    }
    
    return passengers;
}

/**
 * Display passengers in the UI
 * @param {Array} passengers - Array of passenger objects
 */
function displayPassengers(passengers) {
    // Hide loading
    $('#passengersLoading').addClass('d-none');
    $('#passengersList').removeClass('d-none').empty();
    
    // Update count
    $('#passengerCount').text(`${passengers.length} passagers`);
    
    // Create passenger cards
    passengers.forEach((passenger, index) => {
        const nationality = getNationalityName(passenger.nat);
        const flagEmoji = getFlagEmoji(passenger.nat);
        
        const cardHtml = `
            <div class="col-md-6 fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="card passenger-card shadow-sm h-100">
                    <div class="card-body d-flex align-items-center p-3">
                        <img src="${passenger.picture.medium}" alt="${passenger.name.first}" class="passenger-avatar me-3">
                        <div>
                            <h6 class="mb-1">${passenger.name.first} ${passenger.name.last}</h6>
                            <p class="mb-0 small text-muted">
                                <i class="fas fa-envelope me-1"></i>${passenger.email}
                            </p>
                            <p class="mb-0 small">
                                <span class="badge bg-secondary me-1">${passenger.dob.age} ans</span>
                                <span class="badge bg-info">${flagEmoji} ${nationality}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#passengersList').append(cardHtml);
    });
}

/**
 * Get nationality name from code
 * @param {string} code - Country code
 * @returns {string} Nationality name
 */
function getNationalityName(code) {
    const nationalities = {
        'FR': 'Français',
        'US': 'Américain',
        'GB': 'Britannique',
        'DE': 'Allemand',
        'ES': 'Espagnol',
        'IT': 'Italien',
        'NL': 'Néerlandais',
        'BE': 'Belge',
        'CH': 'Suisse',
        'CA': 'Canadien',
        'AU': 'Australien',
        'BR': 'Brésilien'
    };
    return nationalities[code] || code;
}

/**
 * Get flag emoji from country code
 * @param {string} code - Country code
 * @returns {string} Flag emoji
 */
function getFlagEmoji(code) {
    const flags = {
        'FR': '🇫🇷',
        'US': '🇺🇸',
        'GB': '🇬🇧',
        'DE': '🇩🇪',
        'ES': '🇪🇸',
        'IT': '🇮🇹',
        'NL': '🇳🇱',
        'BE': '🇧🇪',
        'CH': '🇨🇭',
        'CA': '🇨🇦',
        'AU': '🇦🇺',
        'BR': '🇧🇷'
    };
    return flags[code] || '🏳️';
}

/**
 * Show passengers error
 * @param {string} message - Error message
 */
function showPassengersError(message) {
    $('#passengersLoading').addClass('d-none');
    $('#passengersList').removeClass('d-none').html(`
        <div class="col-12">
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>${message}
            </div>
        </div>
    `);
}

/**
 * Load country information from REST Countries API
 * @param {string} countryName - Name of the country
 */
function loadCountryInfo(countryName) {
    // Show loading
    $('#countryLoading').removeClass('d-none');
    $('#countryInfo').addClass('d-none');
    
    // Map country name if needed
    const searchName = countryMapping[countryName] || countryName;
    
    // AJAX request to REST Countries API
    $.ajax({
        url: `${REST_COUNTRIES_API}${encodeURIComponent(searchName)}?fullText=true`,
        method: 'GET',
        dataType: 'json',
        timeout: 15000,
        success: function(response) {
            console.log('Country data received:', response);
            
            if (response && response.length > 0) {
                displayCountryInfo(response[0]);
            } else {
                // Try partial match
                tryPartialCountryMatch(searchName);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching country info:', error);
            // Try partial match
            tryPartialCountryMatch(searchName);
        }
    });
}

/**
 * Try partial match for country name
 * @param {string} countryName - Name of the country
 */
function tryPartialCountryMatch(countryName) {
    $.ajax({
        url: `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`,
        method: 'GET',
        dataType: 'json',
        timeout: 15000,
        success: function(response) {
            if (response && response.length > 0) {
                displayCountryInfo(response[0]);
            } else {
                displayDemoCountryInfo(countryName);
            }
        },
        error: function() {
            displayDemoCountryInfo(countryName);
        }
    });
}

/**
 * Display demo country info when API fails
 * @param {string} countryName - Name of the country
 */
function displayDemoCountryInfo(countryName) {
    const demoCountries = {
        'France': {
            name: { common: 'France', official: 'République française' },
            capital: ['Paris'],
            population: 67390000,
            region: 'Europe',
            subregion: 'Western Europe',
            languages: { fra: 'French' },
            currencies: { EUR: { name: 'Euro', symbol: '€' } },
            timezones: ['UTC+01:00'],
            flags: { svg: 'https://flagcdn.com/fr.svg' },
            latlng: [46, 2],
            maps: { googleMaps: 'https://goo.gl/maps/g7QxxSFsWyTPKuzd7' }
        },
        'United States': {
            name: { common: 'United States', official: 'United States of America' },
            capital: ['Washington, D.C.'],
            population: 329500000,
            region: 'Americas',
            subregion: 'North America',
            languages: { eng: 'English' },
            currencies: { USD: { name: 'United States dollar', symbol: '$' } },
            timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC+10:00', 'UTC+12:00'],
            flags: { svg: 'https://flagcdn.com/us.svg' },
            latlng: [38, -97],
            maps: { googleMaps: 'https://goo.gl/maps/e8M246zY4BSjkjAv6' }
        },
        'Germany': {
            name: { common: 'Germany', official: 'Federal Republic of Germany' },
            capital: ['Berlin'],
            population: 83240000,
            region: 'Europe',
            subregion: 'Western Europe',
            languages: { deu: 'German' },
            currencies: { EUR: { name: 'Euro', symbol: '€' } },
            timezones: ['UTC+01:00'],
            flags: { svg: 'https://flagcdn.com/de.svg' },
            latlng: [51, 9],
            maps: { googleMaps: 'https://goo.gl/maps/mD9FBMq1nvXUBrkv6' }
        }
    };
    
    const country = demoCountries[countryName] || demoCountries['France'];
    displayCountryInfo(country);
    
    // Show info that demo data is used
    $('#countryInfo').prepend(`
        <div class="alert alert-info small mb-3">
            <i class="fas fa-info-circle me-1"></i>
            Données de démonstration (API non accessible)
        </div>
    `);
}

/**
 * Display country information in the UI
 * @param {Object} country - Country data object
 */
function displayCountryInfo(country) {
    // Hide loading
    $('#countryLoading').addClass('d-none');
    $('#countryInfo').removeClass('d-none');
    
    // Display data
    $('#countryFlag').attr('src', country.flags.svg || country.flags.png);
    $('#countryName').text(country.name.common);
    $('#countryCapital').text(country.capital ? country.capital.join(', ') : 'N/A');
    $('#countryPopulation').text(country.population ? country.population.toLocaleString() : 'N/A');
    $('#countryRegion').text(`${country.region}${country.subregion ? ' - ' + country.subregion : ''}`);
    
    // Languages
    if (country.languages) {
        $('#countryLanguages').text(Object.values(country.languages).join(', '));
    } else {
        $('#countryLanguages').text('N/A');
    }
    
    // Currency
    if (country.currencies) {
        const currencies = Object.values(country.currencies).map(c => `${c.name} (${c.symbol || ''})`);
        $('#countryCurrency').text(currencies.join(', '));
    } else {
        $('#countryCurrency').text('N/A');
    }
    
    // Timezone
    if (country.timezones && country.timezones.length > 0) {
        $('#countryTimezone').text(country.timezones[0]);
    } else {
        $('#countryTimezone').text('N/A');
    }
    
    // Google Maps link
    if (country.maps && country.maps.googleMaps) {
        $('#countryMapLink').attr('href', country.maps.googleMaps);
    } else if (country.latlng) {
        $('#countryMapLink').attr('href', `https://www.google.com/maps/@${country.latlng[0]},${country.latlng[1]},6z`);
    }
}
