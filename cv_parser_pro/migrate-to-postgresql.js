// migrate-to-postgresql.js - Migration script from SQLite to PostgreSQL
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// PostgreSQL configuration - supports both DATABASE_URL and individual settings
let pgConfig;

if (process.env.DATABASE_URL) {
    // Use DATABASE_URL (Render, Heroku, etc.)
    pgConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Required for most cloud PostgreSQL services
        }
    };
} else {
    // Use individual environment variables
    pgConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'cv_parser_pro',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
}

// SQLite database path
const sqliteDbPath = process.env.OLD_SQLITE_PATH || path.join(__dirname, 'cvs.db');

async function migrateSQLiteToPostgreSQL() {
    console.log('🚀 Starting migration from SQLite to PostgreSQL...');
    
    // Check if SQLite database exists
    if (!fs.existsSync(sqliteDbPath)) {
        console.log('ℹ️ No SQLite database found at:', sqliteDbPath);
        console.log('✅ Migration not needed - starting fresh with PostgreSQL');
        return;
    }

    const pgPool = new Pool(pgConfig);
    let sqliteDb;
    
    try {
        // Connect to PostgreSQL
        console.log('📊 Connecting to PostgreSQL...');
        const pgClient = await pgPool.connect();
        console.log('✅ Connected to PostgreSQL');

        // Create tables in PostgreSQL if they don't exist
        console.log('🏗️ Creating PostgreSQL tables...');
        await pgClient.query(`
            CREATE TABLE IF NOT EXISTS cvs (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(100),
                address TEXT,
                linkedin VARCHAR(500),
                github VARCHAR(500),
                website VARCHAR(500),
                professional_specialty VARCHAR(255),
                primary_experience_years DECIMAL(4,2) DEFAULT 0,
                secondary_experience_fields JSONB DEFAULT '{}',
                total_years_experience DECIMAL(4,2) DEFAULT 0,
                highest_university_degree VARCHAR(255),
                university_name VARCHAR(255),
                courses_completed JSONB DEFAULT '[]',
                summary TEXT,
                experience_data JSONB DEFAULT '[]',
                education_data JSONB DEFAULT '[]',
                skills_data JSONB DEFAULT '{}',
                projects_data JSONB DEFAULT '[]',
                awards_data JSONB DEFAULT '[]',
                volunteer_work_data JSONB DEFAULT '[]',
                metadata_data JSONB DEFAULT '{}',
                original_language VARCHAR(50) DEFAULT 'English',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Connect to SQLite
        console.log('📊 Connecting to SQLite database...');
        sqliteDb = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY);
        
        // Get all records from SQLite
        console.log('📖 Reading data from SQLite...');
        const sqliteData = await new Promise((resolve, reject) => {
            sqliteDb.all("SELECT * FROM cvs ORDER BY created_at", (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        console.log(`📊 Found ${sqliteData.length} records to migrate`);

        if (sqliteData.length === 0) {
            console.log('ℹ️ No data to migrate');
            pgClient.release();
            return;
        }

        // Migrate each record
        let migratedCount = 0;
        let errorCount = 0;

        for (const row of sqliteData) {
            try {
                const insertQuery = `
                    INSERT INTO cvs (
                        filename, name, email, phone, address, linkedin, github, website,
                        professional_specialty, primary_experience_years, secondary_experience_fields,
                        total_years_experience, highest_university_degree, university_name,
                        courses_completed, summary, experience_data, education_data, skills_data,
                        projects_data, awards_data, volunteer_work_data, metadata_data, original_language,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
                `;

                const values = [
                    row.filename,
                    row.name,
                    row.email,
                    row.phone,
                    row.address,
                    row.linkedin,
                    row.github,
                    row.website,
                    row.professional_specialty,
                    parseFloat(row.primary_experience_years) || 0,
                    row.secondary_experience_fields || '{}',
                    parseFloat(row.total_years_experience) || 0,
                    row.highest_university_degree,
                    row.university_name,
                    row.courses_completed || '[]',
                    row.summary,
                    row.experience_data || '[]',
                    row.education_data || '[]',
                    row.skills_data || '{}',
                    row.projects_data || '[]',
                    row.awards_data || '[]',
                    row.volunteer_work_data || '[]',
                    row.metadata_data || '{}',
                    row.original_language || 'English',
                    row.created_at,
                    row.updated_at
                ];

                await pgClient.query(insertQuery, values);
                migratedCount++;
                console.log(`✅ Migrated record ${migratedCount}/${sqliteData.length}: ${row.name || 'Unknown'}`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Error migrating record ID ${row.id}:`, error.message);
            }
        }

        console.log(`\n🎉 Migration completed!`);
        console.log(`✅ Successfully migrated: ${migratedCount} records`);
        console.log(`❌ Errors: ${errorCount} records`);

        // Create backup of SQLite database
        const backupPath = sqliteDbPath + '.backup.' + new Date().toISOString().replace(/[:.]/g, '-');
        fs.copyFileSync(sqliteDbPath, backupPath);
        console.log(`💾 SQLite database backed up to: ${backupPath}`);

        pgClient.release();

    } catch (error) {
        console.error('❌ Migration error:', error.message);
        throw error;
    } finally {
        if (sqliteDb) {
            sqliteDb.close();
        }
        await pgPool.end();
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateSQLiteToPostgreSQL()
        .then(() => {
            console.log('✅ Migration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { migrateSQLiteToPostgreSQL };
