// Importe le framework web Express pour la création du routeur.
import express from "express";
// Importe l'objet 'pool' (connexion pool à la base de données) depuis le fichier db.js.
import pool from "../db/db.js";

// Crée un nouvel objet Router Express pour gérer les routes liées aux maladies.
const diseasesRouter = express.Router();

// Définit la route GET pour récupérer une liste de maladies, avec possibilité de filtrage.
diseasesRouter.get('/', async (req, res) => {
    // Début du bloc try-catch pour la gestion des erreurs.
    try {
        // Extrait les paramètres de requête possibles (filtres) de l'URL.
        const { name, symptoms, zoonose, vaccin } = req.query;
        // Initialise la requête SQL de base pour sélectionner toutes les colonnes de la table 'diseases'.
        let sql = "SELECT * FROM diseases";
        // Tableau pour stocker les valeurs des paramètres à lier à la requête SQL (pour éviter les injections SQL).
        const params = [];
        // Tableau pour stocker les conditions de filtrage de la clause WHERE.
        const conditions = [];

        // Vérifie si un filtre 'name' est présent.
        if (name) {
            // Ajoute une condition LIKE pour la recherche partielle par nom (insensible à la casse/position).
            conditions.push("name LIKE ?");
            // Ajoute le paramètre de recherche, entouré de '%' pour la recherche partielle.
            params.push(`%${name}%`);
        }
        // Vérifie si un filtre 'symptoms' est présent.
        if (symptoms) {
            // Ajoute une condition LIKE pour la recherche partielle par symptômes.
            conditions.push("symptoms LIKE ?");
            // Ajoute le paramètre de recherche de symptômes.
            params.push(`%${symptoms}%`);
        }
        // Vérifie si un filtre 'zoonose' est présent (doit être défini, y compris s'il est false/0).
        if (zoonose !== undefined) {
            // Ajoute une condition d'égalité pour le champ 'zoonose'.
            conditions.push("zoonose = ?");
            // Convertit la valeur en nombre et l'ajoute aux paramètres.
            params.push(Number(zoonose));
        }
        // Vérifie si un filtre 'vaccin' est présent.
        if (vaccin !== undefined) {
            // Ajoute une condition d'égalité pour le champ 'vaccin'.
            conditions.push("vaccin = ?");
            // Convertit la valeur en nombre et l'ajoute aux paramètres.
            params.push(Number(vaccin));
        }

        // Vérifie s'il y a des conditions de filtrage à appliquer.
        if (conditions.length > 0) {
            // Ajoute la clause WHERE à la requête SQL, en joignant les conditions avec ' AND '.
            sql += " WHERE " + conditions.join(" AND ");
        }

        // Exécute la requête SQL avec les paramètres. La réponse est destucturée en [rows] (les résultats).
        const [rows] = await pool.query(sql, params);
        // Envoie la liste des résultats trouvés (rows) en réponse JSON.
        res.json(rows);
    // Capture et gère les erreurs qui pourraient survenir lors de l'exécution du try.
    } catch (err) {
        // Affiche l'erreur MySQL détaillée dans la console du serveur.
        console.error("MySQL Error:", err);
        // Envoie une réponse d'erreur 500 (Erreur Serveur) avec un message générique.
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route GET pour récupérer une seule maladie par son ID.
diseasesRouter.get('/:id', async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait l'ID de la maladie des paramètres de l'URL.
        const id = req.params.id;
        // Vérifie si l'ID n'est pas un nombre (validation simple).
        if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

        // Exécute la requête SQL pour trouver la maladie avec l'ID spécifié.
        const [rows] = await pool.query("SELECT * FROM diseases WHERE iddiseases = ?", [id]);
        // Vérifie si aucun résultat n'a été trouvé.
        if (rows.length === 0) return res.status(404).json({ error: "Disease not found" });

        // Envoie le premier élément du tableau de résultats (la maladie trouvée) en réponse JSON.
        res.json(rows[0]);
    // Capture et gère les erreurs.
    } catch (err) {
        // Envoie une réponse d'erreur 500 (Erreur Serveur).
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Définit la route POST pour créer une nouvelle maladie.
diseasesRouter.post('/create', async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait les données de la nouvelle maladie du corps de la requête (req.body).
        const { name, description, symptoms, prevention, heal, vaccin, zoonose } = req.body;
        // Valide que les champs 'name' et 'description' sont obligatoires.
        if (!name || !description) return res.status(400).json({ error: "Les champs name et description sont obligatoires" });

        // Requête SQL pour insérer une nouvelle entrée dans la table 'diseases'.
        const sql = `INSERT INTO diseases (name, description, symptoms, prevention, heal, vaccin, zoonose) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        // Exécute la requête d'insertion avec les données fournies.
        const [result] = await pool.query(sql, [name, description, symptoms, prevention, heal, vaccin, zoonose]);

        // Envoie une réponse de succès 201 (Créé) avec un message et les détails de la maladie insérée (y compris l'ID généré).
        res.status(201).json({
            message: `La maladie ${name} a bien été ajoutée !`,
            disease: { id: result.insertId, name, description, symptoms, prevention, heal, vaccin, zoonose }
        });
    // Capture et gère les erreurs (souvent des erreurs de validation de base de données).
    } catch (err) {
        // Affiche l'erreur MySQL dans la console.
        console.error("MySQL Error:", err);
        // Envoie une réponse d'erreur 500, incluant le message d'erreur de la base de données.
        res.status(500).json({ error: err.message });
    }
});


// Définit la route PUT pour mettre à jour une maladie existante par son ID.
diseasesRouter.put('/:id', async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait l'ID de la maladie des paramètres de l'URL.
        const id = req.params.id;
        // Extrait les nouvelles données de mise à jour du corps de la requête.
        const { name, description, symptoms, prevention, heal, vaccin, zoonose } = req.body;

        // Exécute la requête SQL pour mettre à jour les champs de la maladie avec l'ID spécifié.
        const [result] = await pool.query(
            // Requête SQL d'UPDATE avec tous les champs et la condition WHERE sur l'ID.
            `UPDATE diseases SET name=?, description=?, symptoms=?, prevention=?, heal=?, vaccin=?, zoonose=? WHERE iddiseases=?`,
            // Liste des paramètres (les nouvelles valeurs, suivies de l'ID).
            [name, description, symptoms, prevention, heal, vaccin, zoonose, id]
        );

        // Vérifie si aucune ligne n'a été affectée (l'ID n'existe pas).
        if (result.affectedRows === 0) return res.status(404).json({ error: "Disease not found" });

        // Envoie une réponse de succès avec un message et les données mises à jour.
        res.json({ message: "Maladie mise à jour", disease: { id, name, description, symptoms, prevention, heal, vaccin, zoonose } });
    // Capture et gère les erreurs.
    } catch (err) {
        // Envoie une réponse d'erreur 500.
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// Définit la route DELETE pour supprimer une maladie par son ID.
diseasesRouter.delete('/:id', async (req, res) => {
    // Début du bloc try-catch.
    try {
        // Extrait l'ID de la maladie des paramètres de l'URL.
        const id = req.params.id;
        // Exécute la requête SQL de suppression pour l'ID spécifié.
        const [result] = await pool.query("DELETE FROM diseases WHERE iddiseases = ?", [id]);
        // Vérifie si aucune ligne n'a été affectée (l'ID n'existe pas).
        if (result.affectedRows === 0) return res.status(404).json({ error: "Disease not found" });
        // Envoie une réponse de succès avec un message de confirmation.
        res.json({ message: "Maladie supprimée" });
    // Capture et gère les erreurs.
    } catch (err) {
        // Envoie une réponse d'erreur 500.
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exporte le routeur pour qu'il puisse être utilisé par l'application Express principale.
export { diseasesRouter };