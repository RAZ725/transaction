import User from '../models/User'
import TransactionModel, { TransactionStatus } from '../models/Transaction'
import sequelize from '../config/database'
import { TransferError } from '../errors/TransferError'

export async function transferPessimistic(
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<{ success: boolean }> {
  console.log('transferPessimistic')

  const usersId = [fromUserId, toUserId].sort((a, b) => a.localeCompare(b))

  try {
    const resultTransfer = await sequelize.transaction(async (t) => {
      const user1 = await User.findByPk(usersId[0], {
        transaction: t,
        lock: t.LOCK.UPDATE,
      })
      const user2 = await User.findByPk(usersId[1], {
        transaction: t,
        lock: t.LOCK.UPDATE,
      })

      if (!user1 || !user2) {
        throw new TransferError(
          'One or both users do not exist',
          404,
          'USER_NOT_FOUND'
        )
      }

      const fromUser = fromUserId === user1.id ? user1 : user2
      const toUser = toUserId === user2.id ? user2 : user1

      let fromUserNum = Number(fromUser.balance)
      let toUserNum = Number(toUser.balance)

      if (fromUserNum < amount) {
        throw new TransferError('Not enough funds', 400, 'INSUFFICIENT_FUNDS')
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
