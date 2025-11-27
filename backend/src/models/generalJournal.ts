import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { v4 as uuidv4 } from "uuid";

interface GeneralJournalAttributes {
  id: string;
  date: Date;
  description: string;
  reference_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface GeneralJournalCreationAttributes
  extends Optional<
    GeneralJournalAttributes,
    "id" | "reference_id" | "created_at" | "updated_at"
  > {}

class GeneralJournal
  extends Model<GeneralJournalAttributes, GeneralJournalCreationAttributes>
  implements GeneralJournalAttributes
{
  public id!: string;
  public date!: Date;
  public description!: string;
  public reference_id?: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}

export const initGeneralJournal = (sequelize: Sequelize) => {
  GeneralJournal.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      reference_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "general_journals",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return GeneralJournal;
};

export default GeneralJournal;
