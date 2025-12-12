// Importe le framework Express pour créer le routeur
import express from "express";
// Importe l'objet de connexion à la base de données (pool de connexions)
import pool from "../db/db.js";

// Crée un nouvel objet Router Express pour gérer les routes spécifiques aux 'clients'
const clientsRouter = express.Router();

clientsRouter.get('/', async (req, res) => {
    try {
        const { id, last_name, first_name,adress, mail, gender, phone, locality_idlocality } = req.query;

        const conditions = [];
        const params = [];

        // --- Validation des paramètres numériques ---
        if (id !== undefined) {
            if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
                return res.status(400).json({ error: "Invalid 'id': must be a positive integer" });
            }
            conditions.push("idclients = ?");
            params.push(id);
        }

        if (locality_idlocality !== undefined) {
            if (!Number.isInteger(Number(locality_idlocality)) || Number(locality_idlocality) <= 0) {
                return res.status(400).json({ error: "Invalid 'locality_idlocality': must be a positive integer" });
            }
            conditions.push("locality_idlocality = ?");
            params.push(locality_idlocality);
        }

        // --- Validation des paramètres texte ---
        if (last_name !== undefined) {
            conditions.push("last_name LIKE ?");
            params.push(`%${last_name}%`);
        }
        if (first_name !== undefined) {
            conditions.push("first_name LIKE ?");
            params.push(`%${first_name}%`);
        }
        if (mail !== undefined) {
            conditions.push("mail LIKE ?");
            params.push(`%${mail}%`);
        }
        if (gender !== undefined) {
            conditions.push("gender = ?");
            params.push(gender);
        }
        if (phone !== undefined) {
            conditions.push("phone LIKE ?");
            params.push(`${phone}%`);
        }
        if (adress !== undefined) {
            conditions.push("adress LIKE ?");
            params.push(`${adress}%`)
        }

        // --- Construction de la requête SQL ---
        let sql = "SELECT * FROM clients";
        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }

        const [rows] = await pool.query(sql, params);

        // --- Vérifie si aucune correspondance n'a été trouvée ---
        if (rows.length === 0) {
            return res.status(404).json({ error: "Aucun client trouvé pour les filtres donnés" });
        }

        res.json(rows);
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// Définit la route GET pour récupérer un client par son ID
clientsRouter.get('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID du client des paramètres de l'URL
        const id = req.params.id;

        // Vérification de base si l'ID n'est pas un nombre
        if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

        // Exécute la requête SQL pour sélectionner le client par son ID (`idclients`)
        const [rows] = await pool.query("SELECT * FROM clients WHERE idclients = ?", [id]);
        // Si aucune ligne n'est trouvée, renvoie une erreur HTTP 404
        if (rows.length === 0) return res.status(404).json({ error: "Client not found" });

        // Renvoie la première (et unique) ligne trouvée au format JSON
        res.json(rows[0]);
    // Capture toute erreur
    } catch (err) {
        // Affiche l'erreur MySQL dans la console du serveur
        console.error("MySQL Error:", err);
        // Renvoie une réponse d'erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route POST pour créer un nouveau client
clientsRouter.post('/create', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait les données du nouveau client du corps de la requête
        const { last_name, first_name, gender, mail, phone, adress, locality_idlocality } = req.body;
        // Validation : vérifie que tous les champs obligatoires sont présents
        if (!last_name || !first_name || !gender || !mail || !phone || !adress || !locality_idlocality) {
            // Renvoie une erreur HTTP 400 si un champ manque
            return res.status(400).json({ error: "Tous les champs sont obligatoires" });
        }

        // **Validation de la clé étrangère :** Vérifie si la localité existe dans la table `locality`
        const [localityRows] = await pool.query("SELECT * FROM locality WHERE idlocality = ?", [locality_idlocality]);
        // Si la localité n'existe pas, renvoie une erreur HTTP 400
        if (localityRows.length === 0) return res.status(400).json({ error: "locality_idlocality invalide" });

        // Définit la requête SQL d'insertion
        const sql = `INSERT INTO clients (last_name, first_name, gender, mail, phone, adress, locality_idlocality) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        // Exécute l'insertion
        const [result] = await pool.query(sql, [last_name, first_name, gender, mail, phone, adress, locality_idlocality]);

        // Renvoie une réponse HTTP 201 (Created) avec l'ID inséré et les données du client
        res.status(201).json({
            message: `Le client ${first_name} ${last_name} a bien été ajouté !`,
            client: { id: result.insertId, last_name, first_name, gender, mail, phone, adress, locality_idlocality }
        });
    // Capture toute erreur
    } catch (err) {
        // Affiche l'erreur MySQL
        console.error("MySQL Error:", err);
        // Renvoie une erreur HTTP 500 avec le message d'erreur spécifique
        res.status(500).json({ error: err.message });
    }
});

// Définit la route PUT pour mettre à jour un client par son ID
clientsRouter.put('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID de la race des paramètres de l'URL
        const id = req.params.id;
        // Extrait les données de mise à jour du corps de la requête
        const { last_name, first_name, gender, mail, phone, adress, locality_idlocality } = req.body;

        // Définit la requête SQL de mise à jour (UPDATE)
        const sql = `UPDATE clients SET last_name=?, first_name=?, gender=?, mail=?, phone=?, adress=?, locality_idlocality=? WHERE idclients=?`;
        // Exécute la mise à jour
        const [result] = await pool.query(sql, [last_name, first_name, gender, mail, phone, adress, locality_idlocality, id]);

        // Vérifie si aucune ligne n'a été affectée (Client non trouvé)
        if (result.affectedRows === 0) return res.status(404).json({ error: "Client not found" });

        // Renvoie une réponse JSON de succès avec les données mises à jour
        res.json({ message: "Client updated", client: { id, last_name, first_name, gender, mail, phone, adress, locality_idlocality } });
    // Capture toute erreur
    } catch (err) {
        // Affiche l'erreur
        console.error(err);
        // Renvoie une erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route DELETE pour supprimer un client par son ID
clientsRouter.delete('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID du client des paramètres de l'URL
        const id = req.params.id;
        // Exécute la requête SQL de suppression (DELETE)
        const [result] = await pool.query("DELETE FROM clients WHERE idclients = ?", [id]);
        // Vérifie si aucune ligne n'a été affectée (Client non trouvé)
        if (result.affectedRows === 0) return res.status(404).json({ error: "Client not found" });

        // Renvoie une réponse JSON de succès
        res.json({ message: "Client deleted" });
    // Capture toute erreur
    } catch (err) {
        // Affiche l'erreur
        console.error(err);
        // Renvoie une erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exporte le routeur pour qu'il puisse être utilisé dans l'application Express principale
export { clientsRouter };