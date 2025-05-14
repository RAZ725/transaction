<<<<<<< HEAD
import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/database'
import User from './User'

=======
import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database'
import User from './User'

export interface TransactionAttributes {
  id: string
  fromUserId: string
  toUserId: string
  amount: number
  status: TransactionStatus
}

>>>>>>> afef42b (Initial NestJS project)
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

<<<<<<< HEAD
console.log('log in TRansaction before init')

const Transaction = sequelize.define('transactio', {
=======
export interface TransactionCreationAttributes
  extends Omit<TransactionAttributes, 'id'> {}

export type TransactionInstance = Model<
  TransactionAttributes,
  TransactionCreationAttributes
> &
  TransactionAttributes

console.log('log in TRansaction before init')

const TransactionModel = sequelize.define<TransactionInstance>('transactio', {
>>>>>>> afef42b (Initial NestJS project)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fromUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  toUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(TransactionStatus)),
    allowNull: false,
    defaultValue: TransactionStatus.PENDING,
  },
})

console.log('log in TRansaction after init')

<<<<<<< HEAD
// Transaction.belongsTo(User, { as: 'fromUser', foreignKey: 'fromUserId' })
// Transaction.belongsTo(User, { as: 'toUser', foreignKey: 'toUserId' })

export default Transaction
=======
export default TransactionModel
>>>>>>> afef42b (Initial NestJS project)
