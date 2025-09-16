import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface DocumentAttributes {
  id: number;
  template_id?: number;
  document_name?: string;
  document_link?: string;
  description?: string;
  user_id?: number;
  doc_serial?: number;
  book_no?: number;
  serial_number?: string;
  total?: number;
  paid?: number;
  balance?: number;
  customer_name?: string;
  customer_phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface DocumentCreationAttributes extends Optional<DocumentAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Document extends Model<DocumentAttributes, DocumentCreationAttributes>
  implements DocumentAttributes {
  public id!: number;
  public template_id?: number;
  public document_name?: string;
  public document_link?: string;
  public description?: string;
  public user_id?: number;
  public doc_serial?: number;
  public book_no?: number;
  public serial_number?: string;
  public total?: number;
  public paid?: number;
  public balance?: number;
  public customer_name?: string;
  public customer_phone?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

// Initialize the model with sequelize instance
export const initDocument = (sequelize: Sequelize) => {
  Document.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      template_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      document_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      document_link: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      doc_serial: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      book_no: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      serial_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      total: {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: true,
      },
      paid: {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: true,
      },
      balance: {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: true,
      },
      customer_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      customer_phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'documents',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return Document;
};

export default Document;
