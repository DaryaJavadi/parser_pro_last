// database.js - PostgreSQL Database Configuration and Operations
require('dotenv').config();
const { Pool } = require('pg');

// Database configuration - supports both DATABASE_URL and individual settings
let dbConfig;

if (process.env.DATABASE_URL) {
    // Use DATABASE_URL (Render, Heroku, etc.)
    dbConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Required for most cloud PostgreSQL services
        },
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
        connectionTimeoutMillis: 10000, // Increased timeout for cloud connections
    };
} else {
    // Use individual environment variables
    dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'cv_parser_pro',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
        connectionTimeoutMillis: 2000, // How long to wait when connecting a client
    };
}

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Error connecting to PostgreSQL database:', error.message);
        return false;
    }
}

// Initialize database tables
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Create CVs table with PostgreSQL-specific data types
        await client.query(`
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

        // Create indexes for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_cvs_name ON cvs(name);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_cvs_email ON cvs(email);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_cvs_professional_specialty ON cvs(professional_specialty);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_cvs_created_at ON cvs(created_at);
        `);

        // Create trigger for updating updated_at timestamp
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_cvs_updated_at ON cvs;
        `);

        await client.query(`
            CREATE TRIGGER update_cvs_updated_at
                BEFORE UPDATE ON cvs
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log('✅ Database tables and indexes created successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Database operations
async function saveCVToDatabase(cvData) {
    const client = await pool.connect();
    try {
        console.log(`💾 Saving CV to database: ${cvData.name || 'Unknown'}`);
        
        const query = `
            INSERT INTO cvs (
                filename, name, email, phone, address, linkedin, github, website,
                professional_specialty, primary_experience_years, secondary_experience_fields,
                total_years_experience, highest_university_degree, university_name,
                courses_completed, summary, experience_data, education_data, skills_data,
                projects_data, awards_data, volunteer_work_data, metadata_data, original_language
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
            RETURNING id
        `;
        
        const values = [
            cvData.metadata?.filename || 'Unknown',
            cvData.name,
            cvData.email,
            cvData.phone,
            cvData.address,
            cvData.linkedin,
            cvData.github,
            cvData.website,
            cvData.professional_specialty,
            cvData.primary_experience_years || 0,
            JSON.stringify(cvData.secondary_experience_fields || {}),
            cvData.total_years_experience || 0,
            cvData.highest_university_degree,
            cvData.university_name,
            JSON.stringify(cvData.courses_completed || []),
            cvData.summary,
            JSON.stringify(cvData.experience || []),
            JSON.stringify(cvData.education || []),
            JSON.stringify(cvData.skills || {}),
            JSON.stringify(cvData.projects || []),
            JSON.stringify(cvData.awards || []),
            JSON.stringify(cvData.volunteer_work || []),
            JSON.stringify(cvData.metadata || {}),
            cvData.original_language || 'English'
        ];
        
        const result = await client.query(query, values);
        const insertedId = result.rows[0].id;
        
        console.log(`✅ CV saved to database with ID: ${insertedId}`);
        return insertedId;
    } catch (error) {
        console.error('❌ Database save error:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

async function getAllCVsFromDatabase() {
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM cvs ORDER BY created_at DESC");
        const rows = result.rows;
        
        console.log(`📊 Retrieved ${rows.length} CVs from database`);
        
        const cvs = rows.map(row => {
            try {
                return {
                    id: row.id,
                    filename: row.filename,
                    name: row.name,
                    email: row.email,
                    phone: row.phone,
                    address: row.address,
                    linkedin: row.linkedin,
                    github: row.github,
                    website: row.website,
                    professional_specialty: row.professional_specialty,
                    primary_experience_years: parseFloat(row.primary_experience_years) || 0,
                    secondary_experience_fields: typeof row.secondary_experience_fields === 'string' 
                        ? JSON.parse(row.secondary_experience_fields) 
                        : row.secondary_experience_fields || {},
                    total_years_experience: parseFloat(row.total_years_experience) || 0,
                    highest_university_degree: row.highest_university_degree,
                    university_name: row.university_name,
                    courses_completed: typeof row.courses_completed === 'string'
                        ? JSON.parse(row.courses_completed)
                        : row.courses_completed || [],
                    summary: row.summary,
                    experience: typeof row.experience_data === 'string'
                        ? JSON.parse(row.experience_data)
                        : row.experience_data || [],
                    education: typeof row.education_data === 'string'
                        ? JSON.parse(row.education_data)
                        : row.education_data || [],
                    skills: typeof row.skills_data === 'string'
                        ? JSON.parse(row.skills_data)
                        : row.skills_data || {},
                    projects: typeof row.projects_data === 'string'
                        ? JSON.parse(row.projects_data)
                        : row.projects_data || [],
                    awards: typeof row.awards_data === 'string'
                        ? JSON.parse(row.awards_data)
                        : row.awards_data || [],
                    volunteer_work: typeof row.volunteer_work_data === 'string'
                        ? JSON.parse(row.volunteer_work_data)
                        : row.volunteer_work_data || [],
                    original_language: row.original_language || 'English',
                    metadata: typeof row.metadata_data === 'string'
                        ? JSON.parse(row.metadata_data)
                        : row.metadata_data || {},
                    created_at: row.created_at,
                    updated_at: row.updated_at
                };
            } catch (parseError) {
                console.error(`❌ Error parsing CV data for ID ${row.id}:`, parseError.message);
                return null;
            }
        }).filter(cv => cv !== null);
        
        return cvs;
    } catch (error) {
        console.error('❌ Database query error:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Get CV by ID
async function getCVById(id) {
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM cvs WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return null;
        }
        
        const row = result.rows[0];
        return {
            id: row.id,
            filename: row.filename,
            name: row.name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            linkedin: row.linkedin,
            github: row.github,
            website: row.website,
            professional_specialty: row.professional_specialty,
            primary_experience_years: parseFloat(row.primary_experience_years) || 0,
            secondary_experience_fields: typeof row.secondary_experience_fields === 'string' 
                ? JSON.parse(row.secondary_experience_fields) 
                : row.secondary_experience_fields || {},
            total_years_experience: parseFloat(row.total_years_experience) || 0,
            highest_university_degree: row.highest_university_degree,
            university_name: row.university_name,
            courses_completed: typeof row.courses_completed === 'string'
                ? JSON.parse(row.courses_completed)
                : row.courses_completed || [],
            summary: row.summary,
            experience: typeof row.experience_data === 'string'
                ? JSON.parse(row.experience_data)
                : row.experience_data || [],
            education: typeof row.education_data === 'string'
                ? JSON.parse(row.education_data)
                : row.education_data || [],
            skills: typeof row.skills_data === 'string'
                ? JSON.parse(row.skills_data)
                : row.skills_data || {},
            projects: typeof row.projects_data === 'string'
                ? JSON.parse(row.projects_data)
                : row.projects_data || [],
            awards: typeof row.awards_data === 'string'
                ? JSON.parse(row.awards_data)
                : row.awards_data || [],
            volunteer_work: typeof row.volunteer_work_data === 'string'
                ? JSON.parse(row.volunteer_work_data)
                : row.volunteer_work_data || [],
            original_language: row.original_language || 'English',
            metadata: typeof row.metadata_data === 'string'
                ? JSON.parse(row.metadata_data)
                : row.metadata_data || {},
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    } catch (error) {
        console.error('❌ Database query error:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Delete CV by ID
async function deleteCVById(id) {
    const client = await pool.connect();
    try {
        const result = await client.query("DELETE FROM cvs WHERE id = $1 RETURNING id", [id]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('❌ Database delete error:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Close database connection pool
async function closeDatabase() {
    try {
        await pool.end();
        console.log('✅ Database connection pool closed');
    } catch (error) {
        console.error('❌ Error closing database connection pool:', error.message);
    }
}

module.exports = {
    pool,
    testConnection,
    initializeDatabase,
    saveCVToDatabase,
    getAllCVsFromDatabase,
    getCVById,
    deleteCVById,
    closeDatabase
};
