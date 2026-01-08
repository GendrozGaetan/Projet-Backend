
// Importe le framework Express
import express from "express";
// Importe l'objet de connexion à la base de données (pool de connexions)
import pool from "../db/db.js";

// Crée un nouvel objet Router Express pour gérer les routes spécifiques aux 'localities'
const localityRouter = express.Router();

// Définit la route GET pour récupérer toutes les localités (avec filtrage optionnel)

// Importation du framework Express pour créer des routes HTTP
import express from "express";

// Importation du pool de connexion à la base de données MySQL
import pool from "../db/db.js";

// Création d’un routeur Express dédié aux localités
const localityRouter = express.Router();

// Fonction utilitaire pour vérifier qu’un ID est valide
// doit être un nombre, un entier, et strictement supérieur à 0
const isValidId = (id) => !isNaN(id) && Number.isInteger(Number(id)) && Number(id) > 0;

// --- Route GET : récupérer toutes les localités ---

// Définition d’une route GET sur "/" pour récupérer toutes les localités

localityRouter.get('/', async (req, res) => {

    // Début du bloc try pour gérer les erreurs
    try {

        // Exécution d’une requête SQL pour récupérer toutes les localités
        const [rows] = await pool.query("SELECT * FROM locality");

        // Envoi des résultats au client au format JSON
        res.json(rows);

    // Capture des erreurs éventuelles
    } catch (err) {

        // Affichage de l’erreur dans la console serveur
        console.error("Database Error:", err);

        // Réponse HTTP 500 en cas d’erreur serveur
        res.status(500).json({ error: "Erreur serveur lors de la récupération des localités." });
    }
});

// --- Route GET : récupérer une localité par son ID ---

// Définition d’une route GET avec un paramètre dynamique ":id"
localityRouter.get('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis les paramètres de l’URL
        const { id } = req.params;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour d’une erreur 400 si l’ID est invalide
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant de la localité doit être un nombre entier positif (supérieur à 0)." 
            });
        }

        // Requête SQL pour récupérer la localité correspondant à l’ID
        const [rows] = await pool.query(
            "SELECT * FROM locality WHERE idlocality = ?", 
            [id]
        );
        
        // Si aucune localité n’est trouvée
        if (rows.length === 0) {

            // Retour d’une erreur 404
            return res.status(404).json({ 
                error: "Localité non trouvée", 
                message: `Aucune localité n'existe avec l'ID ${id}.` 
            });
        }

        // Envoi de la localité trouvée au client
        res.json(rows[0]);

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur dans la console
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la recherche de la localité." });
    }
});

// --- Route POST : ajouter une nouvelle localité ---

// Définition d’une route POST pour créer une localité
localityRouter.post('/create', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération des données envoyées dans le body de la requête
        const { 
            name, 
            postal_code, 
            postal_comp, 
            toponyme, 
            canton_code, 
            langage_code 
        } = req.body;

        // Vérification que les champs obligatoires sont présents
        if (!name || !postal_code) {

            // Retour d’une erreur 400 si des données sont manquantes
            return res.status(400).json({ 
                error: "Données manquantes", 
                message: "Les champs 'name' et 'postal_code' sont requis." 
            });
        }

        // Requête SQL pour insérer une nouvelle localité
        const sql = `
            INSERT INTO locality 
            (name, postal_code, postal_comp, toponyme, canton_code, langage_code) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Exécution de la requête avec les valeurs fournies
        const [result] = await pool.query(sql, [
            name, 
            postal_code, 
            postal_comp, 
            toponyme, 
            canton_code, 
            langage_code
        ]);
        
        // Réponse HTTP 201 (création réussie)
        res.status(201).json({
            message: `La localité ${name} a été ajoutée avec succès !`,
            locality: { 
                id: result.insertId, 
                name, 
                postal_code, 
                postal_comp, 
                toponyme, 
                canton_code, 
                langage_code 
            }
        });

    // Gestion des erreurs SQL ou serveur
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Échec de la création de la localité." });
    }
});

// --- Route PUT : modifier une localité existante ---

// Définition d’une route PUT pour mettre à jour une localité
localityRouter.put('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis l’URL
        const { id } = req.params;

        // Récupération des nouvelles données depuis le body
        const { 
            name, 
            postal_code, 
            postal_comp, 
            toponyme, 
            canton_code, 
            langage_code 
        } = req.body;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour erreur 400
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Requête SQL de mise à jour de la localité
        const sql = `
            UPDATE locality 
            SET name=?, postal_code=?, postal_comp=?, toponyme=?, canton_code=?, langage_code=? 
            WHERE idlocality=?
        `;

        // Exécution de la requête
        const [result] = await pool.query(sql, [
            name, 
            postal_code, 
            postal_comp, 
            toponyme, 
            canton_code, 
            langage_code, 
            id
        ]);

        // Si aucune ligne n’a été modifiée
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Mise à jour impossible", 
                message: "Cette localité n'existe pas dans la base de données." 
            });
        }

        // Réponse de succès
        res.json({ message: "La localité a été mise à jour avec succès." });

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la modification des données." });
    }
});

// --- Route DELETE : supprimer une localité ---

// Définition d’une route DELETE pour supprimer une localité
localityRouter.delete('/:id', async (req, res) => {

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
            "DELETE FROM locality WHERE idlocality = ?", 
            [id]
        );

        // Si aucune localité n’a été supprimée
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Suppression impossible", 
                message: "Cette localité n'existe pas." 
            });
        }

        // Réponse de succès
        res.json({ message: "La localité a été supprimée avec succès." });

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la suppression." });
    }
});

// Exportation du routeur pour l’utiliser dans l’application principale
export { localityRouter };
