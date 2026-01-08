// Importation du framework Express
import express from "express";
// Importation de la connexion à la base de données (pool de connexions)
import pool from "../db/db.js";

// Initialisation du routeur Express pour isoler les routes des localités
const localityRouter = express.Router();

/**
 * Fonction utilitaire pour valider les identifiants (ID)
 * Elle vérifie que l'ID est un nombre, que c'est un entier, et qu'il est supérieur à 0.
 */
const isValidId = (id) => !isNaN(id) && Number.isInteger(Number(id)) && Number(id) > 0;

// --- ROUTE GET : Récupérer toutes les localités de la base de données ---
localityRouter.get('/', async (req, res) => {
    try {
        // Exécution de la requête SQL de sélection
        const [rows] = await pool.query("SELECT * FROM locality");
        // Renvoi des résultats au format JSON avec un statut 200 par défaut
        res.json(rows);
    } catch (err) {
        // Affichage de l'erreur dans la console du serveur pour le débogage
        console.error("Database Error:", err);
        // Réponse en cas d'erreur serveur avec un code 500
        res.status(500).json({ error: "Erreur serveur lors de la récupération des localités." });
    }
});

// --- ROUTE GET : Récupérer une localité spécifique par son ID ---
localityRouter.get('/:id', async (req, res) => {
    try {
        // Extraction de l'ID depuis les paramètres de l'URL
        const { id } = req.params;

        // Validation de l'ID avant d'interroger la base de données
        if (!isValidId(id)) {
            // Si l'ID est invalide (ex: texte ou négatif), on renvoie une erreur 400
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif (supérieur à 0)." 
            });
        }

        // Requête SQL sécurisée avec un paramètre préparé (?) pour éviter les injections SQL
        const [rows] = await pool.query("SELECT * FROM locality WHERE idlocality = ?", [id]);
        
        // Vérification si la base de données a trouvé une correspondance
        if (rows.length === 0) {
            // Si aucun résultat, renvoi d'une erreur 404 (Non trouvé)
            return res.status(404).json({ 
                error: "Localité non trouvée", 
                message: `Aucune localité n'existe avec l'ID ${id}.` 
            });
        }
        // Renvoi de la première ligne trouvée (l'objet localité)
        res.json(rows[0]);
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur serveur lors de la recherche." });
    }
});

// --- ROUTE POST : Créer une ou plusieurs localités ---
localityRouter.post('/create', async (req, res) => {
    try {
        // Récupération des données envoyées dans le corps de la requête
        const data = req.body;

        // Gestion de l'insertion en masse si les données sont un tableau (Array)
        if (Array.isArray(data)) {
            // Transformation du tableau d'objets en tableau de tableaux pour MySQL
            const values = data.map(l => [
                l.name, l.postal_code, l.postal_comp, l.toponyme, l.canton_code, l.langage_code
            ]);

            // Requête SQL pour insertion multiple
            const sql = `INSERT INTO locality (name, postal_code, postal_comp, toponyme, canton_code, langage_code) VALUES ?`;
            // Exécution de l'insertion groupée
            const [result] = await pool.query(sql, [values]);

            // Réponse confirmant le nombre de lignes ajoutées
            return res.status(201).json({
                message: `${result.affectedRows} localités ajoutées avec succès !`,
                count: result.affectedRows
            });
        } 

        // Gestion de l'insertion d'un seul objet (si ce n'est pas un tableau)
        const { name, postal_code, postal_comp, toponyme, canton_code, langage_code } = data;
        
        // Vérification des champs obligatoires (nom et code postal)
        if (!name || !postal_code) {
            return res.status(400).json({ 
                error: "Données manquantes", 
                message: "Le nom et le code postal sont obligatoires." 
            });
        }

        // Requête SQL d'insertion classique
        const sql = `INSERT INTO locality (name, postal_code, postal_comp, toponyme, canton_code, langage_code) VALUES (?, ?, ?, ?, ?, ?)`;
        // Exécution de la requête
        const [result] = await pool.query(sql, [name, postal_code, postal_comp, toponyme, canton_code, langage_code]);

        // Réponse avec le statut 201 (Créé) et les détails de la nouvelle localité
        res.status(201).json({
            message: `Localité ${name} ajoutée avec succès !`,
            locality: { id: result.insertId, name, postal_code, postal_comp, toponyme, canton_code, langage_code }
        });

    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur lors de la création de la localité (vérifiez les contraintes SQL)." });
    }
});

// --- ROUTE PUT : Modifier une localité existante via son ID ---
localityRouter.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validation de l'ID fourni dans l'URL
        if (!isValidId(id)) {
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Extraction des nouvelles données depuis le corps de la requête
        const { name, postal_code, postal_comp, toponyme, canton_code, langage_code } = req.body;
        // Requête SQL de mise à jour
        const sql = `UPDATE locality SET name=?, postal_code=?, postal_comp=?, toponyme=?, canton_code=?, langage_code=? WHERE idlocality=?`;
        // Exécution de la mise à jour
        const [result] = await pool.query(sql, [name, postal_code, postal_comp, toponyme, canton_code, langage_code, id]);

        // Vérification si une ligne a effectivement été modifiée
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                error: "Mise à jour impossible", 
                message: "Cette localité n'existe pas." 
            });
        }

        // Réponse de succès
        res.json({ message: "Localité mise à jour avec succès." });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Erreur lors de la modification de la localité." });
    }
});

// --- ROUTE DELETE : Supprimer une localité via son ID ---
localityRouter.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validation de l'ID
        if (!isValidId(id)) {
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif pour la suppression." 
            });
        }

        // Requête SQL de suppression
        const [result] = await pool.query("DELETE FROM locality WHERE idlocality = ?", [id]);
        
        // Vérification si une ligne a été supprimée
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                error: "Suppression impossible", 
                message: "Cette localité n'existe pas." 
            });
        }

        // Réponse de succès
        res.json({ message: "Localité supprimée avec succès." });
    } catch (err) {
        console.error("Database Error:", err);
        // Note : Souvent l'erreur ici arrive si la localité est liée à un client (clé étrangère)
        res.status(500).json({ error: "Erreur lors de la suppression (vérifiez si elle est liée à d'autres données)." });
    }
});

// Exportation du routeur pour qu'il soit utilisable dans app.mjs
export { localityRouter };