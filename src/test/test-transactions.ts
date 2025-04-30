import { transferStandart } from '../services/DefaultTransation.services.js'
import { transferStandartSorted } from '../services/DefaultTransaction.services.SortedId'
import { transferStandartRetry } from '../services/DefaultTransaction.services.Retry.js'
import { transferPessimistic } from '../services/PessimisticTransaction.services'
import { transferOptimistic } from '../services/OptimisticNoRetry.services'
import { transferRepetableReadRetry } from '../services/RepetableRead.services.Retry'
import { transferSerializable } from '../services/SerializableDefault.services'
import { transferSerializableRetry } from '../services/SerializableRetry.services'
import User from '../models/User'
import TransactionModel, {
  TransactionStatus,
  TransactionAttributes,
} from '../models/Transaction'
import { TransferError } from '../errors/TransferError'

interface TransactionInt {
  fromUserId: string
  toUserId: string
  amount: number
}

// UUID пользователей взятые из бд
const USERS = {
  alexey: 'cba225a3-ff75-41e3-bcf5-2edc711a3350',
  marina: 'dbe8eb3b-475c-4a9d-9a7e-30e611bd49c4',
  igor: '9beb5dfe-10d6-4e1b-a996-38a5c74251a1',
}

// Генерация транзакций
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
  // Способ 3: Использовать raw: true в findAll
  // Sequelize позволяет вернуть сразу простые объекты, а не экземпляры моделей,
  // с опцией raw: true. Это похоже на .get({ plain: true }), но делается на уровне запроса
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

  // Преобразуем в простые объекты
  // user.get({ plain: true }) возвращает только данные (dataValues) без метаданных Sequelize.
  // map применяет это ко всем пользователям и транзакциям.
  // const plainUsers = users.map((user) => user.get({ plain: true }))
  // const plainTransactions = transaction.map((transaction) =>
  //   transaction.get({ plain: true })
  // )

  // console.log('Users:', plainUsers)
  // console.log('Transactions:', plainTransactions)
}

async function runTransaction(): Promise<void> {
  try {
    const users = await User.findAll()

    if (users.length < 3) {
      console.log('log error db must be 3 users')
      throw new Error('db must be 3 users')
    }

    //generate transaction
    const transactionObjArray = generateTransaction(20)

    // Создаем промисы
    const promisesArray = transactionObjArray.map(async (trObj, index) => {
      try {
        const result = await transferSerializableRetry(
          trObj.fromUserId,
          trObj.toUserId,
          trObj.amount,
          10
        )
        // return transferStandart(trObj.fromUserId, trObj.toUserId, trObj.amount)
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

/**
 * Твоё заблуждение:

Ты подумал, что 8 % 3 даёт 2.6 или что-то связанное с дробной частью. Это не так.
8 % 3 = 2, потому что после деления 8 на 3 (2 раза по 3 = 6) остаётся 2.
Ты также упомянул "остаток 6" (8 / 3 = 2, остаток 6). Это неверно: остаток не может быть больше делителя (3). Остаток всегда от 0 до 2 для деления на 3.
Вывод:

Для деления на 3 (i % 3) возможны только три значения остатка:
0 (например, 9 % 3 = 0).
1 (например, 7 % 3 = 1).
2 (например, 8 % 3 = 2).
Поэтому i % 3 идеально подходит для трёх условий: if (i % 3 === 0), else if (i % 3 === 1), else (или else if (i % 3 === 2)).
 */

// const array = [
//   transferStandart(
//     'dbe8eb3b-475c-4a9d-9a7e-30e611bd49c4',
//     'cba225a3-ff75-41e3-bcf5-2edc711a3350',
//     50
//   ),
//   transferStandart(
//     'cba225a3-ff75-41e3-bcf5-2edc711a3350',
//     'dbe8eb3b-475c-4a9d-9a7e-30e611bd49c4',
//     200
//   ),
// ]
// console.log('promise ready')
// Promise.all(array).then((res) => console.log(res))
// console.log('after promise')
