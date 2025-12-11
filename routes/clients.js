// Importation d'Express pour gérer les routes
import express from "express";
import pool from "../db/db.js";

// Création du routeur Express pour les clients
const clientsRouter = express.Router();

// Route GET : récupérer tous les clients
clientsRouter.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM clients");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route GET : récupérer un client par son ID avec 404 si introuvable
clientsRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Vérification que l'ID est un nombre
        if (isNaN(id)) {
            return res.status(400).json({ error: "ID invalide" });
        }

        const [rows] = await pool.query("SELECT * FROM clients WHERE idclients = ?", [id]);

        if (rows.length === 0) {
            // Client introuvable -> 404
            return res.status(404).json({ error: "Client not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route POST : ajouter un nouveau client
clientsRouter.post('/create', async (req, res) => {
    try {
        const { last_name, first_name, gender, mail, phone, adress, locality_idlocality } = req.body;

        if (!last_name || !first_name || !gender || !mail || !phone || !adress || !locality_idlocality) {
            return res.status(400).json({ error: "Tous les champs sont obligatoires" });
        }

        // Vérifie que la localité existe
        const [localityRows] = await pool.query("SELECT * FROM locality WHERE idlocality = ?", [locality_idlocality]);
        if (localityRows.length === 0) {
            return res.status(400).json({ error: "locality_idlocality invalide" });
        }

        const sql = `INSERT INTO clients (last_name, first_name, gender, mail, phone, adress, locality_idlocality) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [last_name, first_name, gender, mail, phone, adress, locality_idlocality]);

        res.status(201).json({
            message: `Le client ${first_name} ${last_name} a bien été ajouté !`,
            client: { id: result.insertId, last_name, first_name, gender, mail, phone, adress, locality_idlocality }
        });

    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Route PUT : modifier un client existant
clientsRouter.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { last_name, first_name, gender, mail, phone, adress, locality_idlocality } = req.body;

        const sql = `UPDATE clients SET last_name=?, first_name=?, gender=?, mail=?, phone=?, adress=?, locality_idlocality=? WHERE idclients=?`;
        const [result] = await pool.query(sql, [last_name, first_name, gender, mail, phone, adress, locality_idlocality, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Client not found" });
        }

        res.json({ message: "Client updated", client: { id, last_name, first_name, gender, mail, phone, adress, locality_idlocality } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route DELETE : supprimer un client de la base via son ID
clientsRouter.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [result] = await pool.query("DELETE FROM clients WHERE idclients = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Client not found" });
        }

        res.json({ message: "Client deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export { clientsRouter };
