import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/database'
import User from './User'

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

console.log('log in TRansaction before init')

const Transaction = sequelize.define('transactio', {
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

// Transaction.belongsTo(User, { as: 'fromUser', foreignKey: 'fromUserId' })
// Transaction.belongsTo(User, { as: 'toUser', foreignKey: 'toUserId' })

export default Transaction
