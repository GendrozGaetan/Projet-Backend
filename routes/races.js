// Importe le framework Express pour créer le routeur
import express from "express";
// Importe l'objet de connexion à la base de données (pool de connexions) depuis son chemin
import pool from "../db/db.js";

// Crée un nouvel objet Router Express pour gérer les routes spécifiques aux 'races'
const racesRouter = express.Router();

racesRouter.get('/', async (req, res) => {
    try {
        const { category, classification, name, years } = req.query;

        const conditions = [];
        const values = [];

        if (category) {
            if (typeof category !== "string") 
                return res.status(400).json({ error: "'category' must be a string" });
            conditions.push("category = ?");
            values.push(category);
        }

        if (classification) {
            if (typeof classification !== "string") 
                return res.status(400).json({ error: "'classification' must be a string" });
            conditions.push("classification = ?");
            values.push(classification);
        }

        if (name) {
            if (typeof name !== "string") 
                return res.status(400).json({ error: "'name' must be a string" });
            // On force la casse insensible pour éviter les erreurs
            conditions.push("LOWER(name) LIKE LOWER(?)");
            values.push(`${name}%`);
        }

        if (years) {
            const yearsNum = parseInt(years, 10);
            if (isNaN(yearsNum) || yearsNum < 0) 
                return res.status(400).json({ error: "'years' must be a positive number" });
            conditions.push("years = ?");
            values.push(yearsNum);
        }

        let sql = "SELECT * FROM races";
        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }

        const [rows] = await pool.query(sql, values);

        // Si aucune race ne correspond aux filtres, on renvoie 404
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "No race matches the provided filter(s)" });
        }

        res.json(rows);

    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// Définit la route GET pour récupérer une race par son ID
racesRouter.get('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID de la race des paramètres de l'URL
        const id = req.params.id;
        // Vérifie si l'ID n'est pas un nombre (validation basique)
        if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

        // Exécute la requête SQL pour sélectionner la race par son ID (`idraces`)
        const [rows] = await pool.query("SELECT * FROM races WHERE idraces = ?", [id]);
        // Vérifie si aucune race n'a été trouvée (le tableau est vide)
        if (rows.length === 0) return res.status(404).json({ error: "Race non trouvée" });

        // Renvoie la première (et unique) ligne trouvée au format JSON
        res.json(rows[0]);
    // Capture toute erreur survenue
    } catch (err) {
        // Affiche l'erreur MySQL dans la console du serveur
        console.error("MySQL Error:", err);
        // Renvoie une réponse d'erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route POST pour créer une nouvelle race
racesRouter.post('/create', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait les données de la nouvelle race du corps de la requête (req.body)
        const { 
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years 
        } = req.body;

        // Validation : vérifie que les champs obligatoires sont présents
        if (!name || !category || !morphology || !classification) {
            // Renvoie une erreur HTTP 400 si un champ obligatoire manque
            return res.status(400).json({ error: "Les champs name, category, morphology et classification sont obligatoires" });
        }

        // Définit la requête SQL d'insertion avec des placeholders '?'
        const sql = `INSERT INTO races 
            (name, category, morphology, classification, 
             min_size_m, max_size_m, min_size_f, max_size_f, 
             min_weight_m, max_weight_m, min_weight_f, max_weight_f, years) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        // Exécute la requête SQL avec le tableau de valeurs correspondant aux placeholders
        // `result` contient des infos comme l'ID inséré
        const [result] = await pool.query(sql, [
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years
        ]);

        // Renvoie une réponse HTTP 201 (Created) avec un message de succès et les données de la race créée
        res.status(201).json({
            message: `La race ${name} a bien été ajoutée !`,
            race: {
                // Ajoute l'ID généré par la base de données
                id: result.insertId, name, category, morphology, classification,
                min_size_m, max_size_m, min_size_f, max_size_f,
                min_weight_m, max_weight_m, min_weight_f, max_weight_f, years
            }
        });
    // Capture toute erreur survenue
    } catch (err) {
        // Affiche l'erreur MySQL dans la console du serveur
        console.error("MySQL Error:", err);
        // Renvoie une réponse d'erreur HTTP 500 avec le message d'erreur spécifique
        res.status(500).json({ error: err.message });
    }
});

// Définit la route PUT pour mettre à jour une race par son ID
racesRouter.put('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID de la race des paramètres de l'URL
        const id = req.params.id;
        // Extrait les données de mise à jour du corps de la requête
        const { 
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years 
        } = req.body;

        // Vérifie d'abord si la race existe (SELECT)
        const [existing] = await pool.query("SELECT * FROM races WHERE idraces = ?", [id]);
        // Si aucune race n'est trouvée, renvoie une erreur HTTP 404
        if (existing.length === 0) return res.status(404).json({ error: "Race non trouvée" });

        // Définit la requête SQL de mise à jour (UPDATE) avec tous les champs
        const sql = `UPDATE races SET 
            name=?, category=?, morphology=?, classification=?,
            min_size_m=?, max_size_m=?, min_size_f=?, max_size_f=?,
            min_weight_m=?, max_weight_m=?, min_weight_f=?, max_weight_f=?, years=?
            WHERE idraces=?`;

        // Exécute la requête SQL de mise à jour avec le tableau de valeurs
        await pool.query(sql, [
            name, category, morphology, classification,
            min_size_m, max_size_m, min_size_f, max_size_f,
            min_weight_m, max_weight_m, min_weight_f, max_weight_f,
            years, id // L'ID est le dernier paramètre pour la clause WHERE
        ]);

        // Renvoie une réponse JSON de succès avec les données mises à jour
        res.json({ 
            message: "Race mise à jour", 
            race: { id, name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years } 
        });
    // Capture toute erreur survenue
    } catch (err) {
        // Affiche l'erreur MySQL dans la console du serveur
        console.error("MySQL Error:", err);
        // Renvoie une réponse d'erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route DELETE pour supprimer une race par son ID
racesRouter.delete('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID de la race des paramètres de l'URL
        const id = req.params.id;

        // Exécute la requête SQL de suppression (DELETE)
        const [result] = await pool.query("DELETE FROM races WHERE idraces = ?", [id]);
        // Vérifie si aucune ligne n'a été affectée (Race non trouvée)
        if (result.affectedRows === 0) return res.status(404).json({ error: "Race non trouvée" });

        // Renvoie une réponse JSON de succès
        res.json({ message: "Race supprimée" });
    // Capture toute erreur survenue
    } catch (err) {
        // Affiche l'erreur MySQL dans la console du serveur
        console.error("MySQL Error:", err);
        // Renvoie une réponse d'erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exporte le routeur pour qu'il puisse être utilisé dans l'application Express principale
export { racesRouter };