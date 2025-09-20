# Environment Setup Guide

This guide explains how to set up environment variables for the Active Notary backend application.

## 1. Create .env File

Create a `.env` file in the `backend` directory with the following content:

```env
# Database Configuration
DB_NAME=active_notray
DB_USER=root
DB_PASSWORD=12345678
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/templates
DOCUMENTS_PATH=documents
```

## 2. Environment Variables Explained

### Database Configuration
- `DB_NAME`: Name of your MySQL database
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_HOST`: MySQL host (usually localhost or 127.0.0.1)
- `DB_PORT`: MySQL port (default: 3306)
- `DB_DIALECT`: Database type (mysql, postgres, sqlite, etc.)

### JWT Configuration
- `JWT_SECRET`: Secret key for JWT token signing (change this in production!)

### Server Configuration
- `PORT`: Port number for the Express server (default: 3000)
- `NODE_ENV`: Environment mode (development, production, test)

### File Upload Configuration
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 10MB)
- `UPLOAD_PATH`: Path for template uploads
- `DOCUMENTS_PATH`: Path for generated documents

## 3. Production Considerations

### Security
- **Change JWT_SECRET**: Use a strong, random secret key in production
- **Use Environment-Specific Values**: Different database credentials for production
- **Set NODE_ENV=production**: This affects logging and other behaviors

### Example Production .env
```env
# Database Configuration
DB_NAME=active_notray_prod
DB_USER=notary_user
DB_PASSWORD=your_secure_password_here
DB_HOST=your_production_db_host
DB_PORT=3306
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=production

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/templates
DOCUMENTS_PATH=documents
```

## 4. How to Use

1. Copy the example configuration above
2. Create a `.env` file in the `backend` directory
3. Paste the configuration and modify values as needed
4. Restart your backend server

## 5. Default Values

If no `.env` file is found or variables are missing, the application will use these defaults:
- Database: `active_notray` on `127.0.0.1:3306` with user `root` and password `12345678`
- JWT Secret: `your-secret-key`
- Port: `3000`
- Environment: `development`

## 6. Important Notes

- **Never commit .env files to version control**
- **Keep your .env file secure and private**
- **Use different credentials for different environments**
- **Regularly rotate JWT secrets in production**
