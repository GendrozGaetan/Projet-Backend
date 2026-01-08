// Importe le framework web Express pour la création du routeur.
import express from "express";
// Importe l'objet 'pool' (connexion pool à la base de données) depuis le fichier db.js.
import pool from "../db/db.js";

// Crée un nouvel objet Router Express spécifique pour les routes des liens Race ↔ Chien.
const racesDogsRouter = express.Router();

// ----------------------
// Section de commentaire pour structurer le code.
// ROUTES CRUD
// ----------------------

// Définit la route GET pour récupérer tous les enregistrements de la table d'association.
// GET : récupérer tous les liens race ↔ dog
racesDogsRouter.get("/", async (req, res) => {
    try {
        const { races_idraces, dogs_iddogs } = req.query;

        const conditions = [];
        const params = [];

        // Vérifie races_idraces si fourni
        if (races_idraces !== undefined) {
            if (isNaN(races_idraces)) {
                return res.status(400).json({ error: "races_idraces invalide" });
            }
            // Vérifie si la race existe
            const [raceCheck] = await pool.query("SELECT * FROM races WHERE idraces = ?", [races_idraces]);
            if (raceCheck.length === 0) {
                return res.status(404).json({ error: `Race ${races_idraces} non trouvée` });
            }
            conditions.push("races_idraces = ?");
            params.push(races_idraces);
        }

        // Vérifie dogs_iddogs si fourni
        if (dogs_iddogs !== undefined) {
            if (isNaN(dogs_iddogs)) {
                return res.status(400).json({ error: "dogs_iddogs invalide" });
            }
            // Vérifie si le chien existe
            const [dogCheck] = await pool.query("SELECT * FROM dogs WHERE iddogs = ?", [dogs_iddogs]);
            if (dogCheck.length === 0) {
                return res.status(404).json({ error: `Dog ${dogs_iddogs} non trouvé` });
            }
            conditions.push("dogs_iddogs = ?");
            params.push(dogs_iddogs);
        }

        // Construire la requête SQL
        let sql = "SELECT * FROM races_has_dogs";
        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }

        const [rows] = await pool.query(sql, params);

        // Si aucune correspondance, renvoyer 404
        if (rows.length === 0) {
            return res.status(404).json({ error: "Aucun lien race ↔ dog trouvé pour les filtres donnés" });
        }

        res.json(rows);
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// Définit la route GET pour récupérer un lien spécifique par son ID.
// GET : récupérer un lien par son ID
racesDogsRouter.get("/:id", async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait l'ID du lien des paramètres de l'URL.
        const id = req.params.id;

        // Vérifie si l'ID n'est pas un nombre.
        if (isNaN(id)) {
            // Renvoie une erreur 400 si l'ID est invalide.
            return res.status(400).json({ error: "ID invalide" });
        }

        // Exécute la requête SQL pour trouver le lien avec l'ID spécifié.
        const [rows] = await pool.query("SELECT * FROM races_has_dogs WHERE id = ?", [id]);

        // Vérifie si aucun résultat n'a été trouvé.
        if (rows.length === 0) {
            // Renvoie une erreur 404 si le lien n'est pas trouvé.
            return res.status(404).json({ error: "Lien non trouvé" });
        }

        // Envoie le premier élément du tableau de résultats (le lien trouvé) en réponse JSON.
        res.json(rows[0]);
    // Capture et gère les erreurs.
    } catch (err) {
        // Affiche l'erreur MySQL dans la console.
        console.error("MySQL Error:", err);
        // Envoie une réponse d'erreur 500.
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route POST pour créer un nouveau lien d'association.
// POST : créer un nouveau lien race ↔ dog
racesDogsRouter.post("/create", async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait les IDs de race et de chien du corps de la requête.
        const { races_idraces, dogs_iddogs } = req.body;

        // Valide que les deux IDs de clé étrangère sont obligatoires.
        if (!races_idraces || !dogs_iddogs) {
            // Renvoie une erreur 400 si un champ obligatoire manque.
            return res.status(400).json({ error: "Les champs races_idraces et dogs_iddogs sont obligatoires" });
        }

        // Vérification de l'existence de la Race (vérification manuelle de la clé étrangère).
        // Vérifier si la race existe
        const [raceRows] = await pool.query("SELECT * FROM races WHERE idraces = ?", [races_idraces]);
        // Si la race n'est pas trouvée, renvoie une erreur 404.
        if (raceRows.length === 0) return res.status(404).json({ error: "Race non trouvée" });

        // Vérification de l'existence du Chien (vérification manuelle de la clé étrangère).
        // Vérifier si le dog existe
        const [dogRows] = await pool.query("SELECT * FROM dogs WHERE iddogs = ?", [dogs_iddogs]);
        // Si le chien n'est pas trouvé, renvoie une erreur 404.
        if (dogRows.length === 0) return res.status(404).json({ error: "Dog non trouvé" });

        // Requête SQL pour insérer les IDs dans la table d'association.
        const sql = "INSERT INTO races_has_dogs (races_idraces, dogs_iddogs) VALUES (?, ?)";
        // Exécute la requête d'insertion.
        const [result] = await pool.query(sql, [races_idraces, dogs_iddogs]);

        // Envoie une réponse de succès 201 (Créé) avec un message et les détails du nouveau lien.
        res.status(201).json({
            message: "Lien race ↔ dog créé avec succès",
            link: { id: result.insertId, races_idraces, dogs_iddogs }
        });
    // Capture et gère les erreurs.
    } catch (err) {
        // Vérifie si l'erreur est liée à une violation de clé étrangère (si non gérée manuellement par le code ci-dessus).
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
            // Renvoie une erreur 400 spécifique si la BDD signale un problème de clé étrangère.
            return res.status(400).json({ error: "Race ou Dog invalide, clé étrangère non trouvée" });
        }
        // Affiche l'erreur MySQL dans la console.
        console.error("MySQL Error:", err);
        // Envoie une réponse d'erreur 500 avec le message d'erreur.
        res.status(500).json({ error: err.message });
    }
});

// Définit la route PUT pour modifier un lien existant par son ID.
// PUT : modifier un lien race ↔ dog existant
racesDogsRouter.put("/:id", async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait l'ID du lien à modifier des paramètres de l'URL.
        const id = req.params.id;
        // Extrait les nouveaux IDs de race et de chien du corps de la requête.
        const { races_idraces, dogs_iddogs } = req.body;

        // Vérifie si l'ID du lien est invalide.
        if (isNaN(id)) {
            // Renvoie une erreur 400.
            return res.status(400).json({ error: "ID invalide" });
        }

        // Valide que les champs de mise à jour sont présents.
        if (!races_idraces || !dogs_iddogs) {
            // Renvoie une erreur 400 si un champ obligatoire manque.
            return res.status(400).json({ error: "Les champs races_idraces et dogs_iddogs sont obligatoires" });
        }

        // Vérification de l'existence de la nouvelle Race.
        // Vérifier si la race existe
        const [raceRows] = await pool.query("SELECT * FROM races WHERE idraces = ?", [races_idraces]);
        // Si la race n'est pas trouvée.
        if (raceRows.length === 0) return res.status(404).json({ error: "Race non trouvée" });

        // Vérification de l'existence du nouveau Chien.
        // Vérifier si le dog existe
        const [dogRows] = await pool.query("SELECT * FROM dogs WHERE iddogs = ?", [dogs_iddogs]);
        // Si le chien n'est pas trouvé.
        if (dogRows.length === 0) return res.status(404).json({ error: "Dog non trouvé" });

        // Requête SQL d'UPDATE pour modifier les IDs du lien.
        const sql = "UPDATE races_has_dogs SET races_idraces = ?, dogs_iddogs = ? WHERE id = ?";
        // Exécute la requête de mise à jour.
        const [result] = await pool.query(sql, [races_idraces, dogs_iddogs, id]);

        // Vérifie si aucune ligne n'a été affectée (le lien avec cet ID n'existait pas).
        if (result.affectedRows === 0) return res.status(404).json({ error: "Lien non trouvé" });

        // Envoie une réponse de succès avec un message et les données mises à jour.
        res.json({ message: "Lien race ↔ dog mis à jour", link: { id, races_idraces, dogs_iddogs } });
    // Capture et gère les erreurs.
    } catch (err) {
        // Vérifie si l'erreur est une violation de clé étrangère.
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
            // Renvoie une erreur 400 spécifique si la BDD signale un problème de clé étrangère.
            return res.status(400).json({ error: "Race ou Dog invalide, clé étrangère non trouvée" });
        }
        // Affiche l'erreur MySQL dans la console.
        console.error("MySQL Error:", err);
        // Envoie une réponse d'erreur 500 avec le message d'erreur.
        res.status(500).json({ error: err.message });
    }
});

// Définit la route DELETE pour supprimer un lien par son ID.
// DELETE : supprimer un lien par son ID
racesDogsRouter.delete("/:id", async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait l'ID du lien à supprimer des paramètres de l'URL.
        const id = req.params.id;

        // Vérifie si l'ID est invalide.
        if (isNaN(id)) {
            // Renvoie une erreur 400.
            return res.status(400).json({ error: "ID invalide" });
        }

        // Exécute la requête SQL de suppression pour l'ID spécifié.
        const [result] = await pool.query("DELETE FROM races_has_dogs WHERE id = ?", [id]);
        // Vérifie si aucune ligne n'a été affectée (le lien n'existait pas).
        if (result.affectedRows === 0) return res.status(404).json({ error: "Lien non trouvé" });

        // Envoie une réponse de succès avec un message de confirmation.
        res.json({ message: "Lien supprimé avec succès" });
    // Capture et gère les erreurs.
    } catch (err) {
        // Affiche l'erreur MySQL dans la console.
        console.error("MySQL Error:", err);
        // Envoie une réponse d'erreur 500.
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exporte le routeur pour qu'il puisse être utilisé par l'application Express principale.
export { racesDogsRouter };