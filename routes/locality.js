// Importe le framework Express
import express from "express";
// Importe l'objet de connexion à la base de données (pool de connexions)
import pool from "../db/db.js";

// Crée un nouvel objet Router Express pour gérer les routes spécifiques aux 'localities'
const localityRouter = express.Router();

// Définit la route GET pour récupérer toutes les localités (avec filtrage optionnel)
localityRouter.get('/', async (req, res) => {
    // Début du bloc try-catch pour la gestion des erreurs
    try {
        // Extrait les paramètres de requête (query) pour le filtrage
        const { name, postal_code, canton_code, langage_code } = req.query;
        // Initialise la requête SQL de base
        let sql = "SELECT * FROM locality";
        // Tableau pour stocker les valeurs des paramètres à lier (sécurité contre injection SQL)
        const params = [];
        // Tableau pour stocker les clauses de condition (WHERE)
        const conditions = [];

        // Vérifie si le filtre 'name' est présent
        if (name) {
            // Ajoute une condition pour filtrer par nom (recherche partielle LIKE)
            conditions.push("name LIKE ?");
            // Ajoute la valeur encadrée de '%' aux paramètres
            params.push(`%${name}%`);
        }
        // Vérifie si le filtre 'postal_code' est présent
        if (postal_code) {
            // Ajoute une condition pour filtrer par code postal (recherche partielle LIKE)
            conditions.push("postal_code LIKE ?");
            // Ajoute la valeur encadrée de '%' aux paramètres
            params.push(`%${postal_code}%`);
        }
        // Vérifie si le filtre 'canton_code' est présent
        if (canton_code) {
            // Ajoute une condition pour filtrer par code de canton (recherche exacte)
            conditions.push("canton_code = ?");
            // Ajoute la valeur du code de canton aux paramètres
            params.push(canton_code);
        }
        // Vérifie si le filtre 'langage_code' est présent
        if (langage_code) {
            // Ajoute une condition pour filtrer par code de langue (recherche exacte)
            conditions.push("langage_code = ?");
            // Ajoute la valeur du code de langue aux paramètres
            params.push(langage_code);
        }

        // Vérifie s'il y a des conditions de filtrage
        if (conditions.length > 0) {
            // Ajoute la clause WHERE à la requête SQL, en joignant les conditions par ' AND '
            sql += " WHERE " + conditions.join(" AND ");
        }

        // Exécute la requête SQL dans la base de données
        const [rows] = await pool.query(sql, params);
        // Renvoie les résultats (les localités trouvées) au format JSON
        res.json(rows);
    // Capture toute erreur
    } catch (err) {
        // En cas d'erreur, renvoie une réponse HTTP 500 (Erreur Serveur)
        res.status(500).json({ error: "Erreur serveur" });
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