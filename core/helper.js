const bcrypt = require('bcryptjs')

module.exports.hash = (string) => {
  if (!string) {
    return Promise.resolve(
      {
        hashed: null,
        salt: null
      }
    )
  }
  const saltRound = 10

  return bcrypt.genSalt(saltRound)
    .then(salt => {
      return bcrypt.hash(string, salt)
        .then(hashed => {
          return {
            hashed,
            salt
          }
        })
    })
}

module.exports.checkHash = (string, hashed) => {
  return bcrypt.compare(string, hashed)
}
