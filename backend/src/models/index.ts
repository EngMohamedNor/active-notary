import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "",
  process.env.DB_USER || "",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "3306"),
    dialect: (process.env.DB_DIALECT as any) || 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

// Import models
import DocumentTemplate, { initDocumentTemplate } from './documentTemplate.js';
import Book, { initBook } from './book.js';
import Document, { initDocument } from './document.js';
import User, { initUser } from './user.js';

// Initialize models
initDocumentTemplate(sequelize);
initBook(sequelize);
initDocument(sequelize);
initUser(sequelize);

// Define associations
Document.belongsTo(DocumentTemplate, { foreignKey: 'template_id' });
Document.belongsTo(Book, { foreignKey: 'book_no' });
Document.belongsTo(User, { foreignKey: 'user_id' });
DocumentTemplate.hasMany(Document, { foreignKey: 'template_id' });
Book.hasMany(Document, { foreignKey: 'book_no' });
User.hasMany(Document, { foreignKey: 'user_id' });

export default sequelize;
export { DocumentTemplate, Book, Document, User };

