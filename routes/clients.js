// Importation du framework Express pour la gestion des routes
import express from "express";
// Importation de la connexion à la base de données (pool de connexions)
import pool from "../db/db.js";

// Création du routeur Express pour isoler les fonctionnalités liées aux clients
const clientsRouter = express.Router();

/**
 * FONCTION UTILITAIRE : isValidId
 * Vérifie que l'identifiant (ID) fourni est bien un nombre, un entier, et positif.
 */
const isValidId = (id) => !isNaN(id) && Number.isInteger(Number(id)) && Number(id) > 0;

// --- ROUTE GET : Récupérer les clients (avec filtres dynamiques optionnels) ---
clientsRouter.get('/', async (req, res) => {
    try {
        // Extraction des filtres possibles depuis les paramètres de recherche (?gender=M&last_name=Dupont)
        const { id, last_name, first_name, adress, mail, gender, phone, locality_idlocality } = req.query;

        // Initialisation des éléments pour construire la requête SQL dynamiquement
        const conditions = [];
        const params = [];

        // Filtre par ID exact (si fourni)
        if (id !== undefined) {
            if (!isValidId(id)) return res.status(400).json({ error: "Format d'ID invalide" });
            conditions.push("idclients = ?");
            params.push(id);
        }

        // Filtre par localité (clé étrangère)
        if (locality_idlocality !== undefined) {
            if (!isValidId(locality_idlocality)) return res.status(400).json({ error: "Format d'ID localité invalide" });
            conditions.push("locality_idlocality = ?");
            params.push(locality_idlocality);
        }

        // Filtres par recherche textuelle partielle (LIKE)
        if (last_name) {
            conditions.push("last_name LIKE ?");
            params.push(`%${last_name}%`);
        }
        if (first_name) {
            conditions.push("first_name LIKE ?");
            params.push(`%${first_name}%`);
        }
        if (mail) {
            conditions.push("mail LIKE ?");
            params.push(`%${mail}%`);
        }

        // Filtre par genre exact
        if (gender) {
            conditions.push("gender = ?");
            params.push(gender);
        }

        // Requête de base
        let sql = "SELECT * FROM clients";

        // Si des conditions existent, on les ajoute à la requête SQL avec "AND"
        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }

        // Exécution de la requête avec les paramètres sécurisés
        const [rows] = await pool.query(sql, params);

        // Si aucun client ne correspond à la recherche
        if (rows.length === 0) {
            return res.status(404).json({ 
                error: "Aucun client trouvé", 
                message: "Aucun enregistrement ne correspond à vos critères." 
            });
        }

        // Envoi des résultats
        res.json(rows);

    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des clients." });
    }
});

// --- ROUTE GET : Récupérer un client spécifique par son ID ---
clientsRouter.get('/:id', async (req, res) => {
    try {
        // Récupération de l'ID depuis l'URL
        const { id } = req.params;

        // Validation de l'ID
        if (!isValidId(id)) {
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Requête SQL préparée
        const [rows] = await pool.query("SELECT * FROM clients WHERE idclients = ?", [id]);

        // Vérification de l'existence du client
        if (rows.length === 0) {
            return res.status(404).json({ 
                error: "Client non trouvé", 
                message: `Aucun client avec l'ID ${id}.` 
            });
        }

        // Renvoi de l'objet client unique
        res.json(rows[0]);
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// --- ROUTE POST : Créer un nouveau client ---
clientsRouter.post('/create', async (req, res) => {
    try {
        // Extraction des données envoyées dans le corps de la requête
        const { last_name, first_name, gender, mail, phone, adress, locality_idlocality } = req.body;

        // Validation des champs obligatoires (on peut ajouter d'autres champs selon vos besoins)
        if (!last_name || !first_name || !mail || !locality_idlocality) {
            return res.status(400).json({ 
                error: "Données manquantes", 
                message: "Le nom, le prénom, l'email et la localité sont obligatoires." 
            });
        }

        // Vérification de l'existence de la localité avant l'insertion (sécurité clé étrangère)
        const [localityRows] = await pool.query("SELECT * FROM locality WHERE idlocality = ?", [locality_idlocality]);
        if (localityRows.length === 0) {
            return res.status(400).json({ error: "Localité invalide", message: "La localité spécifiée n'existe pas." });
        }

        // Requête d'insertion SQL
        const sql = `INSERT INTO clients (last_name, first_name, gender, mail, phone, adress, locality_idlocality) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [last_name, first_name, gender, mail, phone, adress, locality_idlocality]);
        
        // Réponse de succès avec code 201 (Créé)
        res.status(201).json({
            message: `Le client ${first_name} ${last_name} a été créé avec succès !`,
            client: { id: result.insertId, last_name, first_name, mail }
        });

    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur lors de la création du client" });
    }
});

// --- ROUTE PUT : Modifier un client existant ---
clientsRouter.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { last_name, first_name, gender, mail, phone, adress, locality_idlocality } = req.body;

        // Validation de l'ID
        if (!isValidId(id)) {
            return res.status(400).json({ error: "Format d'ID invalide" });
        }

        // Mise à jour SQL
        const sql = `UPDATE clients SET last_name=?, first_name=?, gender=?, mail=?, phone=?, adress=?, locality_idlocality=? WHERE idclients=?`;
        const [result] = await pool.query(sql, [last_name, first_name, gender, mail, phone, adress, locality_idlocality, id]);

        // Si aucune ligne n'a été modifiée, c'est que l'ID n'existait pas
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Mise à jour impossible", message: "Client introuvable." });
        }

        res.json({ message: "Client mis à jour avec succès" });

    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur lors de la modification" });
    }
});

// --- ROUTE DELETE : Supprimer un client ---
clientsRouter.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validation de l'ID
        if (!isValidId(id)) {
            return res.status(400).json({ error: "Format d'ID invalide" });
        }

        // Suppression SQL
        const [result] = await pool.query("DELETE FROM clients WHERE idclients = ?", [id]);

        // Vérification si la suppression a eu lieu
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Suppression impossible", message: "Ce client n'existe pas." });
        }

        res.json({ message: "Client supprimé avec succès" });

    } catch (err) {
        console.error("Database Error:", err);
        // Souvent une erreur 500 ici indique que le client possède encore des chiens liés dans la DB
        res.status(500).json({ 
            error: "Erreur lors de la suppression", 
            message: "Impossible de supprimer ce client (il possède peut-être des chiens liés)." 
        });
    }
});

// Exportation du routeur
export { clientsRouter };