// Importe le framework web Express pour initialiser l'application.
import express from "express";

// Importe le routeur spécifique pour la gestion des chiens (dogs).
import { dogsRouter } from "./routes/dogs.js";
// Importe le routeur spécifique pour la gestion des clients.
import { clientsRouter } from "./routes/clients.js";
// Importe le routeur spécifique pour la gestion des localités (locality).
import { localityRouter } from "./routes/locality.js";
// Importe le routeur spécifique pour la gestion des races de chiens (races).
import { racesRouter } from "./routes/races.js";
// Importe le routeur spécifique pour la gestion des services.
import { servicesRouter } from "./routes/services.js";
// Importe le routeur spécifique pour la gestion des liens Race ↔ Chien (races_has_dogs).
import { racesDogsRouter } from "./routes/races_dogs.js"; 
// Importe le routeur spécifique pour la gestion des maladies (diseases).
import { diseasesRouter } from "./routes/diseases.js";

// Initialise l'application Express.
const app = express();
// Définit le port d'écoute : utilise la variable d'environnement PORT, ou 3003 par défaut.
const port = process.env.PORT || 3003;

// Middleware pour parser le JSON
// Configure Express pour analyser le corps des requêtes entrantes au format JSON.
app.use(express.json());

// Route de base pour tester le serveur
// Définit une route GET simple à la racine (/).
app.get("/", (req, res) => {
  // Envoie une réponse textuelle pour confirmer que l'API est en ligne.
  res.send("API Cynoclient est en ligne !");
});

// Monte les routeurs sur leurs chemins respectifs
// Associe le routeur des chiens au chemin de base /api/dogs.
app.use("/api/dogs", dogsRouter);
// Associe le routeur des clients au chemin de base /api/clients.
app.use("/api/clients", clientsRouter);
// Associe le routeur des localités au chemin de base /api/locality.
app.use("/api/locality", localityRouter);
// Associe le routeur des races au chemin de base /api/races.
app.use("/api/races", racesRouter);
// Associe le routeur des services au chemin de base /api/services.
app.use("/api/services", servicesRouter);
// Associe le routeur des liens race ↔ chien au chemin de base /api/races-dogs.
app.use("/api/races_dogs", racesDogsRouter); 
// Associe le routeur des maladies au chemin de base /api/diseases.
app.use("/api/diseases", diseasesRouter)

// Démarrage du serveur
// Lance le serveur Express et le met en écoute sur le port spécifié.
app.listen(port, () => {
  // Affiche un message de confirmation dans la console lorsque le serveur est démarré.
  console.log(`Server listening on http://localhost:${port}`);
});