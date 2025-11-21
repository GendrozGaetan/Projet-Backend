// Importation d'Express pour gérer les routes
import express from "express";

// Importation du pool MySQL pour communiquer avec la base de données
import pool from "../db/db.js";

// Création du routeur Express pour les races
const racesRouter = express.Router();

// Route GET : récupérer toutes les races
racesRouter.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM races");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route GET : récupérer une race par son ID
racesRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query("SELECT * FROM races WHERE idraces = ?", [id]);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route POST : ajouter une nouvelle race
racesRouter.post('/create', async (req, res) => {
    try {
        const { name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years } = req.body;
        const sql = `INSERT INTO races 
            (name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years]);
        res.json({
            message: `La race ${name} a bien été ajoutée !`,
            race: { id: result.insertId, name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years }
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route PUT : modifier une race existante
racesRouter.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years } = req.body;
        const sql = `UPDATE races SET name=?, category=?, morphology=?, classification=?, min_size_m=?, max_size_m=?, min_size_f=?, max_size_f=?, min_weight_m=?, max_weight_m=?, min_weight_f=?, max_weight_f=?, years=? WHERE idraces=?`;
        await pool.query(sql, [name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years, id]);
        res.json({ message: "Race mise à jour", race: { id, name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years } });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route DELETE : supprimer une race par son ID
racesRouter.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query("DELETE FROM races WHERE idraces = ?", [id]);
        res.json({ message: "Race supprimée" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exportation du routeur pour utilisation dans d'autres fichiers
export { racesRouter };
