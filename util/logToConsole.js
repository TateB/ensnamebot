export async function logToConsole(category, message, isError = false) {
  const date = new Date()
  const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
  const command = `[${time}][${category}]: ${message}`
  isError ? console.error(command) : console.log(command)
}
