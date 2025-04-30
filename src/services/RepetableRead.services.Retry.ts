import User from '../models/User'
import TransactionModel, { TransactionStatus } from '../models/Transaction'
import sequelize from '../config/database'
import { Transaction } from 'sequelize'
import { TransferError } from '../errors/TransferError'

export async function transferRepetableReadRetry(
  fromUserId: string,
  toUserId: string,
  amount: number,
  maxRetries: number
): Promise<{ success: boolean }> {
  const MAX_RETRIES = maxRetries
  let attempt = 0

  while (attempt < MAX_RETRIES) {
    try {
      const resultTransfer = await sequelize.transaction(
        {
          isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
        },
        async (t) => {
          console.log('start async fn')
          const fromUser = await User.findByPk(fromUserId, { transaction: t })
          const toUser = await User.findByPk(toUserId, { transaction: t })

          if (!fromUser || !toUser) {
            throw new TransferError(
              'One or both users do not exist',
              404,
              'USER_NOT_FOUND'
            )
          }

          let fromUserNum = Number(fromUser.balance)
          let toUserNum = Number(toUser.balance)

          if (fromUserNum < amount) {
            throw new TransferError(
              'Not enough funds',
              400,
              'INSUFFICIENT_FUNDS'
            )
          }

          //Тест
          // console.log('Transaction 1: Waiting...')
          // await new Promise((resolve) => setTimeout(resolve, 50000))
          // console.log('waiting end')

          const newFromBalance = fromUserNum - amount
          fromUser.balance = newFromBalance
          await fromUser.save({ transaction: t })

          const newToBalance = toUserNum + amount
          toUser.balance = newToBalance
          await toUser.save({ transaction: t })

          // Создаем запись о транзакции
          await TransactionModel.create(
            {
              fromUserId,
              toUserId,
              amount,
              status: TransactionStatus.COMPLETED,
            },
            { transaction: t }
          )
          return { success: true }
        }
      )
      return resultTransfer
    } catch (error: any) {
      console.log(`Transaction 1: Error on attempt ${attempt + 1}:`)
      // console.log('error in catch:', error)
      console.log('error in catch')

      const isRetryable =
        error.name === 'SequelizeDatabaseError' &&
        (error.parent?.code === '40001' || // Serialization failure
          error.parent?.code === '40P01') // Deadlock detected

      if (isRetryable && attempt < MAX_RETRIES) {
        //Для искусвтенной задержки
        // const delay = Math.pow(2, attempt) * 100
        // console.log(`Retrying after ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
        // await new Promise((resolve) => setTimeout(resolve, delay))
        attempt++
        continue
      }

      await sequelize.transaction(async (t) => {
        await TransactionModel.create(
          {
            fromUserId,
            toUserId,
            amount,
            status: TransactionStatus.FAILED,
          },
          { transaction: t }
        )
      })

      if (error instanceof TransferError) {
        throw error
      }

      if (isRetryable) {
        throw new TransferError(
          `Max retries exceeded due to ${
            error.parent?.code === '40001'
              ? 'serialization failure'
              : 'deadlock'
          }`,
          409,
          error.parent?.code === '40001' ? 'SERIALIZATION_FAILURE' : 'DEADLOCK'
        )
      }
    }
  }
  throw new TransferError(
    'Max retries exceeded due to concurrent update',
    500,
    'MAX_RETRIES_REACHED'
  )
}

// while (attempt < MAX_RETRIES) {
//   try {
//     const resultTransfer = await sequelize.transaction(
//       {
//         isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
//       },
//       async (t) => {
//         console.log('start async fn')
//         const fromUser = await User.findByPk(fromUserId, { transaction: t })
//         const toUser = await User.findByPk(toUserId, { transaction: t })
//         if (!fromUser || !toUser) {
//           throw new Error('One user is dont exist')
//         }
//         let fromUserNum = Number(fromUser.balance)
//         let toUserNum = Number(toUser.balance)
//         if (fromUserNum < amount) {
//           throw new Error('Not enought founds')
//         }
//         console.log('Transaction 1: Waiting...')
//         await new Promise((resolve) => setTimeout(resolve, 50000))
//         console.log('waiting end')
//         const newFromBalance = fromUserNum - amount
//         fromUser.balance = newFromBalance
//         await fromUser.save({ transaction: t })
//         const newToBalance = toUserNum + amount
//         toUser.balance = newToBalance
//         await toUser.save({ transaction: t })
//         // Создаем запись о транзакции
//         await TransactionModel.create(
//           {
//             fromUserId,
//             toUserId,
//             amount,
//             status: TransactionStatus.COMPLETED,
//           },
//           { transaction: t }
//         )
//         return { success: true }
//       }
//     )
