import express from "express";
import pool from "../db/db.js";

const localityRouter = express.Router();

// GET all localities
localityRouter.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM locality");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// GET locality by ID
localityRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query("SELECT * FROM locality WHERE idlocality = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Locality not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// POST new locality
localityRouter.post('/create', async (req, res) => {
    try {
        const { name, postal_code, postal_comp, toponyme, canton_code, langage_code } = req.body;
        if (!name || !postal_code) return res.status(400).json({ error: "name and postal_code are required" });

        const sql = `INSERT INTO locality (name, postal_code, postal_comp, toponyme, canton_code, langage_code) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [name, postal_code, postal_comp, toponyme, canton_code, langage_code]);

        res.status(201).json({ 
            message: `Locality ${name} added`, 
            locality: { id: result.insertId, name, postal_code, postal_comp, toponyme, canton_code, langage_code } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update locality
localityRouter.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, postal_code, postal_comp, toponyme, canton_code, langage_code } = req.body;
        const [result] = await pool.query(
            `UPDATE locality SET name=?, postal_code=?, postal_comp=?, toponyme=?, canton_code=?, langage_code=? WHERE idlocality=?`,
            [name, postal_code, postal_comp, toponyme, canton_code, langage_code, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: "Locality not found" });

        res.json({ message: "Locality updated", locality: { id, name, postal_code, postal_comp, toponyme, canton_code, langage_code } });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// DELETE locality
localityRouter.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [result] = await pool.query("DELETE FROM locality WHERE idlocality = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Locality not found" });
        res.json({ message: "Locality deleted" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export { localityRouter };
