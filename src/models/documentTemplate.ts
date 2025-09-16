import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index.js';
import { v4 as uuidv4 } from 'uuid';

interface DocumentTemplateAttributes {
  template_id: string;
  template_name: string;
  template_path: string;
  created_at?: Date;
}

interface DocumentTemplateCreationAttributes extends Optional<DocumentTemplateAttributes, 'template_id' | 'created_at'> {}

class DocumentTemplate extends Model<DocumentTemplateAttributes, DocumentTemplateCreationAttributes>
  implements DocumentTemplateAttributes {
  public template_id!: string;
  public template_name!: string;
  public template_path!: string;
  public created_at!: Date;
}

DocumentTemplate.init(
  {
    template_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    template_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    template_path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'document_templates',
    timestamps: false,
  }
);

export default DocumentTemplate;


