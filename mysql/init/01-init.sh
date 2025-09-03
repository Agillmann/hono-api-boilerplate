#!/bin/bash
set -e

echo "Starting secure MySQL initialization..."

# Execute SQL commands with proper environment variable substitution
# Note: MySQL container is already ready when init scripts run
mysql -u"root" -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    -- Ensure root password is properly set (Docker handles this, but we verify)
    ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '${MYSQL_ROOT_PASSWORD}';
    
    -- Create root user for remote connections with proper password
    CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED WITH caching_sha2_password BY '${MYSQL_ROOT_PASSWORD}';
    GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
    
    -- The application user and database are created by Docker automatically
    -- But we ensure the user has proper authentication method and privileges
    ALTER USER '${MYSQL_USER}'@'%' IDENTIFIED WITH caching_sha2_password BY '${MYSQL_PASSWORD}';
    
    -- Create localhost version of the application user for local connections
    CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED WITH caching_sha2_password BY '${MYSQL_PASSWORD}';
    
    -- Grant privileges to both versions of the application user
    GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%';
    GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'localhost';
    
    -- Flush privileges to apply all changes
    FLUSH PRIVILEGES;
    
    -- Switch to the application database
    USE \`${MYSQL_DATABASE}\`;
    
    -- Verify the setup
    SELECT 'MySQL secure initialization completed successfully' as status;
EOSQL

echo "Secure MySQL initialization completed!"
