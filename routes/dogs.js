// Importation d'Express pour gérer les routes
import express from "express";

// Importation du pool MySQL pour communiquer avec la base de données
import pool from "../db/db.js";

// Création du routeur Express pour les chiens
const dogsRouter = express.Router();

// Route GET : récupérer tous les chiens
// Utilise une requête SQL SELECT pour lire toutes les entrées de la table "dogs"
dogsRouter.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM dogs");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route GET : récupérer un chien par son ID
dogsRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query("SELECT * FROM dogs WHERE iddogs = ?", [id]);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route POST : ajouter un nouveau chien à la base
dogsRouter.post('/create', async (req, res) => {
    try {
        const { first_name, gender, sterilized, birth_date, envy } = req.body;
        const sql = `INSERT INTO dogs (first_name, gender, sterilized, birth_date, envy) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [first_name, gender, sterilized, birth_date, envy]);
        res.json({
            message: `Le chien ${first_name} a bien été ajouté !`,
            dog: { id: result.insertId, first_name, gender, sterilized, birth_date, envy }
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route PUT : modifier un chien existant
dogsRouter.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { first_name, gender, sterilized, birth_date, envy } = req.body;
        const sql = `UPDATE dogs SET first_name=?, gender=?, sterilized=?, birth_date=?, envy=? WHERE iddogs=?`;
        await pool.query(sql, [first_name, gender, sterilized, birth_date, envy, id]);
        res.json({ message: "Dog updated", dog: { id, first_name, gender, sterilized, birth_date, envy } });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route DELETE : supprimer un chien de la base via son ID
dogsRouter.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query("DELETE FROM dogs WHERE iddogs = ?", [id]);
        res.json({ message: "Dog deleted" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exportation du routeur pour utilisation dans d'autres fichiers
export { dogsRouter };  