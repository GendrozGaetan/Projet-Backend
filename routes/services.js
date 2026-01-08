// Importation du framework Express pour créer le serveur et les routes
import express from "express";

// Importation du pool de connexion à la base de données (MySQL)
import pool from "../db/db.js";

// Création d’un routeur Express dédié aux services
const servicesRouter = express.Router();

// Fonction utilitaire pour vérifier si un ID est valide
// → doit être un nombre, entier, et strictement supérieur à 0
const isValidId = (id) => !isNaN(id) && Number.isInteger(Number(id)) && Number(id) > 0;

// --- Route GET : récupérer tous les services ---

// Définition d’une route GET sur "/" pour récupérer tous les services
servicesRouter.get('/', async (req, res) => {

    // Bloc try pour gérer les erreurs proprement
    try {

        // Exécution d’une requête SQL pour récupérer tous les services
        const [rows] = await pool.query("SELECT * FROM services");

        // Envoi des résultats au format JSON au client
        res.json(rows);

    // Capture des erreurs éventuelles
    } catch (err) {

        // Affichage de l’erreur dans la console serveur
        console.error("Database Error:", err);

        // Réponse HTTP 500 en cas d’erreur serveur
        res.status(500).json({ error: "Erreur serveur lors de la récupération des services." });
    }
});

// --- Route GET : récupérer un service par son ID ---

// Définition d’une route GET avec un paramètre dynamique ":id"
servicesRouter.get('/:id', async (req, res) => {

    // Bloc try pour capturer les erreurs
    try {

        // Récupération de l’ID depuis les paramètres de l’URL
        const { id } = req.params;

        // Vérification de la validité de l’ID
        if (!isValidId(id)) {

            // Retour d’une erreur 400 si l’ID est invalide
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant du service doit être un nombre entier positif (supérieur à 0)." 
            });
        }

        // Requête SQL pour récupérer le service correspondant à l’ID
        const [rows] = await pool.query(
            "SELECT * FROM services WHERE idservices = ?", 
            [id]
        );
        
        // Si aucun service n’est trouvé
        if (rows.length === 0) {

            // Retour d’une erreur 404
            return res.status(404).json({ 
                error: "Service non trouvé", 
                message: `Aucun service n'existe avec l'ID ${id}.` 
            });
        }

        // Envoi du service trouvé au client
        res.json(rows[0]);

    // Gestion des erreurs
    } catch (err) {

        // Log de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la recherche du service." });
    }
});

// --- Route POST : ajouter un nouveau service ---

// Définition d’une route POST pour créer un service
servicesRouter.post('/create', async (req, res) => {

    // Bloc try/catch
    try {

        // Récupération des données envoyées dans le body de la requête
        const { 
            date, 
            zone, 
            time, 
            dogs_iddogs, 
            clients_idclients, 
            locality_idlocality 
        } = req.body;

        // Vérification minimale des clés étrangères obligatoires
        if (!dogs_iddogs || !clients_idclients) {

            // Retour d’une erreur 400 si des données sont manquantes
            return res.status(400).json({ 
                error: "Données manquantes", 
                message: "Les IDs du chien et du client sont obligatoires pour créer un service." 
            });
        }

        // Requête SQL d’insertion d’un nouveau service
        const sql = `
            INSERT INTO services 
            (date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Exécution de la requête avec les valeurs fournies
        const [result] = await pool.query(sql, [
            date, 
            zone, 
            time, 
            dogs_iddogs, 
            clients_idclients, 
            locality_idlocality
        ]);
        
        // Réponse HTTP 201 (création réussie)
        res.status(201).json({
            message: `Le service pour le chien ID ${dogs_iddogs} a été ajouté avec succès !`,
            service: { 
                id: result.insertId, 
                date, 
                zone, 
                time, 
                dogs_iddogs, 
                clients_idclients, 
                locality_idlocality 
            }
        });

    // Gestion des erreurs SQL ou serveur
    } catch (err) {

        // Affichage de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Échec de la création du service." });
    }
});

// --- Route PUT : modifier un service existant ---

// Définition d’une route PUT pour mettre à jour un service
servicesRouter.put('/:id', async (req, res) => {

    // Bloc try/catch
    try {

        // Récupération de l’ID depuis l’URL
        const { id } = req.params;

        // Récupération des nouvelles données depuis le body
        const { 
            date, 
            zone, 
            time, 
            dogs_iddogs, 
            clients_idclients, 
            locality_idlocality 
        } = req.body;

        // Vérification de la validité de l’ID
        if (!isValidId(id)) {

            // Retour erreur 400 si ID invalide
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Requête SQL de mise à jour du service
        const sql = `
            UPDATE services 
            SET date=?, zone=?, time=?, dogs_iddogs=?, clients_idclients=?, locality_idlocality=? 
            WHERE idservices=?
        `;

        // Exécution de la requête
        const [result] = await pool.query(sql, [
            date, 
            zone, 
            time, 
            dogs_iddogs, 
            clients_idclients, 
            locality_idlocality, 
            id
        ]);

        // Si aucun service n’a été modifié
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Mise à jour impossible", 
                message: "Ce service n'existe pas dans la base de données." 
            });
        }

        // Réponse de succès
        res.json({ 
            message: "Service mis à jour avec succès.",
            service: { 
                id, 
                date, 
                zone, 
                time, 
                dogs_iddogs, 
                clients_idclients, 
                locality_idlocality 
            }
        });

    // Gestion des erreurs
    } catch (err) {

        // Log de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la modification des données." });
    }
});

// --- Route DELETE : supprimer un service ---

// Définition d’une route DELETE pour supprimer un service
servicesRouter.delete('/:id', async (req, res) => {

    // Bloc try/catch
    try {

        // Récupération de l’ID depuis l’URL
        const { id } = req.params;

        // Vérification de la validité de l’ID
        if (!isValidId(id)) {

            // Retour erreur 400
            return res.status(400).json({ 
                error: "Format d'ID invalide", 
                message: "L'identifiant doit être un nombre entier positif." 
            });
        }

        // Requête SQL de suppression
        const [result] = await pool.query(
            "DELETE FROM services WHERE idservices = ?", 
            [id]
        );

        // Si aucun service n’a été supprimé
        if (result.affectedRows === 0) {

            // Retour erreur 404
            return res.status(404).json({ 
                error: "Suppression impossible", 
                message: "Ce service n'existe pas." 
            });
        }

        // Réponse de succès
        res.json({ message: "Le service a été supprimé avec succès." });

    // Gestion des erreurs
    } catch (err) {

        // Log de l’erreur
        console.error("Database Error:", err);

        // Réponse HTTP 500
        res.status(500).json({ error: "Erreur lors de la suppression." });
    }
});

// Exportation du routeur pour l’utiliser dans l’application principale
export { servicesRouter };
