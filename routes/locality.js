// Importe le framework Express
import express from "express";
// Importe l'objet de connexion à la base de données (pool de connexions)
import pool from "../db/db.js";

// Crée un nouvel objet Router Express pour gérer les routes spécifiques aux 'localities'
const localityRouter = express.Router();

// Définit la route GET pour récupérer toutes les localités (avec filtrage optionnel)
localityRouter.get('/', async (req, res) => {
    try {
        const { name, postal_code, canton_code, langage_code } = req.query;

        let sql = "SELECT * FROM locality";
        const params = [];
        const conditions = [];

        if (name) {
            conditions.push("LOWER(name) LIKE LOWER(?)"); // insensible à la casse
            params.push(`%${name}%`);
        }
        if (postal_code) {
            conditions.push("postal_code LIKE ?");
            params.push(`%${postal_code}%`);
        }
        if (canton_code) {
            conditions.push("canton_code = ?");
            params.push(canton_code);
        }
        if (langage_code) {
            conditions.push("langage_code = ?");
            params.push(langage_code);
        }

        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }

        const [rows] = await pool.query(sql, params);

        // Si aucune localité ne correspond aux filtres
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "No locality matches the provided filter(s)" });
        }

        // Sinon, renvoie les localités trouvées
        res.json(rows);

    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// Définit la route GET pour récupérer une localité par son ID
localityRouter.get('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID de la localité des paramètres de l'URL
        const id = req.params.id;
        // Vérification de base si l'ID n'est pas un nombre
        if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

        // Exécute la requête SQL pour sélectionner la localité par son ID (`idlocality`)
        const [rows] = await pool.query("SELECT * FROM locality WHERE idlocality = ?", [id]);
        // Si aucune ligne n'est trouvée, renvoie une erreur HTTP 404
        if (rows.length === 0) return res.status(404).json({ error: "Locality not found" });

        // Renvoie la première (et unique) ligne trouvée
        res.json(rows[0]);
    // Capture toute erreur
    } catch (err) {
        // Renvoie une erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route POST pour créer une nouvelle localité
localityRouter.post('/create', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait les données de la nouvelle localité du corps de la requête
        const { name, postal_code, postal_comp, toponyme, canton_code, langage_code } = req.body;
        // Validation : vérifie que les champs obligatoires sont présents
        if (!name || !postal_code) return res.status(400).json({ error: "name and postal_code are required" });

        // Définit la requête SQL d'insertion
        const sql = `INSERT INTO locality (name, postal_code, postal_comp, toponyme, canton_code, langage_code) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        // Exécute l'insertion
        const [result] = await pool.query(sql, [name, postal_code, postal_comp, toponyme, canton_code, langage_code]);

        // Renvoie une réponse HTTP 201 (Created)
        res.status(201).json({ 
            message: `Locality ${name} added`, 
            // Inclut les données insérées et l'ID généré
            locality: { id: result.insertId, name, postal_code, postal_comp, toponyme, canton_code, langage_code } 
        });
    // Capture toute erreur
    } catch (err) {
        // Renvoie une erreur HTTP 500 avec le message d'erreur spécifique
        res.status(500).json({ error: err.message });
    }
});

// Définit la route PUT pour mettre à jour une localité par son ID
localityRouter.put('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID de la localité des paramètres de l'URL
        const id = req.params.id;
        // Extrait les données de mise à jour du corps de la requête
        const { name, postal_code, postal_comp, toponyme, canton_code, langage_code } = req.body;

        // Exécute la requête SQL de mise à jour (UPDATE)
        const [result] = await pool.query(
            `UPDATE locality SET name=?, postal_code=?, postal_comp=?, toponyme=?, canton_code=?, langage_code=? WHERE idlocality=?`,
            // Tableau des valeurs, l'ID est le dernier pour la clause WHERE
            [name, postal_code, postal_comp, toponyme, canton_code, langage_code, id]
        );

        // Vérifie si aucune ligne n'a été affectée (Localité non trouvée)
        if (result.affectedRows === 0) return res.status(404).json({ error: "Locality not found" });

        // Renvoie une réponse JSON de succès avec les données mises à jour
        res.json({ message: "Locality updated", locality: { id, name, postal_code, postal_comp, toponyme, canton_code, langage_code } });
    // Capture toute erreur
    } catch (err) {
        // Renvoie une erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route DELETE pour supprimer une localité par son ID
localityRouter.delete('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID de la localité des paramètres de l'URL
        const id = req.params.id;
        // Exécute la requête SQL de suppression (DELETE)
        const [result] = await pool.query("DELETE FROM locality WHERE idlocality = ?", [id]);
        // Vérifie si aucune ligne n'a été affectée (Localité non trouvée)
        if (result.affectedRows === 0) return res.status(404).json({ error: "Locality not found" });
        // Renvoie une réponse JSON de succès
        res.json({ message: "Locality deleted" });
    // Capture toute erreur
    } catch (err) {
        // Renvoie une erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exporte le routeur pour qu'il puisse être utilisé par l'application principale
export { localityRouter };