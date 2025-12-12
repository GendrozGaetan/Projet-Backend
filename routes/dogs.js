import express from "express";
import pool from "../db/db.js";

const dogsRouter = express.Router();

// GET all dogs (with optional race filter)
dogsRouter.get('/', async (req, res) => {
    try {
        const { race } = req.query;

        let sql = "SELECT d.* FROM dogs d";
        let params = [];

        if (race) {
            // Join with many-to-many table to filter by race
            sql += `
                JOIN races_has_dogs rhd ON d.iddogs = rhd.dogs_iddogs
                JOIN races r ON rhd.races_idraces = r.idraces
                WHERE r.name = ?
            `;
            params.push(race);
        }

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// GET dog by ID
dogsRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

        const [rows] = await pool.query("SELECT * FROM dogs WHERE iddogs = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Dog not found" });

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// POST new dog
dogsRouter.post('/create', async (req, res) => {
    try {
        const { first_name, gender, sterilized, birth_date, envy } = req.body;
        if (!first_name || !gender || sterilized === undefined || !birth_date || !envy) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }

        const sql = `INSERT INTO dogs (first_name, gender, sterilized, birth_date, envy) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [first_name, gender, sterilized, birth_date, envy]);

        res.status(201).json({
            message: `Le chien ${first_name} a bien été ajouté !`,
            dog: { id: result.insertId, first_name, gender, sterilized, birth_date, envy }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// PUT dog by ID
dogsRouter.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { first_name, gender, sterilized, birth_date, envy } = req.body;

        const sql = `UPDATE dogs SET first_name=?, gender=?, sterilized=?, birth_date=?, envy=? WHERE iddogs=?`;
        await pool.query(sql, [first_name, gender, sterilized, birth_date, envy, id]);

        res.json({ message: "Dog updated", dog: { id, first_name, gender, sterilized, birth_date, envy } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// DELETE dog by ID
dogsRouter.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query("DELETE FROM dogs WHERE iddogs = ?", [id]);
        res.json({ message: "Dog deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// GET dogs by race name (path param)
dogsRouter.get('/races/:raceName', async (req, res) => {
    try {
        const { raceName } = req.params;

        const sql = `
            SELECT d.*
            FROM dogs d
            JOIN races_has_dogs rhd ON d.iddogs = rhd.dogs_iddogs
            JOIN races r ON rhd.races_idraces = r.idraces
            WHERE r.name = ?
        `;

        const [rows] = await pool.query(sql, [raceName]);

        if (rows.length === 0) return res.status(404).json({ error: `No dogs found for race ${raceName}` });

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export { dogsRouter };
