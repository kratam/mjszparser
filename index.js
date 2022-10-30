const express = require('express')
const cors = require('cors')
const { parseGame } = require('./parse-game')

const app = express()

app.use(cors())
app.use(express.json())

const PORT = 3070

app.listen(PORT, () => console.log(`server started on port ${PORT}`))

app.get('/get-csv', async (req, res) => {
  try {
    const gameId = req.query.gameId
    const csv = await parseGame(gameId)
    res.setHeader('Content-disposition', `attachment; filename=${gameId}.csv`)
    res.set('Content-Type', 'text/csv')
    res.status(200).send(csv)
  } catch (error) {
    console.error(error)
    res.status(500).send(error && error.message || `unknown error`)
  }
})
