import express from 'express'
import sequelize from './config/database'
import User from './models/User'
import Transaction from './models/Transaction'
import { transferFunds } from './controllers/transferController'
import { UUID } from 'sequelize'

const app = express()
const PORT: number = 3000

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello from new Servejhbjhb')
})

app.post('/transfer', transferFunds)

async function loadData() {
  //Костыли
  try {
    const existData = await User.findAll()
    if (existData.length === 0) {
      await User.bulkCreate([
        { name: 'Алексей Иванов', balance: 1000.0 },
        { name: 'Марина Петрова', balance: 500.0 },
        { name: 'Игорь Сидоров', balance: 2000.0 },
      ])
    } else {
      console.log('Table has data')
    }
    console.log('Начальные данные добавлены в базу.')
  } catch (error) {
    console.log('error in loadData')
    console.log('error:', error)
  }
}

async function initializeDatabase() {
  try {
    await sequelize.authenticate()
    console.log('Database connetion success')
    console.log('Зарегистрированные модели:', Object.keys(sequelize.models))
    console.log('Импортированные модели для отладки:', User, Transaction)
    await sequelize.sync({ alter: true })
    // await sequelize.sync({ force: false })
    console.log('Database synchronized successfully.')
    await loadData()
  } catch (error) {
    console.log('error in async fn initializeDatabase')
    console.log('Error:', error)
  }
}

app.listen(PORT, async () => {
  await initializeDatabase()
  console.log(`Server was running in port: ${PORT}`)
})
