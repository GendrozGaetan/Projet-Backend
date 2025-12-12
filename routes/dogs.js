// Importe le framework Express
import express from "express";
// Importe l'objet de connexion à la base de données (pool de connexions)
import pool from "../db/db.js";

// Crée un nouvel objet Router Express pour gérer les routes spécifiques aux 'dogs'
const dogsRouter = express.Router();


// Définit la route GET pour récupérer tous les chiens (avec filtrage par race, âge, genre, stérilisation)
dogsRouter.get('/', async (req, res) => {
    // Début du bloc try-catch pour la gestion des erreurs
    try {
        // Extrait les paramètres de requête (query) pour le filtrage
        const { race, age, gender, sterilized } = req.query;
        // Tableau pour stocker les clauses de condition (WHERE)
        const conditions = [];
        // Tableau pour stocker les valeurs des paramètres à lier à la requête SQL
        const values = [];

        // Vérifie si le filtre 'race' est présent
        if (race) {
            // Ajoute une condition pour filtrer par le nom de la race (nécessite une jointure)
            conditions.push("races.name = ?");
            // Ajoute la valeur du nom de la race aux paramètres
            values.push(race);
        }

        // Vérifie si le filtre 'age' est présent
        if (age) {
            // Calcule l'âge en années en soustrayant l'année de naissance à l'année actuelle (fonction MySQL)
            conditions.push("YEAR(CURDATE()) - YEAR(dogs.birth_date) = ?");
            // Ajoute la valeur de l'âge souhaité aux paramètres
            values.push(age);
        }


        // Vérifie si le filtre 'gender' est présent
        if (gender) {
            // Ajoute une condition pour filtrer par genre
            conditions.push("dogs.gender = ?");
            // Ajoute la valeur du genre aux paramètres
            values.push(gender);
        }


        // Vérifie si le filtre 'sterilized' est présent
        if (sterilized) {
            // Ajoute une condition pour filtrer par statut de stérilisation
            conditions.push("dogs.sterilized = ?");
            // Ajoute la valeur de stérilisation (typiquement 0 ou 1) aux paramètres
            values.push(sterilized);
        }

        // Requête SQL de base : sélectionne toutes les colonnes de `dogs` et utilise les jointures nécessaires
        let sql = "SELECT dogs.* FROM dogs LEFT JOIN races_has_dogs rhd ON dogs.iddogs = rhd.dogs_iddogs LEFT JOIN races ON rhd.races_idraces = races.idraces";
        
        // Vérifie s'il y a des conditions de filtrage
        if (conditions.length > 0) {
            // Ajoute la clause WHERE, en joignant les conditions par ' AND '
            sql += " WHERE " + conditions.join(" AND ");
        }

        // Exécute la requête SQL dans la base de données
        const [rows] = await pool.query(sql, values);
        // Renvoie les résultats (les chiens trouvés) au format JSON
        res.json(rows);

    // Capture toute erreur
    } catch (err) {
        // Affiche l'erreur MySQL dans la console du serveur
        console.error("Erreur MySQL :", err);
        // Renvoie une réponse d'erreur HTTP 500
        res.status(500).json({ error: "Erreur serveur" });
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