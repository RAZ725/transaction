import User, { UserInstance } from '../models/User'
import TransactionModel, { TransactionStatus } from '../models/Transaction'
import sequelize from '../config/database'
import { TransferError } from '../errors/TransferError'
import { Transaction } from 'sequelize'

export async function transferSerializable(
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<{ success: boolean }> {
  console.log('start transferStandart')
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
          throw new TransferError('Not enough funds', 400, 'INSUFFICIENT_FUNDS')
        }

        //Для теста вручную
        // console.log('Transaction 1: Waiting...')
        // await new Promise((resolve) => setTimeout(resolve, 30000))
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

    console.log('end code before return')
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
