const { MongoClient } = require('mongodb');
const axios = require('axios');
const express = require('express');
const app = express();

// Variables d'environnement (à configurer dans Render)
const MONGODB_URI = process.env.MONGODB_URI;
const API_KEY = process.env.WEATHER_API_KEY || "2b5868c487e0446c8be202559252402";
const LOCATION = process.env.LOCATION || "Benguerir";
const COLLECTION_INTERVAL_MINUTES = parseInt(process.env.COLLECTION_INTERVAL_MINUTES || "60");

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/ping') {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Weather Collector is running\n');
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not Found\n');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});

// Fonction pour récupérer et stocker les données météo
async function storeWeatherData() {
  try {
    console.log(`Récupération des données météo pour ${LOCATION} à ${new Date().toISOString()}`);
    
    // Récupérer les données depuis WeatherAPI.com
    const response = await axios.get('http://api.weatherapi.com/v1/current.json', {
      params: {
        key: API_KEY,
        q: LOCATION,
        aqi: 'yes'
      }
    });
    
    // Formater les données pour le stockage
    const weatherData = {
      location: {
        name: response.data.location.name,
        region: response.data.location.region,
        country: response.data.location.country,
        coordinates: {
          latitude: response.data.location.lat,
          longitude: response.data.location.lon
        },
        timezone: response.data.location.tz_id,
        localtime: new Date(response.data.location.localtime)
      },
      weather: {
        timestamp: new Date(response.data.current.last_updated),
        temperature: {
          celsius: response.data.current.temp_c,
          fahrenheit: response.data.current.temp_f,
          feelslike_c: response.data.current.feelslike_c,
          feelslike_f: response.data.current.feelslike_f
        },
        condition: {
          text: response.data.current.condition.text,
          icon: response.data.current.condition.icon,
          code: response.data.current.condition.code
        },
        wind: {
          speed_kph: response.data.current.wind_kph,
          speed_mph: response.data.current.wind_mph,
          degree: response.data.current.wind_degree,
          direction: response.data.current.wind_dir,
          gust_kph: response.data.current.gust_kph,
          gust_mph: response.data.current.gust_mph
        },
        precipitation: {
          mm: response.data.current.precip_mm,
          inches: response.data.current.precip_in
        },
        atmosphere: {
          humidity: response.data.current.humidity,
          cloud_cover: response.data.current.cloud,
          pressure_mb: response.data.current.pressure_mb,
          pressure_in: response.data.current.pressure_in,
          visibility_km: response.data.current.vis_km,
          visibility_miles: response.data.current.vis_miles,
          uv_index: response.data.current.uv,
          dewpoint_c: response.data.current.dewpoint_c,
          dewpoint_f: response.data.current.dewpoint_f
        },
        air_quality: {
          co: response.data.current.air_quality.co,
          no2: response.data.current.air_quality.no2,
          o3: response.data.current.air_quality.o3,
          so2: response.data.current.air_quality.so2,
          pm2_5: response.data.current.air_quality.pm2_5,
          pm10: response.data.current.air_quality.pm10,
          us_epa_index: response.data.current.air_quality["us-epa-index"],
          gb_defra_index: response.data.current.air_quality["gb-defra-index"]
        },
        is_day: response.data.current.is_day === 1
      },
      metadata: {
        collection_time: new Date(),
        source: "WeatherAPI.com",
        api_version: "v1"
      }
    };

    // Connexion à MongoDB Atlas et stockage des données
    const client = new MongoClient(MONGODB_URI);
    try {
      await client.connect();
      const database = client.db('meteo_db');
      const collection = database.collection('benguerir_weather');
      
      // Insérer les données
      const result = await collection.insertOne(weatherData);
      console.log(`Données météo stockées avec l'ID: ${result.insertedId}`);
      console.log(`Température: ${weatherData.weather.temperature.celsius}°C, Condition: ${weatherData.weather.condition.text}`);
      
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error("Erreur lors de la récupération ou du stockage des données météo:", error);
  }
}

// Fonction principale pour exécuter la collecte périodiquement
async function main() {
  console.log(`Service de collecte météo démarré pour ${LOCATION}`);
  console.log(`Intervalle de collecte: ${COLLECTION_INTERVAL_MINUTES} minutes`);
  
  // Première exécution immédiate
  await storeWeatherData();
  
  // Planifier les exécutions suivantes
  setInterval(storeWeatherData, COLLECTION_INTERVAL_MINUTES * 60 * 1000);
}

// Démarrer le service
main().catch(console.error);
