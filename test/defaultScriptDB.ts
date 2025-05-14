import User from '../src/models/User'
import TransactionModel from '../src/models/Transaction'
import { where } from 'sequelize'

async function toDefaultDb() {
  try {
    await TransactionModel.destroy({ where: {} })
    await User.update({ balance: 10000 }, { where: {} })
    return 'all data delete'
  } catch (error) {
    console.log('error in toDefaultDb:', error)
  }
}
toDefaultDb().then((res) => console.log(res, 'res promise'))
