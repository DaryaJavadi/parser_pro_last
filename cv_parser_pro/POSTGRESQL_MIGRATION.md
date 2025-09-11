# PostgreSQL Migration Guide

This guide will help you migrate your CV Parser Pro application from SQLite to PostgreSQL.

## Prerequisites

1. **PostgreSQL Installation**: Install PostgreSQL on your system
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Node.js Dependencies**: The `pg` package has been added to replace `sqlite3`

## Migration Steps

### 1. Install Dependencies

```bash
npm install
```

This will install the new PostgreSQL driver (`pg`) and remove the SQLite dependency.

### 2. Set Up PostgreSQL Database

1. **Start PostgreSQL service**:
   ```bash
   # Windows (if installed as service)
   net start postgresql-x64-14
   
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

2. **Create database and user**:
   ```sql
   -- Connect to PostgreSQL as superuser
   psql -U postgres
   
   -- Create database
   CREATE DATABASE cv_parser_pro;
   
   -- Create user (optional, you can use postgres user)
   CREATE USER cv_parser_user WITH PASSWORD 'your_secure_password';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE cv_parser_pro TO cv_parser_user;
   
   -- Exit
   \q
   ```

### 3. Update Environment Variables

For **Render PostgreSQL** (recommended for production):

```env
# Database Configuration - PostgreSQL (Render)
DATABASE_URL=postgresql://your_user:your_password@your_host.oregon-postgres.render.com/your_database
```

For **local PostgreSQL development**:

```env
# Database Configuration - PostgreSQL (Local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cv_parser_pro
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=false
```

**Note**: The application automatically detects and uses `DATABASE_URL` if available, otherwise falls back to individual DB_* variables.

### 4. Migrate Existing Data (Optional)

If you have existing SQLite data to migrate:

```bash
# Run the migration script
node migrate-to-postgresql.js
```

This script will:
- Create PostgreSQL tables with the correct schema
- Copy all existing CV data from SQLite to PostgreSQL
- Create a backup of your SQLite database
- Handle data type conversions (TEXT to JSONB, etc.)

### 5. Test Database Connection

Before starting the application, test your database connection:

```bash
# Test connection to Render PostgreSQL
node test-db-connection.js
```

### 6. Start the Application

```bash
npm start
```

The application will now:
- Connect to your Render PostgreSQL database
- Automatically create tables if they don't exist
- Use JSONB for better performance with JSON data
- Include proper indexes for faster queries

## Render Deployment

Your application is now configured to work with Render's PostgreSQL service. The configuration supports:

- **DATABASE_URL**: Automatically parsed connection string from Render
- **SSL**: Enabled by default for secure cloud connections
- **Connection Pooling**: Optimized for cloud deployment
- **Error Handling**: Robust error handling for network issues

## Key Changes Made

### Database Schema Improvements

1. **Data Types**:
   - `TEXT` → `JSONB` for JSON fields (better performance and querying)
   - `REAL` → `DECIMAL(4,2)` for precise decimal numbers
   - `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`

2. **Indexes Added**:
   - `idx_cvs_name` on name field
   - `idx_cvs_email` on email field
   - `idx_cvs_professional_specialty` on professional specialty
   - `idx_cvs_created_at` on creation timestamp

3. **Triggers**:
   - Auto-update `updated_at` timestamp on record changes

### Code Changes

1. **Dependencies**:
   - Removed: `sqlite3`
   - Added: `pg` (PostgreSQL driver)

2. **Database Operations**:
   - Connection pooling for better performance
   - Parameterized queries for security
   - Proper error handling and connection management

3. **Configuration**:
   - Environment-based database configuration
   - SSL support for production deployments

## Benefits of PostgreSQL

1. **Performance**: Better handling of concurrent connections and large datasets
2. **JSON Support**: Native JSONB type for efficient JSON operations
3. **Scalability**: Can handle much larger datasets and more users
4. **Features**: Advanced querying, full-text search, and analytics capabilities
5. **Production Ready**: Better suited for production deployments

## Troubleshooting

### Connection Issues

1. **Check PostgreSQL is running**:
   ```bash
   # Check if PostgreSQL is running
   pg_isready -h localhost -p 5432
   ```

2. **Verify credentials**:
   ```bash
   # Test connection manually
   psql -h localhost -p 5432 -U postgres -d cv_parser_pro
   ```

3. **Check firewall/network**:
   - Ensure port 5432 is accessible
   - Check `pg_hba.conf` for authentication settings

### Migration Issues

1. **SQLite file not found**: The migration script will skip if no SQLite database exists
2. **Data type errors**: The script handles most conversions automatically
3. **Duplicate data**: Drop and recreate the PostgreSQL database if needed

### Performance Issues

1. **Connection pool**: Adjust pool settings in `database.js`
2. **Indexes**: Additional indexes can be added for specific query patterns
3. **JSONB queries**: Use PostgreSQL's JSON operators for complex queries

## Rollback (If Needed)

If you need to rollback to SQLite:

1. Restore the original `package.json` and `server.js` files
2. Run `npm install` to reinstall SQLite dependencies
3. Use the backup SQLite database created during migration

## Next Steps

1. **Test thoroughly**: Verify all CV parsing and matching functionality
2. **Monitor performance**: Check query performance and connection usage
3. **Backup strategy**: Set up regular PostgreSQL backups
4. **Production deployment**: Configure SSL and security settings for production

For any issues, check the application logs and PostgreSQL logs for detailed error information.
