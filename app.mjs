import express from "express";

// Import des routeurs
import { dogsRouter } from "./routes/dogs.js";
import { clientsRouter } from "./routes/clients.js";
import { localityRouter } from "./routes/locality.js";
import { racesRouter } from "./routes/races.js";
import { servicesRouter } from "./routes/services.js";

const app = express();
const port = process.env.PORT || 3003;

// Middleware pour parser le JSON
app.use(express.json());

// Route de base pour tester le serveur
app.get("/", (req, res) => {
  res.send("API Cynoclient est en ligne !");
});

// Monte les routeurs sur leurs chemins respectifs
app.use("/api/dogs", dogsRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/locality", localityRouter);
app.use("/api/races", racesRouter);
app.use("/api/services", servicesRouter);

// --- ADDED: 404 CATCH-ALL ---
// This handles any URL that doesn't exist
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route introuvable",
    message: `L'URL '${req.originalUrl}' n'existe pas. Vérifiez l'orthographe ou la méthode HTTP.`
  });
});

// --- ADDED: GLOBAL ERROR HANDLER ---
// This handles internal code crashes (500 errors) in JSON format
app.use((err, req, res, next) => {
  console.error(err.stack); // Logs the error in your terminal
  res.status(500).json({
    success: false,
    error: "Erreur Serveur",
    message: err.message || "Une erreur interne est survenue."
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});