// Importe le framework web Express pour la création du routeur.
import express from "express";
// Importe l'objet 'pool' (connexion pool à la base de données) depuis le fichier db.js.
import pool from "../db/db.js";

// Crée un nouvel objet Router Express pour gérer les routes liées aux services.
const servicesRouter = express.Router();

// Définit la route GET pour récupérer une liste de services, avec possibilité de filtrage par champs spécifiques.
servicesRouter.get('/', async (req, res) => {
    // Début du bloc try-catch pour la gestion des erreurs.
    try {
        // Extrait les paramètres de requête possibles (filtres) de l'URL.
        const { dogs_iddogs, clients_idclients, locality_idlocality, date, zone } = req.query;

        // Initialise la requête SQL de base pour sélectionner toutes les colonnes de la table 'services'.
        let sql = "SELECT * FROM services";
        // Tableau pour stocker les conditions de filtrage de la clause WHERE.
        const conditions = [];
        // Tableau pour stocker les valeurs des paramètres à lier à la requête SQL.
        const values = [];

        // Vérifie si un filtre 'dogs_iddogs' (ID du chien) est présent.
        if (dogs_iddogs) {
            // Ajoute la condition d'égalité pour l'ID du chien.
            conditions.push("dogs_iddogs = ?");
            // Ajoute la valeur de l'ID du chien aux paramètres.
            values.push(dogs_iddogs);
        }
        // Vérifie si un filtre 'clients_idclients' (ID du client) est présent.
        if (clients_idclients) {
            // Ajoute la condition d'égalité pour l'ID du client.
            conditions.push("clients_idclients = ?");
            // Ajoute la valeur de l'ID du client aux paramètres.
            values.push(clients_idclients);
        }
        // Vérifie si un filtre 'locality_idlocality' (ID de la localité) est présent.
        if (locality_idlocality) {
            // Ajoute la condition d'égalité pour l'ID de la localité.
            conditions.push("locality_idlocality = ?");
            // Ajoute la valeur de l'ID de la localité aux paramètres.
            values.push(locality_idlocality);
        }
        // Vérifie si un filtre 'date' est présent.
        if (date) {
            // Ajoute la condition d'égalité pour la date.
            conditions.push("date = ?");
            // Ajoute la valeur de la date aux paramètres.
            values.push(date);
        }
        // Vérifie si un filtre 'zone' est présent.
        if (zone) {
            // Ajoute la condition d'égalité pour la zone.
            conditions.push("zone = ?");
            // Ajoute la valeur de la zone aux paramètres.
            values.push(zone);
        }

        // Vérifie s'il y a des conditions de filtrage à appliquer.
        if (conditions.length > 0) {
            // Ajoute la clause WHERE à la requête SQL, en joignant les conditions avec ' AND '.
            sql += " WHERE " + conditions.join(" AND ");
        }

        // Exécute la requête SQL avec les valeurs (filtres). La réponse est destucturée en [rows].
        const [rows] = await pool.query(sql, values);
        // Envoie la liste des résultats trouvés (rows) en réponse JSON.
        res.json(rows);
    // Capture et gère les erreurs.
    } catch (err) {
        // Affiche l'erreur MySQL détaillée dans la console du serveur.
        console.error("MySQL Error:", err);
        // Envoie une réponse d'erreur 500 (Erreur Serveur) avec un message générique.
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route GET pour récupérer un seul service par son ID.
servicesRouter.get('/:id', async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait l'ID du service des paramètres de l'URL.
        const id = req.params.id;

        // Vérifie si l'ID n'est pas un nombre (validation).
        if (isNaN(id)) {
            // Renvoie une erreur 400 si l'ID est invalide.
            return res.status(400).json({ error: "ID invalide" });
        }

        // Exécute la requête SQL pour trouver le service avec l'ID spécifié.
        const [rows] = await pool.query("SELECT * FROM services WHERE idservices = ?", [id]);

        // Vérifie si aucun résultat n'a été trouvé.
        if (rows.length === 0) {
            // Renvoie une erreur 404 si le service n'est pas trouvé.
            return res.status(404).json({ error: "Service non trouvé" });
        }

        // Envoie le premier élément du tableau de résultats (le service trouvé) en réponse JSON.
        res.json(rows[0]);
    // Capture et gère les erreurs.
    } catch (err) {
        // Affiche l'erreur MySQL dans la console.
        console.error("MySQL Error:", err);
        // Envoie une réponse d'erreur 500.
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route POST pour créer un nouveau service.
servicesRouter.post('/create', async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait les données du nouveau service du corps de la requête (req.body).
        const { date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality } = req.body;

        // Valide que tous les champs obligatoires sont présents.
        if (!date || !zone || !time || !dogs_iddogs || !clients_idclients || !locality_idlocality) {
            // Renvoie une erreur 400 si un champ obligatoire manque.
            return res.status(400).json({ error: "Tous les champs sont obligatoires" });
        }

        // Requête SQL pour insérer une nouvelle entrée dans la table 'services'.
        const sql = `INSERT INTO services (date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        // Exécute la requête d'insertion avec les données fournies.
        const [result] = await pool.query(sql, [date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality]);

        // Envoie une réponse de succès 201 (Créé) avec un message et les détails du service inséré.
        res.status(201).json({
            message: `Le service pour le chien ID ${dogs_iddogs} a bien été ajouté !`,
            service: { id: result.insertId, date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality }
        });
    // Capture et gère les erreurs.
    } catch (err) {
        // Affiche l'erreur MySQL dans la console.
        console.error("MySQL Error:", err);
        // Envoie une réponse d'erreur 500, incluant le message d'erreur de la base de données.
        res.status(500).json({ error: err.message });
    }
});

// Définit la route PUT pour mettre à jour un service existant par son ID.
servicesRouter.put('/:id', async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait l'ID du service des paramètres de l'URL.
        const id = req.params.id;
        // Extrait les nouvelles données de mise à jour du corps de la requête.
        const { date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality } = req.body;

        // Vérifie si l'ID est invalide.
        if (isNaN(id)) {
            // Renvoie une erreur 400 si l'ID est invalide.
            return res.status(400).json({ error: "ID invalide" });
        }

        // Vérifie d'abord si le service existe.
        const [existing] = await pool.query("SELECT * FROM services WHERE idservices = ?", [id]);
        // Si le service n'est pas trouvé.
        if (existing.length === 0) {
            // Renvoie une erreur 404.
            return res.status(404).json({ error: "Service non trouvé" });
        }

        // Requête SQL d'UPDATE avec tous les champs.
        const sql = `UPDATE services 
                     SET date=?, zone=?, time=?, dogs_iddogs=?, clients_idclients=?, locality_idlocality=?
                     WHERE idservices=?`;
        // Exécute la requête de mise à jour.
        await pool.query(sql, [date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality, id]);

        // Envoie une réponse de succès avec un message et les données mises à jour.
        res.json({
            message: "Service mis à jour",
            service: { id, date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality }
        });
    // Capture et gère les erreurs.
    } catch (err) {
        // Affiche l'erreur MySQL dans la console.
        console.error("MySQL Error:", err);
        // Envoie une réponse d'erreur 500.
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// Définit la route DELETE pour supprimer un service par son ID.
servicesRouter.delete('/:id', async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait l'ID du service des paramètres de l'URL.
        const id = req.params.id;

        // Vérifie si l'ID est invalide.
        if (isNaN(id)) {
            // Renvoie une erreur 400.
            return res.status(400).json({ error: "ID invalide" });
        }

        // Exécute la requête SQL de suppression pour l'ID spécifié.
        const [result] = await pool.query("DELETE FROM services WHERE idservices = ?", [id]);
        // Vérifie si aucune ligne n'a été affectée (l'ID n'existe pas).
        if (result.affectedRows === 0) {
            // Renvoie une erreur 404.
            return res.status(404).json({ error: "Service non trouvé" });
        }

        // Envoie une réponse de succès avec un message de confirmation.
        res.json({ message: "Service supprimé" });
    // Capture et gère les erreurs.
    } catch (err) {
        // Affiche l'erreur MySQL dans la console.
        console.error("MySQL Error:", err);
        // Envoie une réponse d'erreur 500.
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exporte le routeur pour qu'il puisse être utilisé par l'application Express principale.
export { servicesRouter };