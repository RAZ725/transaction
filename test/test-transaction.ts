import User from '../src/models/User'
import { TransferService } from '../src/transfer.service'
import TransactionModel, { TransactionStatus } from '../src/models/Transaction'
import { TransferError } from '../src/errors/TransferError'

const transferService = new TransferService()

interface TransactionInt {
  fromUserId: string
  toUserId: string
  amount: number
}

const USERS = {
  alexey: 'cf6f445b-26f7-49e0-bd60-feb4aa67ac05',
  marina: '41a0c888-0a91-40bf-b4bd-484fdd4a714d',
  igor: '0099acb4-1520-4cf7-b7d5-2bfd4e4b0858',
}

function generateTransaction(count: number): TransactionInt[] {
  const transactionArray: TransactionInt[] = []

  for (let i = 0; i < count; i++) {
    if (i % 3 === 0) {
      const transactionObj = {
        fromUserId: USERS.alexey,
        toUserId: USERS.marina,
        amount: 250,
      }
      transactionArray.push(transactionObj)
    } else if (i % 3 === 1) {
      const transactionObj = {
        fromUserId: USERS.igor,
        toUserId: USERS.marina,
        amount: 300,
      }
      transactionArray.push(transactionObj)
    } else {
      const transactionObj = {
        fromUserId: USERS.marina,
        toUserId: USERS.alexey,
        amount: 450,
      }
      transactionArray.push(transactionObj)
    }
  }
  return transactionArray
}

async function checkBalances(): Promise<void> {
  console.log('checking balance function called')
  const users = await User.findAll({
    attributes: ['id', 'name', 'balance'],
    raw: true,
  })

  const transaction = await TransactionModel.findAll({
    where: { status: TransactionStatus.COMPLETED },
    attributes: ['id', 'fromUserId', 'toUserId', 'amount', 'status'],
    raw: true,
  })
  console.log('users: ', users)
  console.log('transaction: ', transaction)

  for (const userObj of users) {
    const initialBalance = 10000

    const outgoing = transaction
      .filter((elObj) => {
        return elObj.fromUserId === userObj.id
      })
      .reduce((acc, elObj) => {
        return acc + Number(elObj.amount)
      }, 0)

    const incoming = transaction
      .filter((elObj) => {
        return elObj.toUserId === userObj.id
      })
      .reduce((acc, elObj) => {
        return acc + Number(elObj.amount)
      }, 0)

    const expectedBalance = initialBalance - outgoing + incoming

    console.log(`User ${userObj.name}:`)
    console.log(`  Current balance: ${userObj.balance}`)
    console.log(`  Expected balance: ${expectedBalance}`)
    if (Number(userObj.balance) !== expectedBalance) {
      console.log(`  WARNING: Balance mismatch due to race conditions!`)
    }
    if (expectedBalance < 0) {
      console.log('ERROR: Expected balance is negative!')
    }
  }
}

async function runTransaction(): Promise<void> {
  try {
    const users = await User.findAll()

    if (users.length < 3) {
      console.log('log error db must be 3 users')
      throw new Error('db must be 3 users')
    }

    //generate transaction
    const transactionObjArray = generateTransaction(10)

    // Создаем промисы
    const promisesArray = transactionObjArray.map(async (trObj, index) => {
      try {
        const result = await transferService.transferStandart(
          trObj.fromUserId,
          trObj.toUserId,
          trObj.amount
        )

        return { success: true, index: index, result: result }
      } catch (error: any) {
        console.log('error', error)
        return {
          success: false,
          index: index,
          error:
            error instanceof TransferError ? error : new Error('unknow error'),
        }
      }
    })

    const resolvePromise = await Promise.all(promisesArray)
    console.log(resolvePromise)

    const successTransaction = resolvePromise.filter((elObj) => {
      return elObj.success === true
    }).length
    const failedTransaction = resolvePromise.filter((elObj) => {
      return elObj.success === false
    }).length

    console.log(
      `Result successful: ${successTransaction}, Result failed: ${failedTransaction}`
    )
    await checkBalances()
  } catch (error) {
    console.log('error in runTransaction in catch')
    console.log('error:', error)
  }
}
runTransaction()
