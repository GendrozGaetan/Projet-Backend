// Importation d'Express pour gérer les routes
import express from "express";

// Importation du pool MySQL pour communiquer avec la base de données
import pool from "../db/db.js";

// Création du routeur Express pour les localités
const localityRouter = express.Router();

// Route GET : récupérer toutes les localités
localityRouter.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM locality");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route GET : récupérer une localité par son ID
localityRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query("SELECT * FROM locality WHERE idlocality = ?", [id]);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route POST : ajouter une nouvelle localité
localityRouter.post('/create', async (req, res) => {
    try {
        const { name, postal_code, postal_comp, toponyme, canton_code, langage_code } = req.body;
        const sql = `INSERT INTO locality (name, postal_code, postal_comp, toponyme, canton_code, langage_code) VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [name, postal_code, postal_comp, toponyme, canton_code, langage_code]);
        res.json({
            message: `La localité ${name} a bien été ajoutée !`,
            locality: { id: result.insertId, name, postal_code, postal_comp, toponyme, canton_code, langage_code }
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route PUT : modifier une localité existante
localityRouter.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, postal_code, postal_comp, toponyme, canton_code, langage_code } = req.body;
        const sql = `UPDATE locality SET name=?, postal_code=?, postal_comp=?, toponyme=?, canton_code=?, langage_code=? WHERE idlocality=?`;
        await pool.query(sql, [name, postal_code, postal_comp, toponyme, canton_code, langage_code, id]);
        res.json({ message: "Localité mise à jour", locality: { id, name, postal_code, postal_comp, toponyme, canton_code, langage_code } });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route DELETE : supprimer une localité par son ID
localityRouter.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query("DELETE FROM locality WHERE idlocality = ?", [id]);
        res.json({ message: "Localité supprimée" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exportation du routeur pour utilisation dans d'autres fichiers
export { localityRouter };
