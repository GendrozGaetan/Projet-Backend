import express from "express";
import pool from "../db/db.js";

const diseasesRouter = express.Router();

// ----------------------
// ROUTES CRUD
// ----------------------

// GET all diseases
diseasesRouter.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM diseases");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// GET disease by ID
diseasesRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query("SELECT * FROM diseases WHERE iddiseases = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Disease not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// POST create new disease
diseasesRouter.post('/create', async (req, res) => {
    try {
        const { name, description, symptoms, prevention, heal, vaccin, zoonose } = req.body;

        // Validate required fields
        if (!name || !description) {
            return res.status(400).json({ error: "Les champs name et description sont obligatoires" });
        }

        const sql = `INSERT INTO diseases 
                     (name, description, symptoms, prevention, heal, vaccin, zoonose) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await pool.query(sql, [name, description, symptoms, prevention, heal, vaccin, zoonose]);

        res.status(201).json({
            message: `La maladie ${name} a bien été ajoutée !`,
            disease: {
                id: result.insertId,
                name, description, symptoms, prevention, heal, vaccin, zoonose
            }
        });

    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update disease
diseasesRouter.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, symptoms, prevention, heal, vaccin, zoonose } = req.body;

        const [result] = await pool.query(
            `UPDATE diseases 
             SET name=?, description=?, symptoms=?, prevention=?, heal=?, vaccin=?, zoonose=? 
             WHERE iddiseases=?`,
            [name, description, symptoms, prevention, heal, vaccin, zoonose, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: "Disease not found" });

        res.json({
            message: "Maladie mise à jour",
            disease: { id, name, description, symptoms, prevention, heal, vaccin, zoonose }
        });

    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// DELETE disease
diseasesRouter.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [result] = await pool.query("DELETE FROM diseases WHERE iddiseases = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Disease not found" });
        res.json({ message: "Maladie supprimée" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export { diseasesRouter };
