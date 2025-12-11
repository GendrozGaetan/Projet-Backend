// Importation d'Express pour gérer les routes
import express from "express";
import pool from "../db/db.js";

const racesDogsRouter = express.Router();

// ----------------------
// ROUTES CRUD
// ----------------------

// GET : récupérer tous les liens race ↔ dog
racesDogsRouter.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM races_has_dogs");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// GET : récupérer un lien par son ID
racesDogsRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query("SELECT * FROM races_has_dogs WHERE id = ?", [id]);

        if (rows.length === 0) return res.status(404).json({ error: "Lien non trouvé" });

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// POST : créer un nouveau lien race ↔ dog
racesDogsRouter.post("/create", async (req, res) => {
    try {
        const { races_idraces, dogs_iddogs } = req.body;

        if (!races_idraces || !dogs_iddogs) {
            return res.status(400).json({ error: "Les champs races_idraces et dogs_iddogs sont obligatoires" });
        }

        // Vérifier si la race existe
        const [raceRows] = await pool.query("SELECT * FROM races WHERE idraces = ?", [races_idraces]);
        if (raceRows.length === 0) return res.status(404).json({ error: "Race non trouvée" });

        // Vérifier si le dog existe
        const [dogRows] = await pool.query("SELECT * FROM dogs WHERE iddogs = ?", [dogs_iddogs]);
        if (dogRows.length === 0) return res.status(404).json({ error: "Dog non trouvé" });

        const sql = "INSERT INTO races_has_dogs (races_idraces, dogs_iddogs) VALUES (?, ?)";
        const [result] = await pool.query(sql, [races_idraces, dogs_iddogs]);

        res.status(201).json({
            message: "Lien race ↔ dog créé avec succès",
            link: { id: result.insertId, races_idraces, dogs_iddogs }
        });
    } catch (err) {
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({ error: "Race ou Dog invalide, clé étrangère non trouvée" });
        }
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// PUT : modifier un lien race ↔ dog existant
racesDogsRouter.put("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { races_idraces, dogs_iddogs } = req.body;

        if (!races_idraces || !dogs_iddogs) {
            return res.status(400).json({ error: "Les champs races_idraces et dogs_iddogs sont obligatoires" });
        }

        // Vérifier si la race et le dog existent
        const [raceRows] = await pool.query("SELECT * FROM races WHERE idraces = ?", [races_idraces]);
        if (raceRows.length === 0) return res.status(404).json({ error: "Race non trouvée" });

        const [dogRows] = await pool.query("SELECT * FROM dogs WHERE iddogs = ?", [dogs_iddogs]);
        if (dogRows.length === 0) return res.status(404).json({ error: "Dog non trouvé" });

        const sql = "UPDATE races_has_dogs SET races_idraces = ?, dogs_iddogs = ? WHERE id = ?";
        const [result] = await pool.query(sql, [races_idraces, dogs_iddogs, id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: "Lien non trouvé" });

        res.json({ message: "Lien race ↔ dog mis à jour", link: { id, races_idraces, dogs_iddogs } });
    } catch (err) {
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({ error: "Race ou Dog invalide, clé étrangère non trouvée" });
        }
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE : supprimer un lien par son ID
racesDogsRouter.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const [result] = await pool.query("DELETE FROM races_has_dogs WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Lien non trouvé" });

        res.json({ message: "Lien supprimé avec succès" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export { racesDogsRouter };
