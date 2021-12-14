const express = require('express')
const app = express()
require('dotenv').config()

const { loginUser, registerUser, verifyUser } = require('./cognito')

app.listen(3000, () => {
  console.log(`app listening at http://localhost:3000`)
})

app.post('/login', async (req, res) => {
  const { email, password } = req.query

  try {
    const response = await loginUser({
      email: email,
      password: password,
    })

    res.json(response)
  } catch (err) {
    res.json({ error: err })
  }
})

app.post('/register', async (req, res) => {
  const { email, username, password } = req.query

  try {
    const response = await registerUser({
      email: email,
      username: username,
      password: password,
    })

    res.json(response)
  } catch (err) {
    res.json({ error: err })
  }
})

app.post('/verify', async (req, res) => {
  const { token } = req.query

  try {
    const response = await verifyUser({ token })

    res.json(response)
  } catch (err) {
    res.json({ error: err })
  }
})
