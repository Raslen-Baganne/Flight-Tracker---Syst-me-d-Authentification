/**
 * User Dashboard APIs Integration
 * Handles OpenSky Network, RandomUser, and REST Countries APIs
 */

// API URLs
const OPENSKY_API_URL = 'https://opensky-network.org/api/states/all';
const RANDOM_USER_API = 'https://randomuser.me/api/';
const REST_COUNTRIES_API = 'https://restcountries.com/v3.1/name/';

/**
 * OpenSky Network API Integration
 */
class FlightTracker {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
    }

    async getAllFlights() {
        const cacheKey = 'all_flights';
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch(OPENSKY_API_URL);
            const data = await response.json();
            
            if (data && data.states) {
                const processedFlights = this.processFlightData(data.states);
                this.setCache(cacheKey, processedFlights);
                return processedFlights;
            }
            throw new Error('Données invalides');
        } catch (error) {
            console.error('OpenSky API Error:', error);
            return this.generateDemoFlights(20);
        }
    }

    async searchFlight(callsign) {
        const flights = await this.getAllFlights();
        return flights.find(flight => 
            flight.callsign && flight.callsign.toUpperCase().includes(callsign.toUpperCase())
        );
    }

    processFlightData(states) {
        const airports = [
            { code: 'CDG', city: 'Paris', country: 'France' },
            { code: 'JFK', city: 'New York', country: 'United States' },
            { code: 'LHR', city: 'Londres', country: 'United Kingdom' },
            { code: 'FRA', city: 'Francfort', country: 'Germany' },
            { code: 'DXB', city: 'Dubai', country: 'UAE' },
            { code: 'TUN', city: 'Tunis', country: 'Tunisia' }
        ];

        return states
            .filter(state => state[1] && state[1].trim() !== '')
            .slice(0, 100)
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

    generateDemoFlights(count) {
        const airlines = ['AF', 'LH', 'BA', 'AA', 'DL', 'UA', 'EK', 'TU'];
        const airports = [
            { code: 'CDG', city: 'Paris', country: 'France' },
            { code: 'JFK', city: 'New York', country: 'United States' },
            { code: 'LHR', city: 'Londres', country: 'United Kingdom' },
            { code: 'FRA', city: 'Francfort', country: 'Germany' },
            { code: 'DXB', city: 'Dubai', country: 'UAE' }
        ];

        return Array.from({length: count}, () => {
            const airline = airlines[Math.floor(Math.random() * airlines.length)];
            const flightNum = Math.floor(Math.random() * 9000) + 1000;
            const departure = airports[Math.floor(Math.random() * airports.length)];
            let destination = airports[Math.floor(Math.random() * airports.length)];
            
            while (destination.code === departure.code) {
                destination = airports[Math.floor(Math.random() * airports.length)];
            }

            return {
                icao24: this.generateRandomId(),
                callsign: `${airline}${flightNum}`,
                country: 'Demo',
                departure: departure,
                destination: destination,
                longitude: (Math.random() * 360 - 180).toFixed(4),
                latitude: (Math.random() * 180 - 90).toFixed(4),
                altitude: Math.floor(Math.random() * 12000 + 1000),
                velocity: Math.floor(Math.random() * 300 + 100),
                heading: Math.floor(Math.random() * 360),
                onGround: false
            };
        });
    }

    generateRandomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
}

/**
 * RandomUser API Integration
 */
class PassengerManager {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 600000; // 10 minutes
    }

    async getPassengers(count = 8) {
        const cacheKey = `passengers_${count}`;
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch(`${RANDOM_USER_API}?results=${count}&nat=fr,us,gb,de,es,it`);
            const data = await response.json();
            
            if (data && data.results) {
                this.setCache(cacheKey, data.results);
                return data.results;
            }
            throw new Error('Données invalides');
        } catch (error) {
            console.error('RandomUser API Error:', error);
            return this.generateDemoPassengers(count);
        }
    }

    generateDemoPassengers(count) {
        const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Lucas', 'Emma', 'Louis', 'Chloé'];
        const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand'];
        const nationalities = ['FR', 'US', 'GB', 'DE', 'ES', 'IT'];
        
        return Array.from({length: count}, (_, i) => ({
            name: {
                first: firstNames[i % firstNames.length],
                last: lastNames[i % lastNames.length]
            },
            email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@email.com`,
            dob: {
                age: 25 + (i % 40)
            },
            nat: nationalities[i % nationalities.length],
            picture: {
                medium: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${(i % 99) + 1}.jpg`
            },
            gender: i % 2 === 0 ? 'male' : 'female'
        }));
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
}

/**
 * REST Countries API Integration
 */
class CountryInfoProvider {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 3600000; // 1 hour
    }

    async getCountryInfo(countryName) {
        const cacheKey = `country_${countryName}`;
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch(`${REST_COUNTRIES_API}${encodeURIComponent(countryName)}`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                this.setCache(cacheKey, data[0]);
                return data[0];
            }
            throw new Error('Pays non trouvé');
        } catch (error) {
            console.error('REST Countries API Error:', error);
            return this.getDemoCountryInfo(countryName);
        }
    }

    getDemoCountryInfo(countryName) {
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
                timezones: ['UTC-05:00'],
                flags: { svg: 'https://flagcdn.com/us.svg' },
                latlng: [38, -97],
                maps: { googleMaps: 'https://goo.gl/maps/e8M246zY4BSjkjAv6' }
            }
        };
        
        return demoCountries[countryName] || demoCountries['France'];
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
}

/**
 * Utility Functions
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

function generatePassportNumber() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let passport = '';
    
    for (let i = 0; i < 2; i++) {
        passport += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 7; i++) {
        passport += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return passport;
}

// Initialize API managers
window.flightTracker = new FlightTracker();
window.passengerManager = new PassengerManager();
window.countryInfoProvider = new CountryInfoProvider();

// Export utility functions
window.getNationalityName = getNationalityName;
window.getFlagEmoji = getFlagEmoji;
window.generatePassportNumber = generatePassportNumber;
