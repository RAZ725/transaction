import User from '../models/User'
import TransactionModel from '../models/Transaction'
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
