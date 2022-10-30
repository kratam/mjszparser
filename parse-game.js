const cheerio = require('cheerio')
const converter = require('json-2-csv')
const puppeteer = require('puppeteer')

const getHtml = async (url) => {
  console.log('getting url', url)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto(url)
  await page.waitForSelector('#GameData')
  const data = await page.evaluate(() => document.querySelector('*').outerHTML)
  await browser.close()
  return data
}

const playerCols = [
  'sor',
  'number',
  'name',
  'position',
  'G',
  'A',
  'P',
  'PlusMinus',
  'Penalties',
  'Shots',
]

const countAssists = ($, addStat) => {
  $('.assist ul').map((i, goals) => {
    $(goals)
      .find('li')
      .map((i, player) => {
        try {
          const playerName = $(player)
            .text()
            .trim()
            .match(/\s(.*)/g)[0]
            .trim()
          if (playerName) addStat(playerName, `A${i + 1}`)
        } catch (error) {
          // probably regex error, nothing to worry about
        }
      })
  })
}

const countStats = ($, addStat) => {
  $('.IHD-TABLE tbody tr').map((i, playerRow) => {
    const stat = {}
    let name = ''
    const numberCols = [
      // 'sor',
      // 'number',
      'G',
      'P',
      'PlusMinus',
      'Penalties',
      'Shots',
    ]
    $(playerRow)
      .find('td')
      .map((ii, tdData) => {
        try {
          const col = playerCols[ii]
          const data = $(tdData).text().replaceAll(/\n/g, '').trim()
          if (numberCols.includes(col)) stat[col] = Number(data)
          if (col === 'name') name = data
        } catch (error) {
          // nothing to worry
        }
      })
    if (name && Object.keys(stat).length === numberCols.length) {
      Object.keys(stat).forEach((statKey) => {
        addStat(name, statKey, stat[statKey])
      })
    }
  })
}

const convertToCsv = (json) => {
  const data = Object.keys(json).map((name) => ({ name, ...json[name] }))
  return converter.json2csvAsync(data)
}

const parseGame = async (gameId) => {
  const url = `https://www.jegkorongszovetseg.hu/event/game/${gameId}`
  const html = await getHtml(url)
  const $ = cheerio.load(html)
  const stats = {}
  // helper function to add stats to the object
  const addStat = (player, statType, value = 1) => {
    const playerStat = stats[player] || {
      GP: 1,
      G: 0,
      A1: 0,
      A2: 0,
      Shots: 0,
      P: 0,
      Penalties: 0,
      PlusMinus: 0,
    }
    playerStat[statType] += value
    stats[player] = playerStat
  }

  // count assists
  countAssists($, addStat)
  // everything else is counted for us
  countStats($, addStat)

  const csv = await convertToCsv(stats)
  return csv
}

module.exports = { parseGame }
