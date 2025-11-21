// Importation d'Express pour gérer les routes
import express from "express";

// Importation du pool MySQL pour communiquer avec la base de données
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

// Route GET : récupérer un client par son ID
clientsRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query("SELECT * FROM clients WHERE idclients = ?", [id]);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route POST : ajouter un nouveau client à la base
clientsRouter.post('/create', async (req, res) => {
    try {
        const { last_name, first_name, gender, mail, phone, adress, locality_idlocality } = req.body;
        const sql = `INSERT INTO clients (last_name, first_name, gender, mail, phone, adress, locality_idlocality) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [last_name, first_name, gender, mail, phone, adress, locality_idlocality]);
        res.json({
            message: `Le client ${first_name} ${last_name} a bien été ajouté !`,
            client: { id: result.insertId, last_name, first_name, gender, mail, phone, adress, locality_idlocality }
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route PUT : modifier un client existant
clientsRouter.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { last_name, first_name, gender, mail, phone, adress, locality_idlocality } = req.body;
        const sql = `UPDATE clients SET last_name=?, first_name=?, gender=?, mail=?, phone=?, adress=?, locality_idlocality=? WHERE idclients=?`;
        await pool.query(sql, [last_name, first_name, gender, mail, phone, adress, locality_idlocality, id]);
        res.json({ message: "Client updated", client: { id, last_name, first_name, gender, mail, phone, adress, locality_idlocality } });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route DELETE : supprimer un client de la base via son ID
clientsRouter.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query("DELETE FROM clients WHERE idclients = ?", [id]);
        res.json({ message: "Client deleted" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exportation du routeur pour utilisation dans d'autres fichiers
export { clientsRouter };
