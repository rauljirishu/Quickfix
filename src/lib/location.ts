// QuickFix Geolocation and All-India Location Services
// Curated dataset of 100 major Indian cities, distance metrics, geocoding resolvers, and browser integration.

export interface IndianCity {
  name: string;
  state: string;
  lat: number;
  lon: number;
}

export interface GraphNode {
  name: string;
  lat: number;
  lon: number;
  isVillage?: boolean;
}

export const ROUTING_NODES: GraphNode[] = [
  // South Mumbai
  { name: 'Colaba', lat: 18.9067, lon: 72.8147 },
  { name: 'Dadar', lat: 19.0178, lon: 72.8478 },
  // West Mumbai Suburbs
  { name: 'Bandra', lat: 19.0596, lon: 72.8295 },
  { name: 'Andheri', lat: 19.1136, lon: 72.8697 },
  { name: 'Borivali', lat: 19.2288, lon: 72.8541 },
  // Central/East Suburbs
  { name: 'Powai', lat: 19.1176, lon: 72.9060 },
  { name: 'Ghatkopar', lat: 19.0860, lon: 72.9090 },
  { name: 'Kurla', lat: 19.0607, lon: 72.8901 },
  // Suburban Hubs
  { name: 'Thane', lat: 19.2183, lon: 72.9781 },
  { name: 'Dombivli', lat: 19.2184, lon: 73.0867 },
  { name: 'Kalyan', lat: 19.2354, lon: 73.1296 },
  { name: 'Vasai', lat: 19.3913, lon: 72.8397 },
  { name: 'Virar', lat: 19.4564, lon: 72.7983 },
  // Navi Mumbai
  { name: 'Vashi', lat: 19.0330, lon: 73.0297 },
  { name: 'Belapur', lat: 19.0202, lon: 73.0410 },
  { name: 'Panvel', lat: 18.9894, lon: 73.1175 },
  // Dense Outlying Villages
  { name: 'Alibag', lat: 18.6584, lon: 72.8773, isVillage: true },
  { name: 'Karjat', lat: 18.9102, lon: 73.3278, isVillage: true },
  { name: 'Khopoli', lat: 18.7844, lon: 73.3428, isVillage: true },
  { name: 'Matheran', lat: 18.9827, lon: 73.2718, isVillage: true },
  { name: 'Kasara', lat: 19.6372, lon: 73.4795, isVillage: true },
  { name: 'Shahapur', lat: 19.4555, lon: 73.3308, isVillage: true },
  { name: 'Palghar', lat: 19.6976, lon: 72.7663, isVillage: true },
  { name: 'Wada', lat: 19.6548, lon: 73.1362, isVillage: true },
  { name: 'Manor', lat: 19.7288, lon: 72.9114, isVillage: true },
  // Connecting National Corridor Hubs
  { name: 'Lonavala', lat: 18.7548, lon: 73.4055 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Nashik', lat: 19.9975, lon: 73.7898 },
  { name: 'Vapi', lat: 20.3709, lon: 72.9106 },
  { name: 'Daman', lat: 20.4162, lon: 72.8347 },
  { name: 'Surat', lat: 21.1702, lon: 72.8311 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Gurgaon', lat: 28.4595, lon: 77.0266 },
  { name: 'Noida', lat: 28.5355, lon: 77.3910 },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
  { name: 'Varanasi', lat: 25.3176, lon: 82.9739 },
  { name: 'Patna', lat: 25.5941, lon: 85.1376 },
  { name: 'Indore', lat: 22.7196, lon: 75.8577 },
  { name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
  { name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
  { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245 },
  { name: 'Dhanbad', lat: 23.7957, lon: 86.4304 },
];

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export const BASE_GRAPH_EDGES: GraphEdge[] = [
  // Mumbai local road connections
  { from: 'Colaba', to: 'Dadar', weight: 12 },
  { from: 'Dadar', to: 'Bandra', weight: 8 },
  { from: 'Bandra', to: 'Andheri', weight: 10 },
  { from: 'Andheri', to: 'Borivali', weight: 14 },
  { from: 'Andheri', to: 'Powai', weight: 8 },
  { from: 'Powai', to: 'Ghatkopar', weight: 6 },
  { from: 'Ghatkopar', to: 'Kurla', weight: 4 },
  { from: 'Kurla', to: 'Dadar', weight: 6 },
  { from: 'Borivali', to: 'Vasai', weight: 20 },
  { from: 'Vasai', to: 'Virar', weight: 10 },
  
  // Mumbai outlying villages and suburbs
  { from: 'Virar', to: 'Palghar', weight: 30 },
  { from: 'Palghar', to: 'Manor', weight: 18 },
  { from: 'Manor', to: 'Wada', weight: 22 },
  { from: 'Wada', to: 'Shahapur', weight: 28 },
  { from: 'Shahapur', to: 'Kasara', weight: 25 },
  { from: 'Kasara', to: 'Nashik', weight: 60 },
  { from: 'Thane', to: 'Shahapur', weight: 50 },
  { from: 'Thane', to: 'Dadar', weight: 22 },
  { from: 'Thane', to: 'Kalyan', weight: 18 },
  { from: 'Kalyan', to: 'Dombivli', weight: 6 },
  { from: 'Dombivli', to: 'Vashi', weight: 25 },
  { from: 'Vashi', to: 'Dadar', weight: 16 },
  { from: 'Vashi', to: 'Belapur', weight: 10 },
  { from: 'Belapur', to: 'Panvel', weight: 12 },
  { from: 'Panvel', to: 'Karjat', weight: 30 },
  { from: 'Karjat', to: 'Matheran', weight: 15 },
  { from: 'Matheran', to: 'Khopoli', weight: 20 },
  { from: 'Panvel', to: 'Khopoli', weight: 25 },
  { from: 'Khopoli', to: 'Lonavala', weight: 15 },
  { from: 'Lonavala', to: 'Pune', weight: 65 },
  { from: 'Panvel', to: 'Alibag', weight: 55 },

  // Interstate & national highway connections
  { from: 'Nashik', to: 'Pune', weight: 210 },
  { from: 'Manor', to: 'Vapi', weight: 95 },
  { from: 'Vapi', to: 'Daman', weight: 12 },
  { from: 'Vapi', to: 'Surat', weight: 115 },
  { from: 'Surat', to: 'Ahmedabad', weight: 265 },
  { from: 'Ahmedabad', to: 'Jaipur', weight: 625 },
  { from: 'Jaipur', to: 'Delhi', weight: 270 },
  { from: 'Delhi', to: 'Gurgaon', weight: 30 },
  { from: 'Delhi', to: 'Noida', weight: 25 },
  { from: 'Delhi', to: 'Lucknow', weight: 550 },
  { from: 'Lucknow', to: 'Varanasi', weight: 320 },
  { from: 'Varanasi', to: 'Patna', weight: 250 },
  { from: 'Ahmedabad', to: 'Indore', weight: 390 },
  { from: 'Indore', to: 'Bhopal', weight: 190 },
  { from: 'Bhopal', to: 'Nagpur', weight: 350 },
  { from: 'Nagpur', to: 'Pune', weight: 710 },
  { from: 'Nagpur', to: 'Hyderabad', weight: 500 },
  { from: 'Hyderabad', to: 'Bangalore', weight: 570 },
  { from: 'Pune', to: 'Bangalore', weight: 840 },
  { from: 'Bangalore', to: 'Chennai', weight: 350 },
  { from: 'Chennai', to: 'Visakhapatnam', weight: 800 },
  { from: 'Visakhapatnam', to: 'Bhubaneswar', weight: 440 },
  { from: 'Bhubaneswar', to: 'Kolkata', weight: 440 },
  { from: 'Kolkata', to: 'Dhanbad', weight: 260 },
];

const BASE_INDIAN_CITIES: IndianCity[] = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
  { name: 'Thane', state: 'Maharashtra', lat: 19.2183, lon: 72.9781 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lon: 73.1812 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lon: 77.4538 },
  { name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573 },
  { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081 },
  { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898 },
  { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lon: 77.3178 },
  { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lon: 77.7064 },
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022 },
  { name: 'Kalyan-Dombivli', state: 'Maharashtra', lat: 19.2354, lon: 73.1296 },
  { name: 'Vasai-Virar', state: 'Maharashtra', lat: 19.3913, lon: 72.8397 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lon: 74.7973 },
  { name: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lon: 75.3433 },
  { name: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lon: 86.4304 },
  { name: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723 },
  { name: 'Navi Mumbai', state: 'Maharashtra', lat: 19.0330, lon: 73.0297 },
  { name: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463 },
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lon: 85.3096 },
  { name: 'Howrah', state: 'West Bengal', lat: 22.5958, lon: 88.2636 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lon: 79.9864 },
  { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480 },
  { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243 },
  { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198 },
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296 },
  { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lon: 75.8648 },
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362 },
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
  { name: 'Solapur', state: 'Maharashtra', lat: 17.6599, lon: 75.9064 },
  { name: 'Hubli-Dharwad', state: 'Karnataka', lat: 15.3647, lon: 75.1240 },
  { name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3670, lon: 79.4304 },
  { name: 'Moradabad', state: 'Uttar Pradesh', lat: 28.8351, lon: 78.7731 },
  { name: 'Mysore', state: 'Karnataka', lat: 12.2958, lon: 76.6394 },
  { name: 'Gurgaon', state: 'Haryana', lat: 28.4595, lon: 77.0266 },
  { name: 'Aligarh', state: 'Uttar Pradesh', lat: 27.8974, lon: 78.0880 },
  { name: 'Jalandhar', state: 'Punjab', lat: 31.3260, lon: 75.5762 },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7905, lon: 78.7047 },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lon: 85.8245 },
  { name: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lon: 78.1460 },
  { name: 'Mira-Bhayandar', state: 'Maharashtra', lat: 19.2813, lon: 72.8561 },
  { name: 'Warangal', state: 'Telangana', lat: 17.9689, lon: 79.5941 },
  { name: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lon: 80.4365 },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lon: 76.9366 },
  { name: 'Bhiwandi', state: 'Maharashtra', lat: 19.2813, lon: 73.0483 },
  { name: 'Saharanpur', state: 'Uttar Pradesh', lat: 29.9640, lon: 77.5460 },
  { name: 'Amravati', state: 'Maharashtra', lat: 20.9374, lon: 77.7796 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lon: 77.3910 },
  { name: 'Jamshedpur', state: 'Jharkhand', lat: 22.8046, lon: 86.2029 },
  { name: 'Bhilai', state: 'Chhattisgarh', lat: 21.1938, lon: 81.3509 },
  { name: 'Cuttack', state: 'Odisha', lat: 20.4625, lon: 85.8830 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
  { name: 'Nellore', state: 'Andhra Pradesh', lat: 14.4426, lon: 79.9865 },
  { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lon: 78.0322 },
  { name: 'Durgapur', state: 'West Bengal', lat: 23.5204, lon: 87.3119 },
  { name: 'Asansol', state: 'West Bengal', lat: 23.6740, lon: 86.9520 },
  { name: 'Rourkela', state: 'Odisha', lat: 22.2604, lon: 84.8536 },
  { name: 'Nanded', state: 'Maharashtra', lat: 19.1383, lon: 77.3210 },
  { name: 'Kolhapur', state: 'Maharashtra', lat: 16.7050, lon: 74.2433 },
  { name: 'Ajmer', state: 'Rajasthan', lat: 26.4498, lon: 74.6399 },
  { name: 'Akola', state: 'Maharashtra', lat: 20.7002, lon: 77.0082 },
  { name: 'Gulbarga', state: 'Karnataka', lat: 17.3297, lon: 76.8343 },
  { name: 'Jamnagar', state: 'Gujarat', lat: 22.4707, lon: 70.0577 },
  { name: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1760, lon: 75.7885 },
  { name: 'Loni', state: 'Uttar Pradesh', lat: 28.7513, lon: 77.2913 },
  { name: 'Siliguri', state: 'West Bengal', lat: 26.7271, lon: 88.3953 },
  { name: 'Jhansi', state: 'Uttar Pradesh', lat: 25.4484, lon: 78.5685 },
  { name: 'Ulhasnagar', state: 'Maharashtra', lat: 19.2215, lon: 73.1643 },
  { name: 'Jammu', state: 'Jammu & Kashmir', lat: 32.7266, lon: 74.8570 },
  { name: 'Sangli', state: 'Maharashtra', lat: 16.8524, lon: 74.5815 },
  { name: 'Mangalore', state: 'Karnataka', lat: 12.9141, lon: 74.8560 },
  { name: 'Belgaum', state: 'Karnataka', lat: 15.8497, lon: 74.4977 },
  { name: 'Tirunelveli', state: 'Tamil Nadu', lat: 8.7139, lon: 77.7567 },
  { name: 'Malegaon', state: 'Maharashtra', lat: 20.3547, lon: 74.5244 },
  { name: 'Gaya', state: 'Bihar', lat: 24.7964, lon: 85.0079 },
  { name: 'Jalgaon', state: 'Maharashtra', lat: 21.0077, lon: 75.5626 },
  { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lon: 73.7125 },
  { name: 'Karur', state: 'Tamil Nadu', lat: 10.9601, lon: 78.0766 },
  { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734 },
  { name: 'Panaji', state: 'Goa', lat: 15.4909, lon: 73.8278 },
  { name: 'Pondicherry', state: 'Puducherry', lat: 11.9416, lon: 79.8083 },
  { name: 'Port Blair', state: 'Andaman and Nicobar', lat: 11.6234, lon: 92.7265 }
];

export const INDIAN_CITIES: IndianCity[] = [
  ...BASE_INDIAN_CITIES,
  ...ROUTING_NODES.filter(node => !BASE_INDIAN_CITIES.some(city => city.name.toLowerCase() === node.name.toLowerCase()))
    .map(node => ({
      name: node.name,
      state: node.isVillage ? 'Maharashtra (Village)' : 'Maharashtra',
      lat: node.lat,
      lon: node.lon
    }))
];

// Haversine formula calculation for distance between coordinates
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Find closest Indian city from arbitrary coordinates
export function findNearestCity(lat: number, lon: number): IndianCity {
  let nearest = INDIAN_CITIES[0];
  let minDistance = Infinity;
  for (const city of INDIAN_CITIES) {
    const dist = getDistanceKm(lat, lon, city.lat, city.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }
  return nearest;
}

// Fetch address details via OpenStreetMap Nominatim with a fail-safe timeout fallback
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const fetchPromise = fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'QuickFix-India-App-Agentic'
      }
    }
  ).then(async (res) => {
    if (!res.ok) throw new Error('OSM geocoding fetch error');
    const data = await res.json();
    
    const addr = data.address;
    if (addr) {
      const parts: string[] = [];
      // Grab local specific tags first
      if (addr.suburb || addr.neighbourhood || addr.locality) {
        parts.push(addr.suburb || addr.neighbourhood || addr.locality);
      } else if (addr.road) {
        parts.push(addr.road);
      }
      
      const cityOrTown = addr.city || addr.town || addr.village || addr.suburb || '';
      if (cityOrTown) {
        parts.push(cityOrTown);
      }
      
      const state = addr.state || '';
      if (state) {
        parts.push(state);
      }
      
      if (parts.length > 0) {
        return `${parts.join(', ')} (GPS)`;
      }
    }
    
    if (data.display_name) {
      const displayParts = data.display_name.split(',');
      return `${displayParts.slice(0, 3).join(',')} (GPS)`;
    }
    
    throw new Error('Address tags missing');
  });

  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error('Nominatim timeout')), 2200)
  );

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.warn('Reverse geocode failed, resolving via offline Haversine database:', error);
    const nearest = findNearestCity(lat, lon);
    return `${nearest.name}, ${nearest.state} (GPS)`;
  }
}

// Core Geolocation Request wrapper
export async function getCurrentGPSLocation(): Promise<{ location: string; lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const resolvedStr = await reverseGeocode(latitude, longitude);
          resolve({ location: resolvedStr, lat: latitude, lon: longitude });
        } catch {
          const nearest = findNearestCity(latitude, longitude);
          resolve({
            location: `${nearest.name}, ${nearest.state} (GPS)`,
            lat: latitude,
            lon: longitude,
          });
        }
      },
      (error) => {
        reject(error);
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  });
}

// Dijkstra Graph Representation
export interface AdjacencyList {
  [nodeName: string]: { [neighbor: string]: number };
}

export interface ShortestPathResult {
  distance: number;
  path: string[];
  formattedPath: string;
  isDirectFallback: boolean;
}

// Build Adjacency List for Dijkstra Solver
export function buildDijkstraGraph(): AdjacencyList {
  const graph: AdjacencyList = {};
  
  // Initialize all nodes from ROUTING_NODES
  for (const node of ROUTING_NODES) {
    graph[node.name] = {};
  }
  
  // Add base edges in both directions (undirected graph)
  for (const edge of BASE_GRAPH_EDGES) {
    if (!graph[edge.from]) graph[edge.from] = {};
    if (!graph[edge.to]) graph[edge.to] = {};
    graph[edge.from][edge.to] = edge.weight;
    graph[edge.to][edge.from] = edge.weight;
  }
  
  return graph;
}

// Parse any custom location string or city and resolve to the closest graph node
export function resolveToGraphNode(address: string): GraphNode {
  if (!address) {
    return ROUTING_NODES.find(n => n.name === 'Dadar') || ROUTING_NODES[0];
  }
  
  const cleanAddr = address.replace(/\(gps\)/ig, '').trim().toLowerCase();
  
  // 1. Try to find a direct name match or substring match in ROUTING_NODES
  // Sort by length desc so we match specific long names first
  const sortedNodes = [...ROUTING_NODES].sort((a, b) => b.name.length - a.name.length);
  for (const node of sortedNodes) {
    const nodeNameClean = node.name.toLowerCase();
    if (cleanAddr.includes(nodeNameClean) || nodeNameClean.includes(cleanAddr)) {
      return node;
    }
  }
  
  // 2. Try to find a substring match in INDIAN_CITIES and map to its nearest ROUTING_NODE
  const sortedCities = [...INDIAN_CITIES].sort((a, b) => b.name.length - a.name.length);
  for (const city of sortedCities) {
    const cityNameClean = city.name.toLowerCase();
    if (cleanAddr.includes(cityNameClean) || cityNameClean.includes(cleanAddr)) {
      let closestNode = ROUTING_NODES[0];
      let minDistance = Infinity;
      for (const node of ROUTING_NODES) {
        const dist = getDistanceKm(city.lat, city.lon, node.lat, node.lon);
        if (dist < minDistance) {
          minDistance = dist;
          closestNode = node;
        }
      }
      return closestNode;
    }
  }
  
  // 3. Fallback: Check if there are lat/lon coordinates inside the string
  const coordsRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
  const match = cleanAddr.match(coordsRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    let closestNode = ROUTING_NODES[0];
    let minDistance = Infinity;
    for (const node of ROUTING_NODES) {
      const dist = getDistanceKm(lat, lon, node.lat, node.lon);
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    }
    return closestNode;
  }
  
  // 4. Default fallback: Dadar (central hub in Mumbai)
  return ROUTING_NODES.find(n => n.name === 'Dadar') || ROUTING_NODES[0];
}

// Calculate the shortest path using Dijkstra's Algorithm
export function dijkstraShortestPath(start: string, end: string): ShortestPathResult {
  const startNode = resolveToGraphNode(start);
  const endNode = resolveToGraphNode(end);
  
  if (startNode.name === endNode.name) {
    return {
      distance: 0,
      path: [startNode.name],
      formattedPath: `${startNode.name} (Local)`,
      isDirectFallback: false
    };
  }
  
  const graph = buildDijkstraGraph();
  
  const distances: { [key: string]: number } = {};
  const previous: { [key: string]: string | null } = {};
  const queue = new Set<string>();
  
  for (const node of ROUTING_NODES) {
    distances[node.name] = Infinity;
    previous[node.name] = null;
    queue.add(node.name);
  }
  
  distances[startNode.name] = 0;
  
  while (queue.size > 0) {
    // Find node with minimum distance in queue
    let minNode: string | null = null;
    let minDistance = Infinity;
    
    for (const nodeName of queue) {
      if (distances[nodeName] < minDistance) {
        minDistance = distances[nodeName];
        minNode = nodeName;
      }
    }
    
    if (minNode === null) {
      break;
    }
    
    if (minNode === endNode.name) {
      break;
    }
    
    queue.delete(minNode);
    
    const neighbors = graph[minNode] || {};
    for (const neighbor in neighbors) {
      if (queue.has(neighbor)) {
        const alt = distances[minNode] + neighbors[neighbor];
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = minNode;
        }
      }
    }
  }
  
  // If destination is unreachable, return a straight line Haversine direct route fallback
  if (distances[endNode.name] === Infinity) {
    const haversineDist = Math.round(getDistanceKm(startNode.lat, startNode.lon, endNode.lat, endNode.lon));
    return {
      distance: haversineDist,
      path: [startNode.name, endNode.name],
      formattedPath: `${startNode.name} ➔ ${endNode.name} (Direct Route, ${haversineDist} km)`,
      isDirectFallback: true
    };
  }
  
  // Reconstruct path
  const path: string[] = [];
  let u: string | null = endNode.name;
  while (u !== null) {
    path.unshift(u);
    u = previous[u];
  }
  
  const totalDistance = distances[endNode.name];
  const formattedPath = `${path.join(' ➔ ')} (${totalDistance} km)`;
  
  return {
    distance: totalDistance,
    path,
    formattedPath,
    isDirectFallback: false
  };
}

