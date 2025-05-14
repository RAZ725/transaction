import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import sequelize from './config/database'
import User from './models/User'
import TransactionModel from './models/Transaction'

async function loadData() {
  try {
    const existData = await User.findAll()
    if (existData.length === 0) {
      await User.bulkCreate([
        { name: 'Алексей Иванов', balance: 1000.0 },
        { name: 'Марина Петрова', balance: 500.0 },
        { name: 'Игорь Сидоров', balance: 2000.0 },
      ])
    } else {
      console.log('Data in table was created early')
    }
  } catch (error) {
    console.log('error in loadData async function')
    console.log('Error in async loadData: ', error)
  }
}

async function initializeDatabase() {
  try {
    await sequelize.authenticate()
    console.log('Database connetion success')
    console.log('Зарегистрированные модели:', Object.keys(sequelize.models))
    console.log('Импортированные модели для отладки:', User, TransactionModel)
    await sequelize.sync({ alter: true })
    await loadData()
  } catch (error) {
    console.log('error in async fn initializeDatabase')
    console.log('Error in async initializeDatabase:', error)
  }
}

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule)
    await app.listen(process.env.PORT ?? 3000, async () => {
      await initializeDatabase()
      console.log('server was running succes in port 3000')
    })
  } catch (error) {
    console.error('Error during initialization:', error)
    process.exit(1)
  }
}
bootstrap()
