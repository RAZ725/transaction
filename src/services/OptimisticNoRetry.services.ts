import User from '../models/User'
import TransactionModel, { TransactionStatus } from '../models/Transaction'
import sequelize from '../config/database'
import { TransferError } from '../errors/TransferError'

export async function transferOptimistic(
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<{ success: boolean }> {
  console.log('transferOptimistic function')
  try {
    const resultTransfer = await sequelize.transaction(async (t) => {
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
      let fromUserUpdatedAt = fromUser.updatedAt
      let toUserNum = Number(toUser.balance)
      let toUserUpdatedAt = toUser.updatedAt

      if (fromUserNum < amount) {
        throw new TransferError('Not enough funds', 400, 'INSUFFICIENT_FUNDS')
      }

      // console.log('Transaction 1: Waiting...')
      // await new Promise((resolve) => setTimeout(resolve, 30000))
      // console.log('waiting end')

      let [fromUpdateCount] = await User.update(
        { balance: fromUserNum - amount },
        {
          where: { id: fromUserId, updatedAt: fromUserUpdatedAt },
          transaction: t,
        }
      )

      if (fromUpdateCount === 0) {
        // Конфликт: updatedAt изменился, перечитываем данные
        throw new TransferError(
          'Concurrent update detected',
          409,
          'CONCURRENT_UPDATE'
        )
      }

      const [toUpdateCount] = await User.update(
        { balance: toUserNum + amount },
        {
          where: {
            id: toUserId,
            updatedAt: toUserUpdatedAt,
          },
          transaction: t,
        }
      )

      if (toUpdateCount === 0) {
        throw new TransferError(
          'Concurrent update detected',
          409,
          'CONCURRENT_UPDATE'
        )
      }

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
    })
    return resultTransfer
  } catch (error: any) {
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

/**
 * Ошибки в TypeScript: В TypeScript выброшенные ошибки (throw new Error(...)) не требуют явного указания в возвращаемом типе.
 * Если функция выбрасывает ошибку, Promise автоматически отклоняется (rejected) с объектом Error,
 * и это обрабатывается в блоке catch вызывающего кода (в твоем контроллере).
 *
 *
 *
 */
