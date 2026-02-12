import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany,
  DataType,
  Default
} from "sequelize-typescript";
import Queue from "./Queue";

@Table({
  tableName: "Chatbots",
  timestamps: true
})
class Chatbot extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.TEXT)
  greetingMessage!: string;

  @Column(DataType.JSONB)
  options!: any;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isAgent!: boolean;

  @ForeignKey(() => Queue)
  @Column(DataType.INTEGER)
  queueId!: number;

  @BelongsTo(() => Queue)
  queue!: Queue;

  @ForeignKey(() => Chatbot)
  @Column(DataType.INTEGER)
  chatbotId!: number;

  @BelongsTo(() => Chatbot)
  parentChatbot!: Chatbot;

  @HasMany(() => Chatbot)
  childrenChatbots!: Chatbot[];

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;
}

export default Chatbot;
