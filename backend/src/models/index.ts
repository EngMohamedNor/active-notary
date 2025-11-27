import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "",
  process.env.DB_USER || "",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "3306"),
    dialect: (process.env.DB_DIALECT as any) || "mysql",
    // logging: process.env.NODE_ENV === "development" ? console.log : false,
  }
);

// Import models
import DocumentTemplate, { initDocumentTemplate } from "./documentTemplate.js";
import Book, { initBook } from "./book.js";
import Document, { initDocument } from "./document.js";
import User, { initUser } from "./user.js";
import ChartOfAccount, { initChartOfAccount } from "./chartOfAccount.js";
import Company, { initCompany } from "./company.js";
import GeneralJournal, { initGeneralJournal } from "./generalJournal.js";
import JournalLine, { initJournalLine } from "./journalLine.js";
import Party, { initParty } from "./party.js";

// Initialize models
initDocumentTemplate(sequelize);
initBook(sequelize);
initDocument(sequelize);
initUser(sequelize);
initChartOfAccount(sequelize);
initCompany(sequelize);
initGeneralJournal(sequelize);
initJournalLine(sequelize);
initParty(sequelize);

// Define associations
Document.belongsTo(DocumentTemplate, { foreignKey: "template_id" });
Document.belongsTo(Book, { foreignKey: "book_no" });
Document.belongsTo(User, { foreignKey: "user_id" });
DocumentTemplate.hasMany(Document, { foreignKey: "template_id" });
Book.hasMany(Document, { foreignKey: "book_no" });
User.hasMany(Document, { foreignKey: "user_id" });

// Accounting associations
ChartOfAccount.belongsTo(ChartOfAccount, {
  foreignKey: "parent_id",
  as: "parent",
});
ChartOfAccount.hasMany(ChartOfAccount, {
  foreignKey: "parent_id",
  as: "children",
});
GeneralJournal.hasMany(JournalLine, {
  foreignKey: "journal_id",
  as: "journal_lines",
});
JournalLine.belongsTo(GeneralJournal, {
  foreignKey: "journal_id",
  as: "journal",
});
JournalLine.belongsTo(ChartOfAccount, {
  foreignKey: "account_code",
  targetKey: "account_code",
  as: "account",
});
ChartOfAccount.hasMany(JournalLine, {
  foreignKey: "account_code",
  sourceKey: "account_code",
  as: "journal_lines",
});

export default sequelize;
export {
  DocumentTemplate,
  Book,
  Document,
  User,
  ChartOfAccount,
  Company,
  GeneralJournal,
  JournalLine,
  Party,
};
