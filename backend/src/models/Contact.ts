import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";
//import Company from "./Company";
import Whatsapp from "./Whatsapp";

@Table({
  tableName: "Contacts",
  timestamps: true
})
class Contact extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  number!: string; // Puede ser número real o placeholder para LIDs (ej: LID_2830819658)

    // Getter para compatibilidad con 'extraInfo' (con I mayúscula)
  get extraInfo(): any {
    return this.extrainfo;
  }
  
  set extraInfo(value: any) {
    this.extrainfo = value;
  }

  @Default("")
  @Column(DataType.STRING)
  email!: string;

  @Column(DataType.TEXT)
  profilePicUrl!: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isGroup!: boolean;

  @Column(DataType.JSONB)
  extrainfo!: any;

//  @ForeignKey(() => Company)
//  @Column(DataType.INTEGER)
//  companyId!: number;

//  @BelongsTo(() => Company)
//  company!: Company;
  @Column(DataType.INTEGER)
  companyId!: number;


  @ForeignKey(() => Whatsapp)
  @Column(DataType.INTEGER)
  whatsappId!: number;

  @BelongsTo(() => Whatsapp)
  whatsapp!: Whatsapp;

  @Column(DataType.STRING)
  lid!: string;  // Guarda el LID original completo (ej: 28308196585718@lid)

  @Column(DataType.STRING)
  originaljid!: string;

  @Column(DataType.BOOLEAN)
  active!: boolean;

  @Column(DataType.BOOLEAN)
  disableBot!: boolean;

  @Column(DataType.STRING)
  messengerId!: string;

  @Column(DataType.STRING)
  instagramId!: string;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;
}

export default Contact;
