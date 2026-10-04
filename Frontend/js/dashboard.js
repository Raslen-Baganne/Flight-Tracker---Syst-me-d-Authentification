/**
 * Flight & Passengers Tracker
 * Dashboard JavaScript File
 * Handles flight data fetching, DataTables, and Chart.js visualizations
 */

// Global variables
let flightsData = [];
let flightsTable = null;
let countryPieChart = null;
let altitudeBarChart = null;

// API URLs
const OPENSKY_API_URL = 'https://opensky-network.org/api/states/all';

$(document).ready(function() {
    console.log('Dashboard initialized');
    
    // Load flight data on page load
    loadFlightData();
    
    // Refresh button click handler
    $('#refreshData').on('click', function() {
        loadFlightData();
    });
});

/**
 * Load flight data from OpenSky Network API
 */
function loadFlightData() {
    // Show loading indicator
    $('#loadingIndicator').removeClass('d-none');
    $('#dashboardContent').addClass('d-none');
    $('#errorMessage').addClass('d-none');
    
    // Disable refresh button during loading
    $('#refreshData').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Chargement...');
    
    // AJAX request to OpenSky Network API
    $.ajax({
        url: OPENSKY_API_URL,
        method: 'GET',
        dataType: 'json',
        timeout: 30000, // 30 second timeout
        success: function(response) {
            console.log('Flight data received:', response);
            
            if (response && response.states && response.states.length > 0) {
                // Process and store flight data
                flightsData = processFlightData(response.states);
                
                // Update statistics
                updateStatistics(flightsData);
                
                // Initialize or update DataTable
                initializeDataTable(flightsData);
                
                // Initialize or update charts
                initializeCharts(flightsData);
                
                // Show dashboard content
                $('#loadingIndicator').addClass('d-none');
                $('#dashboardContent').removeClass('d-none');
            } else {
                showError('Aucune donnée de vol disponible.');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching flight data:', error);
            
            // Show error with fallback to demo data
            let errorMsg = 'Impossible de charger les données. ';
            if (status === 'timeout') {
                errorMsg += 'La requête a expiré.';
            } else if (xhr.status === 0) {
                errorMsg += 'Problème de connexion réseau ou CORS.';
            } else {
                errorMsg += `Erreur ${xhr.status}: ${error}`;
            }
            
            // Load demo data as fallback
            loadDemoData();
        },
        complete: function() {
            // Re-enable refresh button
            $('#refreshData').prop('disabled', false).html('<i class="fas fa-sync-alt me-2"></i>Actualiser');
        }
    });
}

/**
 * Load demo data when API fails
 */
function loadDemoData() {
    console.log('Loading demo data...');
    
    // Generate demo flight data
    const demoData = generateDemoFlights(50);
    flightsData = demoData;
    
    // Update statistics
    updateStatistics(flightsData);
    
    // Initialize DataTable
    initializeDataTable(flightsData);
    
    // Initialize charts
    initializeCharts(flightsData);
    
    // Show dashboard content with info alert
    $('#loadingIndicator').addClass('d-none');
    $('#dashboardContent').removeClass('d-none');
    
    // Show info message about demo data
    showInfoAlert();
}

/**
 * Generate demo flight data
 * @param {number} count - Number of flights to generate
 * @returns {Array} Array of flight objects
 */
function generateDemoFlights(count) {
    const countries = ['France', 'United States', 'Germany', 'United Kingdom', 'Spain', 
                       'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Canada',
                       'Japan', 'China', 'Australia', 'Brazil', 'India', 'Tunisia'];
    const airlines = ['AF', 'LH', 'BA', 'AA', 'DL', 'UA', 'EK', 'QF', 'SQ', 'JL', 'TU'];
    
    // Airports with country and city
    const airports = [
        { code: 'CDG', city: 'Paris', country: 'France' },
        { code: 'JFK', city: 'New York', country: 'United States' },
        { code: 'LHR', city: 'Londres', country: 'United Kingdom' },
        { code: 'FRA', city: 'Francfort', country: 'Germany' },
        { code: 'DXB', city: 'Dubai', country: 'UAE' },
        { code: 'TUN', city: 'Tunis', country: 'Tunisia' },
        { code: 'ORY', city: 'Paris Orly', country: 'France' },
        { code: 'FCO', city: 'Rome', country: 'Italy' },
        { code: 'MAD', city: 'Madrid', country: 'Spain' },
        { code: 'AMS', city: 'Amsterdam', country: 'Netherlands' },
        { code: 'IST', city: 'Istanbul', country: 'Turkey' },
        { code: 'CAI', city: 'Le Caire', country: 'Egypt' },
        { code: 'CMN', city: 'Casablanca', country: 'Morocco' },
        { code: 'DOH', city: 'Doha', country: 'Qatar' },
        { code: 'SIN', city: 'Singapour', country: 'Singapore' }
    ];
    
    const flights = [];
    
    for (let i = 0; i < count; i++) {
        const airline = airlines[Math.floor(Math.random() * airlines.length)];
        const flightNum = Math.floor(Math.random() * 9000) + 1000;
        const departure = airports[Math.floor(Math.random() * airports.length)];
        let destination = airports[Math.floor(Math.random() * airports.length)];
        // Ensure destination is different from departure
        while (destination.code === departure.code) {
            destination = airports[Math.floor(Math.random() * airports.length)];
        }
        
        flights.push({
            icao24: generateRandomId(),
            callsign: `${airline}${flightNum}`,
            country: countries[Math.floor(Math.random() * countries.length)],
            departure: departure,
            destination: destination,
            longitude: (Math.random() * 360 - 180).toFixed(4),
            latitude: (Math.random() * 180 - 90).toFixed(4),
            altitude: Math.floor(Math.random() * 12000 + 1000),
            velocity: Math.floor(Math.random() * 300 + 100),
            heading: Math.floor(Math.random() * 360),
            onGround: false
        });
    }
    
    return flights;
}

/**
 * Generate random flight ID
 */
function generateRandomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Process raw flight data from API
 * @param {Array} states - Raw states array from API
 * @returns {Array} Processed flight data
 */
function processFlightData(states) {
    // Airports for simulated departure/destination
    const airports = [
        { code: 'CDG', city: 'Paris', country: 'France' },
        { code: 'JFK', city: 'New York', country: 'United States' },
        { code: 'LHR', city: 'Londres', country: 'United Kingdom' },
        { code: 'FRA', city: 'Francfort', country: 'Germany' },
        { code: 'DXB', city: 'Dubai', country: 'UAE' },
        { code: 'TUN', city: 'Tunis', country: 'Tunisia' },
        { code: 'ORY', city: 'Paris Orly', country: 'France' },
        { code: 'FCO', city: 'Rome', country: 'Italy' },
        { code: 'MAD', city: 'Madrid', country: 'Spain' },
        { code: 'AMS', city: 'Amsterdam', country: 'Netherlands' },
        { code: 'IST', city: 'Istanbul', country: 'Turkey' },
        { code: 'CAI', city: 'Le Caire', country: 'Egypt' },
        { code: 'CMN', city: 'Casablanca', country: 'Morocco' },
        { code: 'DOH', city: 'Doha', country: 'Qatar' },
        { code: 'SIN', city: 'Singapour', country: 'Singapore' }
    ];
    
    return states
        .filter(state => state[1] && state[1].trim() !== '') // Filter out flights without callsign
        .slice(0, 200) // Limit to 200 flights for performance
        .map(state => {
            const departure = airports[Math.floor(Math.random() * airports.length)];
            let destination = airports[Math.floor(Math.random() * airports.length)];
            while (destination.code === departure.code) {
                destination = airports[Math.floor(Math.random() * airports.length)];
            }
            return {
                icao24: state[0] || 'N/A',
                callsign: (state[1] || 'N/A').trim(),
                country: state[2] || 'Unknown',
                departure: departure,
                destination: destination,
                longitude: state[5] ? state[5].toFixed(4) : 'N/A',
                latitude: state[6] ? state[6].toFixed(4) : 'N/A',
                altitude: state[7] ? Math.round(state[7]) : 0,
                velocity: state[9] ? Math.round(state[9]) : 0,
                heading: state[10] ? Math.round(state[10]) : 0,
                onGround: state[8] || false
            };
        });
}

/**
 * Update statistics cards
 * @param {Array} flights - Flight data array
 */
function updateStatistics(flights) {
    // Total flights
    $('#totalFlights').text(flights.length);
    $('#flightCount').text(`${flights.length} vols`);
    
    // Unique countries
    const countries = [...new Set(flights.map(f => f.country))];
    $('#totalCountries').text(countries.length);
    
    // Average altitude
    const altitudes = flights.filter(f => f.altitude > 0).map(f => f.altitude);
    const avgAlt = altitudes.length > 0 ? Math.round(altitudes.reduce((a, b) => a + b, 0) / altitudes.length) : 0;
    $('#avgAltitude').text(`${avgAlt} m`);
    
    // Average velocity
    const velocities = flights.filter(f => f.velocity > 0).map(f => f.velocity);
    const avgVel = velocities.length > 0 ? Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length) : 0;
    $('#avgVelocity').text(`${avgVel} m/s`);
}

/**
 * Initialize or update DataTable
 * @param {Array} flights - Flight data array
 */
function initializeDataTable(flights) {
    // Destroy existing table if it exists
    if (flightsTable) {
        flightsTable.destroy();
        $('#flightsTable tbody').empty();
    }
    
    // Initialize DataTable
    flightsTable = $('#flightsTable').DataTable({
        data: flights,
        columns: [
            { data: 'callsign' },
            { 
                data: 'departure',
                render: function(data) {
                    if (data && data.code) {
                        return `<span class="badge bg-success"><i class="fas fa-plane-departure me-1"></i>${data.code}</span><br><small class="text-muted">${data.city}</small>`;
                    }
                    return 'N/A';
                }
            },
            { 
                data: 'destination',
                render: function(data) {
                    if (data && data.code) {
                        return `<span class="badge bg-primary"><i class="fas fa-plane-arrival me-1"></i>${data.code}</span><br><small class="text-muted">${data.city}</small>`;
                    }
                    return 'N/A';
                }
            },
            { data: 'country' },
            { 
                data: 'altitude',
                render: function(data) {
                    return data.toLocaleString() + ' m';
                }
            },
            { 
                data: 'velocity',
                render: function(data) {
                    return data.toLocaleString() + ' m/s';
                }
            },
            {
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    return `<button class="btn btn-sm btn-primary select-flight" data-callsign="${row.callsign}" data-country="${row.country}">
                                <i class="fas fa-eye"></i>
                            </button>`;
                }
            }
        ],
        language: {
            search: "Rechercher :",
            lengthMenu: "Afficher _MENU_ vols",
            info: "Affichage de _START_ à _END_ sur _TOTAL_ vols",
            infoEmpty: "Aucun vol disponible",
            infoFiltered: "(filtré sur _MAX_ vols)",
            paginate: {
                first: "Premier",
                last: "Dernier",
                next: "Suivant",
                previous: "Précédent"
            },
            zeroRecords: "Aucun vol trouvé",
            emptyTable: "Aucune donnée disponible"
        },
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Tous"]],
        order: [[0, 'asc']],
        responsive: true
    });
    
    // Row click handler for selection
    $('#flightsTable tbody').on('click', 'tr', function() {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $('#flightDetails').hide();
        } else {
            flightsTable.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            
            const data = flightsTable.row(this).data();
            showFlightDetails(data);
        }
    });
    
    // Button click handler
    $('#flightsTable tbody').on('click', '.select-flight', function(e) {
        e.stopPropagation();
        const row = $(this).closest('tr');
        row.click();
    });
}

/**
 * Show flight details panel
 * @param {Object} flight - Flight data object
 */
function showFlightDetails(flight) {
    // Basic info
    $('#detailCallsign').text(flight.callsign);
    $('#detailCountry').text(flight.country);
    $('#detailPosition').text(`${flight.latitude}, ${flight.longitude}`);
    $('#detailAltitude').text(`${flight.altitude.toLocaleString()} m`);
    $('#detailVelocity').text(`${flight.velocity.toLocaleString()} m/s`);
    $('#detailHeading').text(`${flight.heading}°`);
    
    // Departure info
    if (flight.departure) {
        $('#detailDepartureCode').text(flight.departure.code);
        $('#detailDepartureCity').text(flight.departure.city);
        $('#detailDepartureCountry').text(flight.departure.country);
    } else {
        $('#detailDepartureCode').text('---');
        $('#detailDepartureCity').text('N/A');
        $('#detailDepartureCountry').text('');
    }
    
    // Destination info
    if (flight.destination) {
        $('#detailDestinationCode').text(flight.destination.code);
        $('#detailDestinationCity').text(flight.destination.city);
        $('#detailDestinationCountry').text(flight.destination.country);
    } else {
        $('#detailDestinationCode').text('---');
        $('#detailDestinationCity').text('N/A');
        $('#detailDestinationCountry').text('');
    }
    
    // Flight callsign in route display
    $('#detailFlightCallsign').text(`Vol ${flight.callsign}`);
    
    // Store selected flight data for passengers page
    localStorage.setItem('selectedFlight', JSON.stringify(flight));
    
    // Show details panel with animation
    $('#flightDetails').slideDown();
    
    // Scroll to details
    $('html, body').animate({
        scrollTop: $('#flightDetails').offset().top - 100
    }, 500);
}

/**
 * Initialize Chart.js charts
 * @param {Array} flights - Flight data array
 */
function initializeCharts(flights) {
    // Prepare data for country pie chart
    const countryCounts = {};
    flights.forEach(flight => {
        countryCounts[flight.country] = (countryCounts[flight.country] || 0) + 1;
    });
    
    // Sort and get top 10 countries
    const sortedCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const countryLabels = sortedCountries.map(c => c[0]);
    const countryData = sortedCountries.map(c => c[1]);
    
    // Destroy existing charts
    if (countryPieChart) countryPieChart.destroy();
    if (altitudeBarChart) altitudeBarChart.destroy();
    
    // Country Pie Chart
    const pieCtx = document.getElementById('countryPieChart').getContext('2d');
    countryPieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: countryLabels,
            datasets: [{
                data: countryData,
                backgroundColor: [
                    '#0d6efd', '#198754', '#ffc107', '#dc3545', '#0dcaf0',
                    '#6f42c1', '#fd7e14', '#20c997', '#6c757d', '#d63384'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: { size: 10 }
                    }
                },
                title: {
                    display: false
                }
            }
        }
    });
    
    // Prepare data for altitude distribution
    const altitudeRanges = {
        '0-2000m': 0,
        '2000-4000m': 0,
        '4000-6000m': 0,
        '6000-8000m': 0,
        '8000-10000m': 0,
        '10000m+': 0
    };
    
    flights.forEach(flight => {
        const alt = flight.altitude;
        if (alt < 2000) altitudeRanges['0-2000m']++;
        else if (alt < 4000) altitudeRanges['2000-4000m']++;
        else if (alt < 6000) altitudeRanges['4000-6000m']++;
        else if (alt < 8000) altitudeRanges['6000-8000m']++;
        else if (alt < 10000) altitudeRanges['8000-10000m']++;
        else altitudeRanges['10000m+']++;
    });
    
    // Altitude Bar Chart
    const barCtx = document.getElementById('altitudeBarChart').getContext('2d');
    altitudeBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(altitudeRanges),
            datasets: [{
                label: 'Nombre de vols',
                data: Object.values(altitudeRanges),
                backgroundColor: [
                    'rgba(13, 110, 253, 0.7)',
                    'rgba(25, 135, 84, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(220, 53, 69, 0.7)',
                    'rgba(13, 202, 240, 0.7)',
                    'rgba(111, 66, 193, 0.7)'
                ],
                borderColor: [
                    '#0d6efd', '#198754', '#ffc107', '#dc3545', '#0dcaf0', '#6f42c1'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5
                    }
                },
                x: {
                    ticks: {
                        font: { size: 9 }
                    }
                }
            }
        }
    });
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    $('#loadingIndicator').addClass('d-none');
    $('#errorText').text(message);
    $('#errorMessage').removeClass('d-none');
}

/**
 * Show info alert about demo data
 */
function showInfoAlert() {
    // Désactivé - ne pas afficher l'alerte de démonstration
    return;
    if ($('#demoAlert').length === 0) {
        const alertHtml = `
            <div id="demoAlert" class="alert alert-info alert-dismissible fade show mb-3" role="alert">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Mode démonstration :</strong> Les données affichées sont générées localement car l'API OpenSky Network n'est pas accessible (CORS ou connexion).
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        $('#dashboardContent').prepend(alertHtml);
    }
}
