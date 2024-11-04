const bcrypt = require("bcryptjs")

const comparePasswords = async (password, hashedPassword) => {
  const passwordIsValid = await bcrypt.compare(password == undefined ? "" : password, hashedPassword)
  return passwordIsValid
}

module.exports = comparePasswords