// Importation d'Express pour gérer les routes
import express from "express";
import pool from "../db/db.js";

const racesRouter = express.Router();

// ----------------------
// ROUTES CRUD
// ----------------------

// GET : récupérer toutes les races
racesRouter.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM races");
        res.json(rows);
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// GET : récupérer une race par son ID
racesRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query("SELECT * FROM races WHERE idraces = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Race non trouvée" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// POST : ajouter une nouvelle race
racesRouter.post('/create', async (req, res) => {
    try {
        const { 
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years 
        } = req.body;

        // Validation des champs obligatoires
        if (!name || !category || !morphology || !classification) {
            return res.status(400).json({ error: "Les champs name, category, morphology et classification sont obligatoires" });
        }

        const sql = `INSERT INTO races 
            (name, category, morphology, classification, 
             min_size_m, max_size_m, min_size_f, max_size_f, 
             min_weight_m, max_weight_m, min_weight_f, max_weight_f, years) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await pool.query(sql, [
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years
        ]);

        res.status(201).json({
            message: `La race ${name} a bien été ajoutée !`,
            race: {
                id: result.insertId, name, category, morphology, classification,
                min_size_m, max_size_m, min_size_f, max_size_f,
                min_weight_m, max_weight_m, min_weight_f, max_weight_f, years
            }
        });
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// PUT : modifier une race existante
racesRouter.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { 
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years 
        } = req.body;

        // Vérifier si la race existe
        const [existing] = await pool.query("SELECT * FROM races WHERE idraces = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Race non trouvée" });
        }

        const sql = `UPDATE races SET 
            name=?, category=?, morphology=?, classification=?,
            min_size_m=?, max_size_m=?, min_size_f=?, max_size_f=?,
            min_weight_m=?, max_weight_m=?, min_weight_f=?, max_weight_f=?, years=?
            WHERE idraces=?`;

        await pool.query(sql, [
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years, id
        ]);

        res.json({ 
            message: "Race mise à jour", 
            race: { id, name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years } 
        });
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// DELETE : supprimer une race par son ID
racesRouter.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const [result] = await pool.query("DELETE FROM races WHERE idraces = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Race non trouvée" });
        }

        res.json({ message: "Race supprimée" });
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export { racesRouter };
