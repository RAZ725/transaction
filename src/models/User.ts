<<<<<<< HEAD
import { DataTypes } from 'sequelize'
import sequelize from '../config/database'

const User = sequelize.define('user', {
=======
import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/database'

interface UserAttributes {
  id: string
  name: string
  balance: number
  createdAt?: Date
  updatedAt?: Date
}

interface UserCreationAttributes extends Omit<UserAttributes, 'id'> {}

type UserInstance = Model<UserAttributes, UserCreationAttributes> &
  UserAttributes

const User = sequelize.define<UserInstance>('user', {
>>>>>>> afef42b (Initial NestJS project)
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
<<<<<<< HEAD
=======
export { UserInstance }
>>>>>>> afef42b (Initial NestJS project)
