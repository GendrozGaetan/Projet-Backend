// Importe le framework Express pour créer le routeur
import express from "express";
// Importe l'objet de connexion à la base de données (pool de connexions) depuis son chemin
import pool from "../db/db.js";

// Crée un nouvel objet Router Express pour gérer les routes spécifiques aux 'races'
const racesRouter = express.Router();

// Définit la route GET pour récupérer toutes les races (avec filtrage optionnel)
racesRouter.get('/', async (req, res) => {
    // Début du bloc try-catch pour la gestion des erreurs asynchrones
    try {
        // Extrait les paramètres de requête (query) pour le filtrage
        const { category, classification, name } = req.query;
        // Initialise la requête SQL de base pour sélectionner toutes les colonnes de la table 'races'
        let sql = "SELECT * FROM races";
        // Tableau pour stocker les valeurs des paramètres à lier à la requête SQL (pour éviter l'injection SQL)
        const params = [];
        // Tableau pour stocker les clauses de condition (WHERE)
        const conditions = [];

        // Vérifie si le paramètre 'category' est présent dans la requête
        if (category) {
            // Ajoute une condition pour filtrer par catégorie
            conditions.push("category = ?");
            // Ajoute la valeur du paramètre au tableau de params
            params.push(category);
        }
        // Vérifie si le paramètre 'classification' est présent dans la requête
        if (classification) {
            // Ajoute une condition pour filtrer par classification
            conditions.push("classification = ?");
            // Ajoute la valeur du paramètre au tableau de params
            params.push(classification);
        }
        // Vérifie si le paramètre 'name' est présent dans la requête
        if (name) {
            // Ajoute une condition pour filtrer par nom (utilisation de LIKE pour une recherche partielle)
            conditions.push("name LIKE ?");
            // Ajoute la valeur du paramètre, encadrée de '%' pour la recherche partielle
            params.push(`%${name}%`);
        }

        // Vérifie s'il y a des conditions de filtrage
        if (conditions.length > 0) {
            // Ajoute la clause WHERE à la requête SQL, en joignant les conditions avec ' AND '
            sql += " WHERE " + conditions.join(" AND ");
        }

        // Exécute la requête SQL dans la base de données de manière asynchrone
        // Utilisation de la déstructuration pour obtenir le tableau de résultats (rows)
        const [rows] = await pool.query(sql, params);
        // Renvoie les résultats (les lignes récupérées) au format JSON
        res.json(rows);
    // Capture toute erreur survenue dans le bloc try
    } catch (err) {
        // Affiche l'erreur MySQL dans la console du serveur
        console.error("MySQL Error:", err);
        // Renvoie une réponse d'erreur HTTP 500 (Erreur Serveur)
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route GET pour récupérer une race par son ID
racesRouter.get('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID de la race des paramètres de l'URL
        const id = req.params.id;
        // Vérifie si l'ID n'est pas un nombre (validation basique)
        if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

        // Exécute la requête SQL pour sélectionner la race par son ID (`idraces`)
        const [rows] = await pool.query("SELECT * FROM races WHERE idraces = ?", [id]);
        // Vérifie si aucune race n'a été trouvée (le tableau est vide)
        if (rows.length === 0) return res.status(404).json({ error: "Race non trouvée" });

        // Renvoie la première (et unique) ligne trouvée au format JSON
        res.json(rows[0]);
    // Capture toute erreur survenue
    } catch (err) {
        // Affiche l'erreur MySQL dans la console du serveur
        console.error("MySQL Error:", err);
        // Renvoie une réponse d'erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route POST pour créer une nouvelle race
racesRouter.post('/create', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait les données de la nouvelle race du corps de la requête (req.body)
        const { 
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years 
        } = req.body;

        // Validation : vérifie que les champs obligatoires sont présents
        if (!name || !category || !morphology || !classification) {
            // Renvoie une erreur HTTP 400 si un champ obligatoire manque
            return res.status(400).json({ error: "Les champs name, category, morphology et classification sont obligatoires" });
        }

        // Définit la requête SQL d'insertion avec des placeholders '?'
        const sql = `INSERT INTO races 
            (name, category, morphology, classification, 
             min_size_m, max_size_m, min_size_f, max_size_f, 
             min_weight_m, max_weight_m, min_weight_f, max_weight_f, years) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        // Exécute la requête SQL avec le tableau de valeurs correspondant aux placeholders
        // `result` contient des infos comme l'ID inséré
        const [result] = await pool.query(sql, [
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years
        ]);

        // Renvoie une réponse HTTP 201 (Created) avec un message de succès et les données de la race créée
        res.status(201).json({
            message: `La race ${name} a bien été ajoutée !`,
            race: {
                // Ajoute l'ID généré par la base de données
                id: result.insertId, name, category, morphology, classification,
                min_size_m, max_size_m, min_size_f, max_size_f,
                min_weight_m, max_weight_m, min_weight_f, max_weight_f, years
            }
        });
    // Capture toute erreur survenue
    } catch (err) {
        // Affiche l'erreur MySQL dans la console du serveur
        console.error("MySQL Error:", err);
        // Renvoie une réponse d'erreur HTTP 500 avec le message d'erreur spécifique
        res.status(500).json({ error: err.message });
    }
});

// Définit la route PUT pour mettre à jour une race par son ID
racesRouter.put('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID de la race des paramètres de l'URL
        const id = req.params.id;
        // Extrait les données de mise à jour du corps de la requête
        const { 
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years 
        } = req.body;

        // Vérifie d'abord si la race existe (SELECT)
        const [existing] = await pool.query("SELECT * FROM races WHERE idraces = ?", [id]);
        // Si aucune race n'est trouvée, renvoie une erreur HTTP 404
        if (existing.length === 0) return res.status(404).json({ error: "Race non trouvée" });

        // Définit la requête SQL de mise à jour (UPDATE) avec tous les champs
        const sql = `UPDATE races SET 
            name=?, category=?, morphology=?, classification=?,
            min_size_m=?, max_size_m=?, min_size_f=?, max_size_f=?,
            min_weight_m=?, max_weight_m=?, min_weight_f=?, max_weight_f=?, years=?
            WHERE idraces=?`;

        // Exécute la requête SQL de mise à jour avec le tableau de valeurs
        await pool.query(sql, [
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years, id // L'ID est le dernier paramètre pour la clause WHERE
        ]);

        // Renvoie une réponse JSON de succès avec les données mises à jour
        res.json({ 
            message: "Race mise à jour", 
            race: { id, name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years } 
        });
    // Capture toute erreur survenue
    } catch (err) {
        // Affiche l'erreur MySQL dans la console du serveur
        console.error("MySQL Error:", err);
        // Renvoie une réponse d'erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route DELETE pour supprimer une race par son ID
racesRouter.delete('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID de la race des paramètres de l'URL
        const id = req.params.id;

        // Exécute la requête SQL de suppression (DELETE)
        const [result] = await pool.query("DELETE FROM races WHERE idraces = ?", [id]);
        // Vérifie si aucune ligne n'a été affectée (Race non trouvée)
        if (result.affectedRows === 0) return res.status(404).json({ error: "Race non trouvée" });

        // Renvoie une réponse JSON de succès
        res.json({ message: "Race supprimée" });
    // Capture toute erreur survenue
    } catch (err) {
        // Affiche l'erreur MySQL dans la console du serveur
        console.error("MySQL Error:", err);
        // Renvoie une réponse d'erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exporte le routeur pour qu'il puisse être utilisé dans l'application Express principale
export { racesRouter };