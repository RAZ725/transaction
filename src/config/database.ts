import { Sequelize } from 'sequelize'

const sequelize = new Sequelize({
  dialect: 'postgres',
<<<<<<< HEAD
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'money_transfer_database',
=======
  host: 'localhost',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'money_transfer_database_V2',
>>>>>>> afef42b (Initial NestJS project)
  logging: false,
})

export default sequelize
