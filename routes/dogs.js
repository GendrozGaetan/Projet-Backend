// Importation du framework Express pour créer des routes HTTP
import express from "express";

// Importation du pool de connexion à la base de données MySQL
import pool from "../db/db.js";

// Création d’un routeur Express dédié aux chiens
const dogsRouter = express.Router();

/**
 * HELPER: isValidId
 * Vérifie que l’ID est :
 * - un nombre
 * - un entier
 * - strictement supérieur à 0
 */
const isValidId = (id) => !isNaN(id) && Number.isInteger(Number(id)) && Number(id) > 0;

// --- Route GET : récupérer tous les chiens ---

// Définition d’une route GET sur "/" pour récupérer tous les chiens
dogsRouter.get('/', async (req, res) => {

    // Début du bloc try pour gérer les erreurs
    try {

        // Exécution d’une requête SQL pour récupérer tous les chiens
        const [rows] = await pool.query("SELECT * FROM dogs");

        // Envoi des résultats au client au format JSON
        res.json(rows);

    // Capture des erreurs éventuelles
    } catch (err) {

        // Affichage de l’erreur dans la console serveur
        console.error("Database Error:", err);

        // Réponse HTTP 500 en cas d’erreur serveur
        res.status(500).json({ error: "Erreur serveur lors de la récupération des chiens." });
    }
});

// --- Route GET : récupérer un chien par son ID ---

// Définition d’une route GET avec un paramètre dynamique ":id"
dogsRouter.get('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis les paramètres de l’URL
        const { id } = req.params;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour d’une erreur 400 si l’ID est invalide
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant du chien doit être un nombre entier positif (supérieur à 0)." 
            });
        }

        // Requête SQL pour récupérer le chien correspondant à l’ID
        const [rows] = await pool.query(
            "SELECT * FROM dogs WHERE iddogs = ?", 
            [id]
        );
        
        // Si aucun chien n’est trouvé
        if (rows.length === 0) {

            // Retour d’une erreur 404
            return res.status(404).json({ 
                error: "Chien non trouvé", 
                message: `Aucun chien n'existe avec l'ID ${id}.` 
            });
        }

        // Envoi du chien trouvé au client
        res.json(rows[0]);

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur dans la console
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la recherche du chien." });
    }
});

// --- Route POST : ajouter un nouveau chien ---

// Définition d’une route POST pour créer un chien
dogsRouter.post('/create', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération des données envoyées dans le body de la requête
        const { 
            first_name, 
            gender, 
            sterilized, 
            birth_date, 
            envy 
        } = req.body;

        // Vérification que les champs obligatoires sont présents
        if (!first_name || !gender) {

            // Retour d’une erreur 400 si des données sont manquantes
            return res.status(400).json({ 
                error: "Données manquantes", 
                message: "Les champs 'first_name' et 'gender' sont requis." 
            });
        }

        // Requête SQL pour insérer un nouveau chien
        const sql = `
            INSERT INTO dogs 
            (first_name, gender, sterilized, birth_date, envy) 
            VALUES (?, ?, ?, ?, ?)
        `;

        // Exécution de la requête avec les valeurs fournies
        const [result] = await pool.query(sql, [
            first_name, 
            gender, 
            sterilized, 
            birth_date, 
            envy
        ]);
        
        // Réponse HTTP 201 (création réussie)
        res.status(201).json({
            message: `Le chien ${first_name} a été ajouté avec succès !`,
            dog: { 
                id: result.insertId, 
                first_name, 
                gender, 
                sterilized, 
                birth_date, 
                envy 
            }
        });

    // Gestion des erreurs SQL ou serveur
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Échec de la création du chien." });
    }
});

// --- Route PUT : modifier un chien existant ---

// Définition d’une route PUT pour mettre à jour un chien
dogsRouter.put('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis l’URL
        const { id } = req.params;

        // Récupération des nouvelles données depuis le body
        const { 
            first_name, 
            gender, 
            sterilized, 
            birth_date, 
            envy 
        } = req.body;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour erreur 400
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Requête SQL de mise à jour du chien
        const sql = `
            UPDATE dogs 
            SET first_name=?, gender=?, sterilized=?, birth_date=?, envy=? 
            WHERE iddogs=?
        `;

        // Exécution de la requête
        const [result] = await pool.query(sql, [
            first_name, 
            gender, 
            sterilized, 
            birth_date, 
            envy, 
            id
        ]);

        // Si aucun chien n’a été modifié
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Mise à jour impossible", 
                message: "Ce chien n'existe pas dans la base de données." 
            });
        }

        // Réponse de succès
        res.json({ message: "Les informations du chien ont été mises à jour." });

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la modification des données." });
    }
});

// --- Route DELETE : supprimer un chien ---

// Définition d’une route DELETE pour supprimer un chien
dogsRouter.delete('/:id', async (req, res) => {

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
            "DELETE FROM dogs WHERE iddogs = ?", 
            [id]
        );

        // Si aucun chien n’a été supprimé
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Suppression impossible", 
                message: "Ce chien n'existe pas." 
            });
        }

        // Réponse de succès
        res.json({ message: "Le chien a été supprimé avec succès." });

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la suppression." });
    }
});

// Exportation du routeur pour l’utiliser dans l’application principale
export { dogsRouter };
