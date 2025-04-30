import { Request, Response } from 'express'
import sequelize from '../config/database'
import User from '../models/User'
import TransactionModel, { TransactionStatus } from '../models/Transaction'
import { TransferError } from '../errors/TransferError'
import { transferOptimistic } from '../services/OptimisticNoRetry.services'
import { transferStandart } from '../services/DefaultTransation.services'
import { transferRepetableRead } from '../services/RepetableRead.services.Retry'
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

//Для тестирования паралельного транзакции которая будет мешать перовой
//Смотреть в блокноте transaction Добавление проблем и их решение 1 вопрос
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

//Version 2 создаем отдельно обект транзакции и используем далее его и вручную контролим все процессы

// export async function transferFunds(req: Request, res: Response) {
//   const { fromUserId, toUserId, amount } = req.body

//   if (!fromUserId || !toUserId || !amount) {
//     return res.status(400).json({
//       error: 'Missing required fields: fromUserId, toUserId, amount',
//     })
//   }

//   if (amount <= 0) {
//     return res.status(400).json({
//       error: 'Sum most be positive and must be number',
//     })
//   }

//   const transaction = await sequelize.transaction()
//   try {
//     console.log('start transaction')

//     const fromUser = await User.findByPk(fromUserId, { transaction })
//     const toUser = await User.findByPk(toUserId, { transaction })

//     if (!fromUser || !toUser) {
//       throw new Error('One user is dont exist')
//     }

//     let fromUserNum = Number(fromUser.balance)
//     let toUserNum = Number(toUser.balance)

//     if (fromUserNum < amount) {
//       throw new Error('Not enought money')
//     }

//     const newFromBalance = fromUserNum - amount
//     fromUser.balance = newFromBalance
//     await fromUser.save({ transaction })

//     const newToBalance = toUserNum + amount
//     toUser.balance = newToBalance
//     await toUser.save({ transaction })

//     await Transaction.create(
//       {
//         fromUserId,
//         toUserId,
//         amount,
//         status: TransactionStatus.COMPLETED,
//       },
//       { transaction }
//     )

//     await transaction.commit()
//     console.log('transaction committed')

//     return res.status(200).json({ message: 'Transfer successful' })
//   } catch (error) {
//     console.log('error in catch:', error)
//     if (transaction) {
//       await transaction.rollback()
//       console.log('transaction rolled back')
//     }

//     try {
//       const failedTransaction = await sequelize.transaction()
//       await Transaction.create(
//         {
//           fromUserId,
//           toUserId,
//           amount,
//           status: TransactionStatus.FAILED,
//         },
//         { transaction: failedTransaction }
//       )
//       await failedTransaction.commit()
//     } catch (error) {
//       console.error('Failed to log failed transaction:', error)
//     }

//     return res.status(500).json({ error: 'Ошибка при выполнении перевода' })
//   }
// }

//Можно и так сдлеать
// await fromUser.update(
//   { balance: fromUser.balance - amount },
//   { transaction }
// )
// await toUser.update({ balance: toUser.balance + amount }, { transaction })
