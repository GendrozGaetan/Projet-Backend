import express from "express";
import pool from "../db/db.js";

const servicesRouter = express.Router();

// ----------------------
// ROUTES CRUD
// ----------------------

// GET : récupérer tous les services
servicesRouter.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM services");
        res.json(rows);
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// GET : récupérer un service par son ID
servicesRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query("SELECT * FROM services WHERE idservices = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Service non trouvé" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// POST : ajouter un nouveau service
servicesRouter.post('/create', async (req, res) => {
    try {
        const { date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality } = req.body;

        // Validation des champs requis
        if (!date || !zone || !time || !dogs_iddogs || !clients_idclients || !locality_idlocality) {
            return res.status(400).json({ error: "Tous les champs sont obligatoires" });
        }

        const sql = `INSERT INTO services (date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality]);

        res.status(201).json({
            message: `Le service pour le chien ID ${dogs_iddogs} a bien été ajouté !`,
            service: { id: result.insertId, date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality }
        });
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// PUT : modifier un service existant
servicesRouter.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality } = req.body;

        // Vérifier si le service existe
        const [existing] = await pool.query("SELECT * FROM services WHERE idservices = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Service non trouvé" });
        }

        const sql = `UPDATE services SET date=?, zone=?, time=?, dogs_iddogs=?, clients_idclients=?, locality_idlocality=? WHERE idservices=?`;
        await pool.query(sql, [date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality, id]);

        res.json({
            message: "Service mis à jour",
            service: { id, date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality }
        });
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// DELETE : supprimer un service par son ID
servicesRouter.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const [result] = await pool.query("DELETE FROM services WHERE idservices = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Service non trouvé" });
        }

        res.json({ message: "Service supprimé" });
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export { servicesRouter };
