// Importation d'Express pour gérer les routes
import express from "express";

// Importation du pool MySQL pour communiquer avec la base de données
import pool from "../db/db.js";

// Création du routeur Express pour les services
const servicesRouter = express.Router();

// Route GET : récupérer tous les services
servicesRouter.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM services");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route GET : récupérer un service par son ID
servicesRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query("SELECT * FROM services WHERE idservices = ?", [id]);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route POST : ajouter un nouveau service
servicesRouter.post('/create', async (req, res) => {
    try {
        const { date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality } = req.body;
        const sql = `INSERT INTO services (date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality) VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality]);
        res.json({
            message: `Le service pour le chien ID ${dogs_iddogs} a bien été ajouté !`,
            service: { id: result.insertId, date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality }
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route PUT : modifier un service existant
servicesRouter.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality } = req.body;
        const sql = `UPDATE services SET date=?, zone=?, time=?, dogs_iddogs=?, clients_idclients=?, locality_idlocality=? WHERE idservices=?`;
        await pool.query(sql, [date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality, id]);
        res.json({
            message: "Service mis à jour",
            service: { id, date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality }
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route DELETE : supprimer un service par son ID
servicesRouter.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query("DELETE FROM services WHERE idservices = ?", [id]);
        res.json({ message: "Service supprimé" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exportation du routeur pour utilisation dans d'autres fichiers
export { servicesRouter };
