import { Injectable } from '@nestjs/common'
import sequelize from '../config/database'
import User from '../models/User'

@Injectable()
export class UserService {
  async updateBalance(userId: string, newBalance: number) {
    try {
      await sequelize.transaction(async (t) => {
        console.log('Transaction 2 start')
        const user = await User.findByPk(userId, { transaction: t })
        if (!user) {
          throw new Error('User is not found')
        }
        console.log('log balance in Transaction 2 before update:', user.balance)
        user.balance = newBalance
        console.log('log balance in Transaction 2 after update:', user.balance)
        await user.save({ transaction: t })
        console.log('Transaction 2 completed')
      })
    } catch (error: any) {
      console.error('Error in updateBalance:', error)
      throw error
    }
  }
}
