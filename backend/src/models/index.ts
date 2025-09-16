import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

// Import models
import DocumentTemplate, { initDocumentTemplate } from './documentTemplate.js';
import Book, { initBook } from './book.js';
import Document, { initDocument } from './document.js';

// Initialize models
initDocumentTemplate(sequelize);
initBook(sequelize);
initDocument(sequelize);

// Define associations
Document.belongsTo(DocumentTemplate, { foreignKey: 'template_id' });
Document.belongsTo(Book, { foreignKey: 'book_no' });
DocumentTemplate.hasMany(Document, { foreignKey: 'template_id' });
Book.hasMany(Document, { foreignKey: 'book_no' });

export default sequelize;
export { DocumentTemplate, Book, Document };

