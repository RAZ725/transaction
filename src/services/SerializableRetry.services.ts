import User, { UserInstance } from '../models/User'
import TransactionModel, { TransactionStatus } from '../models/Transaction'
import sequelize from '../config/database'
import { TransferError } from '../errors/TransferError'
import { Transaction } from 'sequelize'

export async function transferSerializableRetry(
  fromUserId: string,
  toUserId: string,
  amount: number,
  maxRetries: number
): Promise<{ success: boolean }> {
  console.log('start transferStandart')
  const MAX_RETRIES = maxRetries
  let attempt = 0

  while (attempt < MAX_RETRIES) {
    try {
      const resultTransfer = await sequelize.transaction(
        {
          isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        },
        async (t) => {
          console.log('start async fn transaction transferSerializable')
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

          const newFromBalance = fromUserNum - amount
          fromUser.balance = newFromBalance
          await fromUser.save({ transaction: t })

          const newToBalance = toUserNum + amount
          toUser.balance = newToBalance
          await toUser.save({ transaction: t })

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

      console.log('end code before return')
      return resultTransfer
    } catch (error: any) {
      const isRetryable =
        error.name === 'SequelizeDatabaseError' &&
        (error.parent?.code === '40001' || error.parent?.code === '40P01')

      if (isRetryable && attempt < MAX_RETRIES) {
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

      throw error
    }
  }

  throw new TransferError(
    'Max retries exceeded due to concurrent update',
    409,
    'SERIALIZATION_FAILURE'
  )
}
