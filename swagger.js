// Importation du middleware swagger-ui-express pour afficher la documentation Swagger
import swaggerUi from "swagger-ui-express";

// Importation de yamljs pour charger un fichier Swagger au format YAML
import YAML from "yamljs";

// Importation du module path pour manipuler les chemins de fichiers
import path from "path";

// Importation de fileURLToPath pour convertir une URL en chemin de fichier
import { fileURLToPath } from "url";

// Conversion de l’URL du fichier courant (ES module) en chemin système
const __filename = fileURLToPath(import.meta.url);

// Récupération du dossier courant à partir du chemin du fichier
const __dirname = path.dirname(__filename);

// Construction du chemin absolu vers le fichier swagger.yaml
const swaggerPath = path.join(__dirname, "docs", "swagger.yaml");

// Chargement du fichier Swagger YAML en objet JavaScript
const swaggerDocument = YAML.load(swaggerPath);

// Fonction qui configure Swagger dans l’application Express
export function setupSwagger(app) {

    // Déclaration de la route /api-docs pour afficher la documentation Swagger
    app.use(
        "/api-docs",          // URL d’accès à la documentation
        swaggerUi.serve,      // Middleware qui sert les fichiers Swagger UI
        swaggerUi.setup(swaggerDocument) // Configuration avec le fichier Swagger chargé
    );
}
