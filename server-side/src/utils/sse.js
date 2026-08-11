const clients = new Set();

function addClient(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  res.write('event: connected\n');
  res.write('data: {}\n\n');

  clients.add(res);

  res.on('close', () => {
    clients.delete(res);
  });
}

function broadcast(event, data) {
  const payload = JSON.stringify({ data, timestamp: Date.now() });
  clients.forEach((client) => {
    try {
      client.write(`event: ${event}\n`);
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      clients.delete(client);
    }
  });
}

module.exports = { addClient, broadcast };
