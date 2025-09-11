// test-db-connection.js - Test PostgreSQL connection with Render database
require('dotenv').config();
const { testConnection, initializeDatabase } = require('./database');

async function testDatabaseConnection() {
    console.log('🧪 Testing PostgreSQL connection...');
    console.log('📊 Database URL:', process.env.DATABASE_URL ? 'Set (using DATABASE_URL)' : 'Not set');
    
    try {
        // Test connection
        const connected = await testConnection();
        
        if (connected) {
            console.log('✅ Database connection successful!');
            
            // Test table creation
            console.log('🏗️ Testing table initialization...');
            await initializeDatabase();
            console.log('✅ Database tables initialized successfully!');
            
            console.log('\n🎉 All database tests passed!');
            console.log('Your application is ready to use PostgreSQL on Render.');
        } else {
            console.log('❌ Database connection failed');
        }
    } catch (error) {
        console.error('❌ Database test error:', error.message);
        console.error('Full error:', error);
    }
    
    process.exit(0);
}

// Run the test
testDatabaseConnection();
