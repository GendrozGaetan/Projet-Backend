import mysql from 'mysql2/promise';

// Création d'une connexion à la base de données
// Ajuste les valeurs host, user, password et database selon ta config
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dogs'
});

export default pool;