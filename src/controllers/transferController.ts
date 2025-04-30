import { Request, Response } from 'express'
import sequelize from '../config/database'
import User from '../models/User'
import TransactionModel, { TransactionStatus } from '../models/Transaction'
import { TransferError } from '../errors/TransferError'
import { transferOptimistic } from '../services/OptimisticNoRetry.services'
import { transferStandart } from '../services/DefaultTransation.services'
import { transferRepetableReadRetry } from '../services/RepetableRead.services.Retry'
import { transferPessimistic } from '../services/PessimisticTransaction.services'

// Version 1 передаем колбек в метод transaction
export async function transferFunds(req: Request, res: Response) {
  console.log('start code in transferFunds function')
  const { fromUserId, toUserId, amount } = req.body

  if (!fromUserId || !toUserId || !amount) {
    return res.status(400).json({
      error: 'Missing required fields: fromUserId, toUserId, amount',
    })
  }

  if (amount <= 0) {
    return res.status(400).json({
      error: 'Sum most be positive and must be number',
    })
  }
  try {
    console.log('start code in try')
    const resultTransfer = await transferStandart(fromUserId, toUserId, amount)
    console.log('end code before return')
    return res
      .status(200)
      .json({ message: 'Transfer successful', result: resultTransfer })
  } catch (error: any) {
    if (error instanceof TransferError) {
      return res.status(error.statusCode).json({
        error: error.message,
        errorCode: error.errorCode,
      })
    }
    return res
      .status(500)
      .json({ error: 'Ошибка при выполнении перевода', message: error.message })
  }
}

export async function updateBalance(req: Request, res: Response) {
  const { userId, newBalance } = req.body

  try {
    await sequelize.transaction(async (t) => {
      console.log('Transaction 2 start')
      const user = await User.findByPk(userId, { transaction: t })
      if (!user) {
        throw new Error('user is not find')
      }
      console.log('log balance in Transaction 2 before update:', user.balance)
      user.balance = newBalance
      console.log('log balance in Transaction 2 after update:', user.balance)
      await user.save({ transaction: t })
      console.log('Transaction 2 completed')
    })

    return res.status(200).json({ message: 'Balance updated' })
  } catch (error) {
    console.log('Error in updateBalance 1 try:', error)
    return res.status(500).json({ error: 'Update failed' })
  }
}
