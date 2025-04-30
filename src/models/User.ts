import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/database'

interface UserAttributes {
  id: string
  name: string
  balance: number
  createdAt?: Date
  updatedAt?: Date
}

// Интерфейс для создания записи (id необязательно)
interface UserCreationAttributes extends Omit<UserAttributes, 'id'> {}

type UserInstance = Model<UserAttributes, UserCreationAttributes> &
  UserAttributes

const User = sequelize.define<UserInstance>('user', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
})

console.log('User model defined')

export default User
export { UserInstance }
