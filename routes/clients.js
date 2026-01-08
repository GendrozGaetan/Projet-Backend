// Importation du framework Express pour créer des routes HTTP
import express from "express";

// Importation du pool de connexion à la base de données MySQL
import pool from "../db/db.js";

// Création d’un routeur Express dédié aux clients
const clientsRouter = express.Router();

/**
 * HELPER: isValidId
 * Vérifie que l’ID est :
 * 1. Un nombre
 * 2. Un entier (sans décimales)
 * 3. Positif (strictement supérieur à 0)
 */
const isValidId = (id) => !isNaN(id) && Number.isInteger(Number(id)) && Number(id) > 0;

// --- Route GET : récupérer tous les clients ---

// Définition d’une route GET sur "/" pour récupérer tous les clients
clientsRouter.get('/', async (req, res) => {

    // Début du bloc try pour gérer les erreurs
    try {

        // Exécution d’une requête SQL pour récupérer tous les clients
        const [rows] = await pool.query("SELECT * FROM clients");

        // Envoi des résultats au client au format JSON
        res.json(rows);

    // Capture des erreurs éventuelles
    } catch (err) {

        // Affichage de l’erreur dans la console serveur
        console.error("Database Error:", err);

        // Réponse HTTP 500 en cas d’erreur serveur
        res.status(500).json({ error: "Erreur serveur lors de la récupération des clients" });
    }
});

// --- Route GET : récupérer un client par son ID ---

// Définition d’une route GET avec un paramètre dynamique ":id"
clientsRouter.get('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis les paramètres de l’URL
        const { id } = req.params;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour d’une erreur 400 si l’ID est invalide
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif (supérieur à 0)." 
            });
        }

        // Requête SQL pour récupérer le client correspondant à l’ID
        const [rows] = await pool.query(
            "SELECT * FROM clients WHERE idclients = ?", 
            [id]
        );

        // Si aucun client n’est trouvé
        if (rows.length === 0) {

            // Retour d’une erreur 404
            return res.status(404).json({ 
                error: "Client non trouvé", 
                message: `Aucun client avec l'ID ${id}.` 
            });
        }

        // Envoi du client trouvé au client
        res.json(rows[0]);

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur dans la console
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route POST : ajouter un nouveau client 

// Définition d’une route POST pour créer un client
clientsRouter.post('/create', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération des données envoyées dans le body de la requête
        const { 
            last_name, 
            first_name, 
            gender, 
            mail, 
            phone, 
            adress, 
            locality_idlocality 
        } = req.body;

        // Vérification que les champs obligatoires sont présents
        if (!last_name || !first_name || !mail) {

            // Retour d’une erreur 400 si des données sont manquantes
            return res.status(400).json({ 
                error: "Données manquantes", 
                message: "Le nom, le prénom et l'email sont obligatoires." 
            });
        }

        // Requête SQL pour insérer un nouveau client
        const sql = `
            INSERT INTO clients 
            (last_name, first_name, gender, mail, phone, adress, locality_idlocality) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        // Exécution de la requête avec les valeurs fournies
        const [result] = await pool.query(sql, [
            last_name, 
            first_name, 
            gender, 
            mail, 
            phone, 
            adress, 
            locality_idlocality
        ]);
        
        // Réponse HTTP 201 (création réussie)
        res.status(201).json({
            message: "Client créé avec succès !",
            client: { 
                id: result.insertId, 
                last_name, 
                first_name, 
                gender, 
                mail, 
                phone, 
                adress, 
                locality_idlocality 
            }
        });

    // Gestion des erreurs SQL ou serveur
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la création du client" });
    }
});

// --- Route PUT : modifier un client existant ---

// Définition d’une route PUT pour mettre à jour un client
clientsRouter.put('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis l’URL
        const { id } = req.params;

        // Récupération des nouvelles données depuis le body
        const { 
            last_name, 
            first_name, 
            gender, 
            mail, 
            phone, 
            adress, 
            locality_idlocality 
        } = req.body;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour erreur 400
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Requête SQL de mise à jour du client
        const sql = `
            UPDATE clients 
            SET last_name=?, first_name=?, gender=?, mail=?, phone=?, adress=?, locality_idlocality=? 
            WHERE idclients=?
        `;

        // Exécution de la requête
        const [result] = await pool.query(sql, [
            last_name, 
            first_name, 
            gender, 
            mail, 
            phone, 
            adress, 
            locality_idlocality, 
            id
        ]);

        // Si aucun client n’a été modifié
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Mise à jour impossible", 
                message: "Ce client n'existe pas." 
            });
        }

        // Réponse de succès
        res.json({ message: "Client mis à jour avec succès" });

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la modification" });
    }
});

// --- Route DELETE : supprimer un client ---

// Définition d’une route DELETE pour supprimer un client
clientsRouter.delete('/:id', async (req, res) => {

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
            "DELETE FROM clients WHERE idclients = ?", 
            [id]
        );

        // Si aucun client n’a été supprimé
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Suppression impossible", 
                message: "Ce client n'existe pas." 
            });
        }

        // Réponse de succès
        res.json({ message: "Client supprimé avec succès" });

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la suppression" });
    }
});

// Exportation du routeur pour l’utiliser dans l’application principale
export { clientsRouter };
