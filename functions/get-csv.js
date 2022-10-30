exports.handler = async (event, context) => {
  const gameId = event.queryStringParameters.recid
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foo: gameId }),
  }
}
