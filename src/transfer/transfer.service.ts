import { Injectable } from '@nestjs/common'
import User from '../models/User'
import TransactionModel, { TransactionStatus } from '../models/Transaction'
import sequelize from '../config/database'
import { TransferError } from '../errors/TransferError'
import { Transaction } from 'sequelize'

@Injectable()
export class TransferService {
  getHelloTransfer(): string {
    return 'Hello world from transfer route'
  }

  async transferStandart(
    fromUserId: string,
    toUserId: string,
    amount: number
  ): Promise<{ success: boolean }> {
    try {
      const resultTransfer = await sequelize.transaction(async (t) => {
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

        // console.log('Transaction 1: Waiting...')
        // await new Promise((resolve) => setTimeout(resolve, 40000))
        // console.log('waiting end')

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

  async transferStandartRetry(
    fromUserId: string,
    toUserId: string,
    amount: number,
    maxRetries: number = 3
  ): Promise<{ success: boolean }> {
    console.log('start transferStandart')
    let retries = 0

    while (retries < maxRetries) {
      try {
        const resultTransfer = await sequelize.transaction(async (t) => {
          console.log(`start async fn transaction (attempt ${retries + 1})`)
          console.log('start async fn transaction ')
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

        console.log('end code before return')
        return resultTransfer
      } catch (error: any) {
        const isRetryable =
          error.name === 'SequelizeDatabaseError' &&
          (error.parent?.code === '40001' || // Serialization failure
            error.parent?.code === '40P01') // Deadlock detected

        if (isRetryable && retries < maxRetries) {
          retries++
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
      500,
      'MAX_RETRIES_REACHED'
    )
  }

  async transferStandartSorted(
    fromUserId: string,
    toUserId: string,
    amount: number
  ): Promise<{ success: boolean }> {
    console.log('start transferStandart')
    try {
      const resultTransfer = await sequelize.transaction(async (t) => {
        console.log('start async fn transaction ')
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

        const userForUpdate = [fromUser, toUser].sort((a, b) =>
          a.id.localeCompare(b.id)
        )

        for (const user of userForUpdate) {
          if (user.id === fromUser.id) {
            const newFromBalance = fromUserNum - amount
            fromUser.balance = newFromBalance
            await fromUser.save({ transaction: t })
          } else {
            const newToBalance = toUserNum + amount
            toUser.balance = newToBalance
            await toUser.save({ transaction: t })
          }
        }

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

  async transferOptimistic(
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

        let [fromUpdateCount] = await User.update(
          { balance: fromUserNum - amount },
          {
            where: { id: fromUserId, updatedAt: fromUserUpdatedAt },
            transaction: t,
          }
        )

        if (fromUpdateCount === 0) {
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

  async transferPessimistic(
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

  async transferRepetableReadRetry(
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
            error.parent?.code === '40001'
              ? 'SERIALIZATION_FAILURE'
              : 'DEADLOCK'
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

  async transferSerializable(
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

  async transferSerializableRetry(
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
}
