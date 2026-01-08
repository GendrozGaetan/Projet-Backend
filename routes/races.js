// Importation du framework Express pour créer des routes HTTP
import express from "express";

// Importation du pool de connexion à la base de données MySQL
import pool from "../db/db.js";

// Création d’un routeur Express dédié aux races
const racesRouter = express.Router();

/**
 * HELPER: isValidId
 * Vérifie que l’ID est :
 * - un nombre
 * - un entier
 * - strictement supérieur à 0
 */
const isValidId = (id) => !isNaN(id) && Number.isInteger(Number(id)) && Number(id) > 0;

// --- Route GET : récupérer toutes les races ---

// Définition d’une route GET sur "/" pour récupérer toutes les races
racesRouter.get('/', async (req, res) => {

    // Début du bloc try pour gérer les erreurs
    try {

        // Exécution d’une requête SQL pour récupérer toutes les races
        const [rows] = await pool.query("SELECT * FROM races");

        // Envoi des résultats au client au format JSON
        res.json(rows);

    // Capture des erreurs éventuelles
    } catch (err) {

        // Affichage de l’erreur dans la console serveur
        console.error("Database Error:", err);

        // Réponse HTTP 500 en cas d’erreur serveur
        res.status(500).json({ error: "Erreur serveur lors de la récupération des races." });
    }
});

// --- Route GET : récupérer une race par son ID ---

// Définition d’une route GET avec un paramètre dynamique ":id"
racesRouter.get('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis les paramètres de l’URL
        const { id } = req.params;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour d’une erreur 400 si l’ID est invalide
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant de la race doit être un nombre entier positif (supérieur à 0)." 
            });
        }

        // Requête SQL pour récupérer la race correspondant à l’ID
        const [rows] = await pool.query(
            "SELECT * FROM races WHERE idraces = ?", 
            [id]
        );
        
        // Si aucune race n’est trouvée
        if (rows.length === 0) {

            // Retour d’une erreur 404
            return res.status(404).json({ 
                error: "Race non trouvée", 
                message: `Aucune race n'existe avec l'ID ${id}.` 
            });
        }

        // Envoi de la race trouvée au client
        res.json(rows[0]);

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur dans la console
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la recherche de la race." });
    }
});

// --- Route POST : ajouter une nouvelle race ---

// Définition d’une route POST pour créer une race
racesRouter.post('/create', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération des données envoyées dans le body de la requête
        const { 
            name, 
            category, 
            morphology, 
            classification, 
            min_size_m, 
            max_size_m, 
            min_size_f, 
            max_size_f, 
            min_weight_m, 
            max_weight_m, 
            min_weight_f, 
            max_weight_f, 
            years 
        } = req.body;

        // Vérification que le nom est présent
        if (!name) {

            // Retour d’une erreur 400 si le champ name est manquant
            return res.status(400).json({ 
                error: "Données manquantes", 
                message: "Le champ 'name' est obligatoire." 
            });
        }

        // Requête SQL pour insérer une nouvelle race
        const sql = `
            INSERT INTO races 
            (name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Exécution de la requête avec les valeurs fournies
        const [result] = await pool.query(sql, [
            name, 
            category, 
            morphology, 
            classification, 
            min_size_m, 
            max_size_m, 
            min_size_f, 
            max_size_f, 
            min_weight_m, 
            max_weight_m, 
            min_weight_f, 
            max_weight_f, 
            years
        ]);
        
        // Réponse HTTP 201 (création réussie)
        res.status(201).json({
            message: `La race ${name} a été ajoutée avec succès !`,
            race: { 
                id: result.insertId, 
                name, 
                category, 
                morphology, 
                classification, 
                min_size_m, 
                max_size_m, 
                min_size_f, 
                max_size_f, 
                min_weight_m, 
                max_weight_m, 
                min_weight_f, 
                max_weight_f, 
                years 
            }
        });

    // Gestion des erreurs serveur ou SQL
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Échec de la création de la race." });
    }
});

// --- Route PUT : modifier une race existante ---

// Définition d’une route PUT pour mettre à jour une race
racesRouter.put('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis l’URL
        const { id } = req.params;

        // Récupération des nouvelles données depuis le body
        const { 
            name, 
            category, 
            morphology, 
            classification, 
            min_size_m, 
            max_size_m, 
            min_size_f, 
            max_size_f, 
            min_weight_m, 
            max_weight_m, 
            min_weight_f, 
            max_weight_f, 
            years 
        } = req.body;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour erreur 400
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Requête SQL de mise à jour de la race
        const sql = `
            UPDATE races 
            SET name=?, category=?, morphology=?, classification=?, min_size_m=?, max_size_m=?, min_size_f=?, max_size_f=?, min_weight_m=?, max_weight_m=?, min_weight_f=?, max_weight_f=?, years=? 
            WHERE idraces=?
        `;

        // Exécution de la requête
        const [result] = await pool.query(sql, [
            name, 
            category, 
            morphology, 
            classification, 
            min_size_m, 
            max_size_m, 
            min_size_f, 
            max_size_f, 
            min_weight_m, 
            max_weight_m, 
            min_weight_f, 
            max_weight_f, 
            years, 
            id
        ]);

        // Si aucune ligne n’a été modifiée
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Mise à jour impossible", 
                message: "Cette race n'existe pas dans la base de données." 
            });
        }

        // Réponse de succès
        res.json({ message: "La race a été mise à jour avec succès." });

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la modification des données." });
    }
});

// --- Route DELETE : supprimer une race ---

// Définition d’une route DELETE pour supprimer une race
racesRouter.delete('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis l’URL
        const { id } = req.params;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour erreur 400
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Requête SQL de suppression
        const [result] = await pool.query(
            "DELETE FROM races WHERE idraces = ?", 
            [id]
        );

        // Si aucune race n’a été supprimée
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Suppression impossible", 
                message: "Cette race n'existe pas." 
            });
        }

        // Réponse de succès
        res.json({ message: "La race a été supprimée avec succès." });

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la suppression." });
    }
});

// Exportation du routeur pour l’utiliser dans le fichier principal de l’application
export { racesRouter };
