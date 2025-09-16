import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface BookAttributes {
  book_no: number;
  created_at?: Date;
  updated_at?: Date;
  status: string;
}

interface BookCreationAttributes extends Optional<BookAttributes, 'book_no' | 'created_at' | 'updated_at'> {}

class Book extends Model<BookAttributes, BookCreationAttributes>
  implements BookAttributes {
  public book_no!: number;
  public created_at!: Date;
  public updated_at!: Date;
  public status!: string;
}

// Initialize the model with sequelize instance
export const initBook = (sequelize: Sequelize) => {
  Book.init(
    {
      book_no: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '',
      },
    },
    {
      sequelize,
      tableName: 'books',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return Book;
};

export default Book;
