import { Request, Response } from 'express'
import sequelize from '../config/database'
import User from '../models/User'
import Transaction, { TransactionStatus } from '../models/Transaction'
import { error } from 'console'
import { Model } from 'sequelize'

//Version 1 передаем колбек в метод transaction
// export async function transferFunds(req: Request, res: Response) {
//   console.log('start code in transferFunds function')
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

//   try {
//     const resultTransfer = await sequelize.transaction(async (t) => {
//       console.log('start async fn')
//       const fromUser = await User.findByPk(fromUserId, { transaction: t })
//       const toUser = await User.findByPk(toUserId, { transaction: t })

//       if (!fromUser || !toUser) {
//         throw new Error('One user is dont exist')
//       }

//       let fromUserNum = Number(fromUser.balance)
//       let toUserNum = Number(toUser.balance)

//       if (fromUserNum < amount) {
//         throw new Error('Not enought founds')
//       }

//       const newFromBalance = fromUserNum - amount
//       fromUser.balance = newFromBalance
//       await fromUser.save({ transaction: t })

//       const newToBalance = toUserNum + amount
//       toUser.balance = newToBalance
//       await toUser.save({ transaction: t })

//       // Создаем запись о транзакции
//       await Transaction.create(
//         {
//           fromUserId,
//           toUserId,
//           amount,
//           status: TransactionStatus.COMPLETED,
//         },
//         { transaction: t }
//       )

//       return { success: true }
//     })
//     console.log('end code before return')
//     return res.status(200).json({ message: 'Transfer successful' })
//   } catch (error) {
//     console.log('error in catch:', error)
//     await sequelize.transaction(async (t) => {
//       await Transaction.create(
//         {
//           fromUserId,
//           toUserId,
//           amount,
//           status: TransactionStatus.FAILED,
//         },
//         { transaction: t }
//       )
//     })

//     return res.status(500).json({ error: 'Ошибка при выполнении перевода' })
//   }
// }

//Version 2 создаем отдельно обект транзакции и используем далее его и вручную контролим все процессы

export async function transferFunds(req: Request, res: Response) {
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

  const transaction = await sequelize.transaction()
  try {
    console.log('start transaction')

    const fromUser = await User.findByPk(fromUserId, { transaction })
    const toUser = await User.findByPk(toUserId, { transaction })

    if (!fromUser || !toUser) {
      throw new Error('One user is dont exist')
    }

    let fromUserNum = Number(fromUser.balance)
    let toUserNum = Number(toUser.balance)

    if (fromUserNum < amount) {
      throw new Error('Not enought money')
    }

    const newFromBalance = fromUserNum - amount
    fromUser.balance = newFromBalance
    await fromUser.save({ transaction })

    const newToBalance = toUserNum + amount
    toUser.balance = newToBalance
    await toUser.save({ transaction })

    await Transaction.create(
      {
        fromUserId,
        toUserId,
        amount,
        status: TransactionStatus.COMPLETED,
      },
      { transaction }
    )

    await transaction.commit()
    console.log('transaction committed')

    return res.status(200).json({ message: 'Transfer successful' })
  } catch (error) {
    console.log('error in catch:', error)
    if (transaction) {
      await transaction.rollback()
      console.log('transaction rolled back')
    }

    try {
      const failedTransaction = await sequelize.transaction()
      await Transaction.create(
        {
          fromUserId,
          toUserId,
          amount,
          status: TransactionStatus.FAILED,
        },
        { transaction: failedTransaction }
      )
      await failedTransaction.commit()
    } catch (error) {
      console.error('Failed to log failed transaction:', error)
    }

    return res.status(500).json({ error: 'Ошибка при выполнении перевода' })
  }
}

//Можно и так сдлеать
// await fromUser.update(
//   { balance: fromUser.balance - amount },
//   { transaction }
// )
// await toUser.update({ balance: toUser.balance + amount }, { transaction })
