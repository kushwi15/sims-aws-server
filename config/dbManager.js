const mongoose = require('mongoose');


const connections = {};

const sanitizeDatabaseName = (name) => {
    return name
        .replace(/\s+/g, '_')           // Replace spaces with underscores
        .replace(/[\/\\."*<>:|?]/g, '') // Remove invalid characters
        .toLowerCase()                   // Convert to lowercase for consistency
        .substring(0, 63);              // Limit to 63 characters
};

exports.getConnection = async (databaseName) => {

    const sanitizedDbName = sanitizeDatabaseName(databaseName);
    if (connections[sanitizedDbName]) {
        return connections[sanitizedDbName];
    }

    try {
        const connection = mongoose.createConnection(`${process.env.MONGO_URI}/${sanitizedDbName}`);

        connection.on('connected', () => {
            console.log(`Connected to database: ${sanitizedDbName}`);
        });

        connection.on('error', (error) => {
            console.error(`Database connection error for ${sanitizedDbName}:`, error);
            delete connections[sanitizedDbName]; // Remove failed connection from cache
        });

        connections[sanitizedDbName] = connection;
        return connection;
    } catch (error) {
        console.error(`Failed to create connection to ${sanitizedDbName}:`, error);
        throw error;
    }
};
