console.log('start code')

// const tasks = [1, 2, 3]
const tasks = [1]

// Функция, имитирующая transferStandart
async function asyncTask(id) {
  console.log(`Starting task ${id}`)
  // Имитация асинхронной работы (например, база)
  await new Promise((resolve, reject) => {
    console.log(`sync log in promise: ${id}`)
    setTimeout(() => {
      console.log(`log in time ${id}`)
      if (id === 2) reject(new Error(`Error in task ${id}`))
      else resolve(`Result, resolve with: ${id}`)
    }, 1000)
  })
  console.log(`Finished task ${id}`)
  return `Success, end code in promise callb ${id}`
}

const promises = tasks.map(async (id) => {
  console.log(`Creating promise for task ${id}`)
  try {
    const result = await asyncTask(id)
    return { success: true, id, result: result }
  } catch (error) {
    return { success: false, id, error }
  }
})

console.log('After map:', promises)
Promise.all(promises).then((results) => console.log('Results:', results))

console.log('end code')

/**
 * start code
 * Creating promise for task 1
 * Starting task 1
 * sync log in promise: 1
 * After map:', [Proimses pending]
 * end code
 * log in time 1
 * Finished task 1
 * Results:', [{succes: true, id: 1}]
 */
