// Importation du framework Express pour la gestion des routes
import express from "express";
// Importation de la connexion à la base de données (pool de connexions)
import pool from "../db/db.js";

// Création du routeur Express pour isoler les fonctionnalités liées aux chiens
const dogsRouter = express.Router();

/**
 * FONCTION UTILITAIRE : isValidId
 * Vérifie que l'identifiant (ID) fourni est bien un nombre, un entier, et positif.
 */
const isValidId = (id) => !isNaN(id) && Number.isInteger(Number(id)) && Number(id) > 0;

// --- ROUTE GET : Récupérer tous les chiens (avec système de filtres optionnels) ---
dogsRouter.get('/', async (req, res) => {
    try {
        // Extraction des paramètres de recherche depuis l'URL (?race=Poodle&gender=M...)
        const { race, birth_date, gender, sterilized, first_name } = req.query;

        // Tableaux pour construire la requête SQL dynamiquement
        const conditions = [];
        const values = [];

        // Filtre par race : vérifie si la race existe d'abord dans la table 'races'
        if (race) {
            const [raceRows] = await pool.query("SELECT * FROM races WHERE name = ?", [race]);
            if (raceRows.length === 0) {
                return res.status(400).json({ error: "Race invalide", message: `La race '${race}' n'existe pas.` });
            }
            conditions.push("races.name = ?");
            values.push(race);
        }

        // Filtre par date de naissance : vérifie le format YYYY-MM-DD
        if (birth_date) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
                return res.status(400).json({ error: "Date invalide", message: "Le format doit être AAAA-MM-JJ." });
            }
            conditions.push("dogs.birth_date = ?");
            values.push(birth_date);
        }

        // Filtre par genre : n'accepte que 'M' ou 'F'
        if (gender) {
            if (!["M", "F"].includes(gender.toUpperCase())) {
                return res.status(400).json({ error: "Genre invalide", message: "Le genre doit être 'M' ou 'F'." });
            }
            conditions.push("dogs.gender = ?");
            values.push(gender.toUpperCase());
        }

        // Filtre stérilisé : vérifie que la valeur est 0 (non) ou 1 (oui)
        if (sterilized !== undefined) {
            if (!["0", "1"].includes(String(sterilized))) {
                return res.status(400).json({ error: "Valeur invalide", message: "Stérilisé doit être 0 ou 1." });
            }
            conditions.push("dogs.sterilized = ?");
            values.push(sterilized);
        }

        // Filtre par prénom : recherche partielle 
        if (first_name) {
            conditions.push("dogs.first_name LIKE ?");
            values.push(`${first_name}%`);
        }

        // Construction de la requête SQL de base avec les jointures pour les races
        let sql = `SELECT dogs.* FROM dogs 
                   LEFT JOIN races_has_dogs rhd ON dogs.iddogs = rhd.dogs_iddogs 
                   LEFT JOIN races ON rhd.races_idraces = races.idraces`;

        // Ajout de la clause WHERE si des filtres ont été ajoutés
        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }

        // Exécution de la requête SQL finale
        const [rows] = await pool.query(sql, values);

        // Si aucun chien ne correspond aux critères
        if (rows.length === 0) {
            return res.status(404).json({ error: "Aucun résultat", message: "Aucun chien ne correspond à ces critères." });
        }

        // Renvoi de la liste des chiens trouvés
        res.json(rows);

    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des chiens." });
    }
});

// --- ROUTE GET : Récupérer un chien spécifique par son ID ---
dogsRouter.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validation de l'ID avant requête
        if (!isValidId(id)) {
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Requête pour trouver le chien par son ID
        const [rows] = await pool.query("SELECT * FROM dogs WHERE iddogs = ?", [id]);

        // Si le chien n'existe pas
        if (rows.length === 0) {
            return res.status(404).json({ error: "Chien non trouvé", message: `ID ${id} inexistant.` });
        }

        // Renvoi des données du chien
        res.json(rows[0]);
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// --- ROUTE POST : Ajouter un nouveau chien ---
dogsRouter.post('/create', async (req, res) => {
    try {
        // Extraction des données du corps de la requête
        const { first_name, gender, sterilized, birth_date, envy } = req.body;

        // Vérification que tous les champs obligatoires sont présents
        if (!first_name || !gender || sterilized === undefined || !birth_date) {
            return res.status(400).json({ error: "Données manquantes", message: "Tous les champs sont requis." });
        }

        // Insertion SQL
        const sql = `INSERT INTO dogs (first_name, gender, sterilized, birth_date, envy) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [first_name, gender.toUpperCase(), sterilized, birth_date, envy]);

        // Réponse confirmant la création
        res.status(201).json({
            message: `Le chien ${first_name} a été ajouté avec succès !`,
            dog: { id: result.insertId, first_name, gender, sterilized, birth_date, envy }
        });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur lors de la création du chien." });
    }
});

// --- ROUTE PUT : Mettre à jour les informations d'un chien ---
dogsRouter.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, gender, sterilized, birth_date, envy } = req.body;

        // Validation de l'ID
        if (!isValidId(id)) {
            return res.status(400).json({ error: "Format d'ID invalide" });
        }

        // Requête de mise à jour
        const sql = `UPDATE dogs SET first_name=?, gender=?, sterilized=?, birth_date=?, envy=? WHERE iddogs=?`;
        const [result] = await pool.query(sql, [first_name, gender, sterilized, birth_date, envy, id]);

        // Vérification si le chien existait pour être modifié
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Mise à jour impossible", message: "Ce chien n'existe pas." });
        }

        res.json({ message: "Chien mis à jour avec succès." });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur lors de la modification." });
    }
});

// --- ROUTE DELETE : Supprimer un chien par son ID ---
dogsRouter.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validation de l'ID
        if (!isValidId(id)) {
            return res.status(400).json({ error: "Format d'ID invalide" });
        }

        // Requête de suppression
        const [result] = await pool.query("DELETE FROM dogs WHERE iddogs = ?", [id]);
        
        // Vérification si le chien existait
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Suppression impossible", message: "Ce chien n'existe pas." });
        }

        res.json({ message: "Chien supprimé avec succès." });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur lors de la suppression." });
    }
});

// Exportation du routeur pour utilisation dans app.mjs
export { dogsRouter };