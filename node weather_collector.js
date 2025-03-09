const express = require('express');
const axios = require('axios');

// Variables d'environnement
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.WEATHER_API_KEY || "2b5868c487e0446c8be202559252402";
const LOCATION = process.env.LOCATION || "Benguerir";
const COLLECTION_INTERVAL_MINUTES = parseInt(process.env.COLLECTION_INTERVAL_MINUTES || "60");
const MONGODB_URI = process.env.MONGODB_URI;

// Créer l'application Express
const app = express();

// Route de base pour vérifier que le service fonctionne
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'Weather Data Collector',
    location: LOCATION,
    collectionInterval: `${COLLECTION_INTERVAL_MINUTES} minutes`
  });
});

// Route pour déclencher manuellement une collecte
app.get('/collect', async (req, res) => {
  try {
    await storeWeatherData();
    res.json({ success: true, message: 'Weather data collection triggered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
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
      // ... votre structure de données existante
    };

    // Connexion à MongoDB Atlas et stockage des données
    // ... votre code de stockage existant

    return { success: true, data: weatherData };
  } catch (error) {
    console.error("Erreur lors de la récupération ou du stockage des données météo:", error);
    throw error;
  }
}

// Fonction principale pour exécuter la collecte périodiquement
function startPeriodicCollection() {
  console.log(`Service de collecte météo démarré pour ${LOCATION}`);
  console.log(`Intervalle de collecte: ${COLLECTION_INTERVAL_MINUTES} minutes`);
  
  // Première exécution immédiate
  storeWeatherData().catch(console.error);
  
  // Planifier les exécutions suivantes
  setInterval(() => {
    storeWeatherData().catch(console.error);
  }, COLLECTION_INTERVAL_MINUTES * 60 * 1000);
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  // Démarrer la collecte périodique
  startPeriodicCollection();
});
