
// Importe le framework Express
import express from "express";
// Importe l'objet de connexion à la base de données (pool de connexions)
import pool from "../db/db.js";

// Crée un nouvel objet Router Express pour gérer les routes spécifiques aux 'dogs'
const dogsRouter = express.Router();


// Définit la route GET pour récupérer tous les chiens (avec filtrage par race, âge, genre, stérilisation)
// Importation du framework Express pour créer des routes HTTP
import express from "express";

// Importation du pool de connexion à la base de données MySQL
import pool from "../db/db.js";

/**
 * HELPER: isValidId
 * Vérifie que l’ID est :
 * - un nombre
 * - un entier
 * - strictement supérieur à 0
 */
const isValidId = (id) => !isNaN(id) && Number.isInteger(Number(id)) && Number(id) > 0;

// --- Route GET : récupérer tous les chiens ---

// Définition d’une route GET sur "/" pour récupérer tous les chiens
dogsRouter.get('/', async (req, res) => {

    // Début du bloc try pour gérer les erreurs
    try {
        const { race, birth_date, gender, sterilized, first_name, last_name } = req.query;

        const conditions = [];
        const values = [];

        // --- Validation et filtres ---
        if (race) {
            const [raceRows] = await pool.query("SELECT * FROM races WHERE name = ?", [race]);
            if (raceRows.length === 0) {
                return res.status(400).json({ error: `Invalid 'race': '${race}' does not exist` });
            }
            conditions.push("races.name = ?");
            values.push(race);
        }

        if (birth_date) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
                return res.status(400).json({ error: "Invalid 'birth_date': must be in YYYY-MM-DD format" });
            }
            conditions.push("dogs.birth_date = ?");
            values.push(birth_date);
        }

        if (gender) {
            if (!["M", "F"].includes(gender)) {
                return res.status(400).json({ error: "Invalid 'gender': must be 'M' or 'F'" });
            }
            conditions.push("dogs.gender = ?");
            values.push(gender);
        }

        if (sterilized !== undefined) {
            if (!["0", "1"].includes(String(sterilized))) {
                return res.status(400).json({ error: "Invalid 'sterilized': must be 0 or 1" });
            }
            conditions.push("dogs.sterilized = ?");
            values.push(sterilized);
        }

        if (first_name) {
            conditions.push("dogs.first_name LIKE ?");
            values.push(`${first_name}%`);
        }

        if (last_name) {
            conditions.push("dogs.last_name LIKE ?");
            values.push(`${last_name}%`);
        }

        // --- Construction de la requête ---
        let sql = `SELECT dogs.* 
                   FROM dogs 
                   LEFT JOIN races_has_dogs rhd ON dogs.iddogs = rhd.dogs_iddogs 
                   LEFT JOIN races ON rhd.races_idraces = races.idraces`;

        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }

        // --- Exécution ---
        const [rows] = await pool.query(sql, values);

        if (rows.length === 0) {
            return res.status(404).json({ error: "No dog found matching the provided filter(s)" });
        }

        res.json(rows);

    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET : récupérer un chien par son ID
dogsRouter.get('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID du chien des paramètres de l'URL
        const id = req.params.id;

        // Validation : vérifie que l'ID est un nombre entier positif (regex)
        if (!/^\d+$/.test(id)) {
            // Renvoie une erreur HTTP 400 (Bad Request)
            return res.status(400).json({ 
                error: "ID invalide : le paramètre doit être un nombre entier positif" 
            });
        }

        // Exécute la requête SQL pour sélectionner le chien par son ID (`iddogs`)
        const [rows] = await pool.query("SELECT * FROM dogs WHERE iddogs = ?", [id]);

        // Si aucune ligne n'est trouvée, renvoie une erreur HTTP 404 (Not Found)
        if (rows.length === 0) {
            return res.status(404).json({ error: "Dog not found" });
        }

        // Renvoie la première (et unique) ligne trouvée
        res.json(rows[0]);
    // Capture toute erreur
    } catch (err) {
        // Renvoie une erreur HTTP 500 (Erreur Serveur)
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// POST : créer un nouveau chien
dogsRouter.post('/create', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait les données du nouveau chien du corps de la requête
        const { first_name, gender, sterilized, birth_date, envy } = req.body;
        // Validation : vérifie que tous les champs requis sont présents
        if (!first_name || !gender || sterilized === undefined || !birth_date || !envy) {
            // Renvoie une erreur HTTP 400 si un champ manque
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }

        // Définit la requête SQL d'insertion
        const sql = `INSERT INTO dogs (first_name, gender, sterilized, birth_date, envy) VALUES (?, ?, ?, ?, ?)`;
        // Exécute l'insertion
        const [result] = await pool.query(sql, [first_name, gender, sterilized, birth_date, envy]);

        // Renvoie une réponse HTTP 201 (Created)
        res.status(201).json({
            message: `Le chien ${first_name} a bien été ajouté !`,
            // Inclut les données insérées et l'ID généré
            dog: { id: result.insertId, first_name, gender, sterilized, birth_date, envy }
        });
    // Capture toute erreur
    } catch (err) {
        // Affiche l'erreur
        console.error(err);
        // Renvoie une erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// PUT : mettre à jour un chien par son ID
dogsRouter.put('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID du chien des paramètres de l'URL
        const id = req.params.id;
        // Extrait les données de mise à jour du corps de la requête
        const { first_name, gender, sterilized, birth_date, envy } = req.body;

        // Définit la requête SQL de mise à jour (UPDATE)
        const sql = `UPDATE dogs SET first_name=?, gender=?, sterilized=?, birth_date=?, envy=? WHERE iddogs=?`;
        // Exécute la mise à jour
        // Note: Ce code ne vérifie pas si la ligne existe avant la mise à jour.
        await pool.query(sql, [first_name, gender, sterilized, birth_date, envy, id]);

        // Renvoie une réponse JSON de succès (assumant que la mise à jour a réussi)
        res.json({ message: "Dog updated", dog: { id, first_name, gender, sterilized, birth_date, envy } });
    // Capture toute erreur
    } catch (err) {
        // Affiche l'erreur
        console.error(err);
        // Renvoie une erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// DELETE : supprimer un chien par son ID
dogsRouter.delete('/:id', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait l'ID du chien des paramètres de l'URL
        const id = req.params.id;
        // Exécute la requête SQL de suppression (DELETE)
        await pool.query("DELETE FROM dogs WHERE iddogs = ?", [id]);
        // Note: Ce code ne vérifie pas si la ligne a été réellement supprimée (`affectedRows`).
        // Renvoie une réponse JSON de succès
        res.json({ message: "Dog deleted" });
    // Capture toute erreur
    } catch (err) {
        // Affiche l'erreur
        console.error(err);
        // Renvoie une erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// GET : récupérer des chiens par nom de race (paramètre de chemin)
dogsRouter.get('/races/:raceName', async (req, res) => {
    // Début du bloc try-catch
    try {
        // Extrait le nom de la race des paramètres de l'URL
        const { raceName } = req.params;

        // Requête SQL utilisant des JOINTURES pour relier chiens, table de jointure et races
        const sql = `
            SELECT d.*
            FROM dogs d
            JOIN races_has_dogs rhd ON d.iddogs = rhd.dogs_iddogs
            JOIN races r ON rhd.races_idraces = r.idraces
            WHERE r.name = ? // Filtre sur le nom de la race
        `;

        // Exécute la requête
        const [rows] = await pool.query(sql, [raceName]);

        // Si aucune ligne n'est trouvée pour cette race, renvoie une erreur HTTP 404
        if (rows.length === 0) return res.status(404).json({ error: `No dogs found for race ${raceName}` });

        // Renvoie les résultats
        res.json(rows);
    // Capture toute erreur
    } catch (err) {
        // Affiche l'erreur
        console.error(err);
        // Renvoie une erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exporte le routeur pour qu'il puisse être utilisé par l'application principale
export { dogsRouter };

        // Exécution d’une requête SQL pour récupérer tous les chiens
        const [rows] = await pool.query("SELECT * FROM dogs");

        // Envoi des résultats au client au format JSON
        res.json(rows);

    // Capture des erreurs éventuelles
    try {
        // Exécution d’une requête SQL pour récupérer tous les chiens
        const [rows] = await pool.query("SELECT * FROM dogs");
    
        // Envoi des résultats au client au format JSON
        res.json(rows);
    
    } catch (err) {
    
        // Affichage de l’erreur dans la console serveur
        console.error("Database Error:", err);
    
        // Réponse HTTP 500 en cas d’erreur serveur
        res.status(500).json({
            error: "Erreur serveur lors de la récupération des chiens."
        });
    }
    
// --- Route GET : récupérer un chien par son ID ---

// Définition d’une route GET avec un paramètre dynamique ":id"
dogsRouter.get('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis les paramètres de l’URL
        const { id } = req.params;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour d’une erreur 400 si l’ID est invalide
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant du chien doit être un nombre entier positif (supérieur à 0)." 
            });
        }

        // Requête SQL pour récupérer le chien correspondant à l’ID
        const [rows] = await pool.query(
            "SELECT * FROM dogs WHERE iddogs = ?", 
            [id]
        );
        
        // Si aucun chien n’est trouvé
        if (rows.length === 0) {

            // Retour d’une erreur 404
            return res.status(404).json({ 
                error: "Chien non trouvé", 
                message: `Aucun chien n'existe avec l'ID ${id}.` 
            });
        }

        // Envoi du chien trouvé au client
        res.json(rows[0]);

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur dans la console
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la recherche du chien." });
    }
});

// --- Route POST : ajouter un nouveau chien ---

// Définition d’une route POST pour créer un chien
dogsRouter.post('/create', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération des données envoyées dans le body de la requête
        const { 
            first_name, 
            gender, 
            sterilized, 
            birth_date, 
            envy 
        } = req.body;

        // Vérification que les champs obligatoires sont présents
        if (!first_name || !gender) {

            // Retour d’une erreur 400 si des données sont manquantes
            return res.status(400).json({ 
                error: "Données manquantes", 
                message: "Les champs 'first_name' et 'gender' sont requis." 
            });
        }

        // Requête SQL pour insérer un nouveau chien
        const sql = `
            INSERT INTO dogs 
            (first_name, gender, sterilized, birth_date, envy) 
            VALUES (?, ?, ?, ?, ?)
        `;

        // Exécution de la requête avec les valeurs fournies
        const [result] = await pool.query(sql, [
            first_name, 
            gender, 
            sterilized, 
            birth_date, 
            envy
        ]);
        
        // Réponse HTTP 201 (création réussie)
        res.status(201).json({
            message: `Le chien ${first_name} a été ajouté avec succès !`,
            dog: { 
                id: result.insertId, 
                first_name, 
                gender, 
                sterilized, 
                birth_date, 
                envy 
            }
        });

    // Gestion des erreurs SQL ou serveur
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Échec de la création du chien." });
    }
});

// --- Route PUT : modifier un chien existant ---

// Définition d’une route PUT pour mettre à jour un chien
dogsRouter.put('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis l’URL
        const { id } = req.params;

        // Récupération des nouvelles données depuis le body
        const { 
            first_name, 
            gender, 
            sterilized, 
            birth_date, 
            envy 
        } = req.body;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour erreur 400
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Requête SQL de mise à jour du chien
        const sql = `
            UPDATE dogs 
            SET first_name=?, gender=?, sterilized=?, birth_date=?, envy=? 
            WHERE iddogs=?
        `;

        // Exécution de la requête
        const [result] = await pool.query(sql, [
            first_name, 
            gender, 
            sterilized, 
            birth_date, 
            envy, 
            id
        ]);

        // Si aucun chien n’a été modifié
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Mise à jour impossible", 
                message: "Ce chien n'existe pas dans la base de données." 
            });
        }

        // Réponse de succès
        res.json({ message: "Les informations du chien ont été mises à jour." });

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la modification des données." });
    }
});

// --- Route DELETE : supprimer un chien ---

// Définition d’une route DELETE pour supprimer un chien
dogsRouter.delete('/:id', async (req, res) => {

    // Début du bloc try
    try {

        // Récupération de l’ID depuis l’URL
        const { id } = req.params;

        // Vérification que l’ID est valide
        if (!isValidId(id)) {

            // Retour erreur 400
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Requête SQL de suppression
        const [result] = await pool.query(
            "DELETE FROM dogs WHERE iddogs = ?", 
            [id]
        );

        // Si aucun chien n’a été supprimé
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Suppression impossible", 
                message: "Ce chien n'existe pas." 
            });
        }

        // Réponse de succès
        res.json({ message: "Le chien a été supprimé avec succès." });

    // Gestion des erreurs
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la suppression." });
    }
});

// Exportation du routeur pour l’utiliser dans l’application principale
export { dogsRouter };

