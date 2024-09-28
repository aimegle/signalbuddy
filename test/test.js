import tape from 'tape';
import config from 'getconfig';
import io from 'socket.io-client';
import { createServer } from 'http';
import sockets from '../src/sockets';

const test = tape.createHarness();

let testsFailed = false;

const output = test.createStream();
output.pipe(process.stdout);
output.on('end', () => {
  console.log(testsFailed ? 'Some tests failed. Exiting with status 1.' : 'Tests complete.');
  process.exit(testsFailed ? 1 : 0);
});

// Create a server instance for testing
const server = createServer();
sockets(server, config);

const { port } = config.server;
const socketURL = `http://localhost:${port}`;

const socketOptions = {
  transports: ['websocket'],
  'force new connection': true,
  secure: false
};

test('Server setup', (t) => {
  server.listen(port, () => {
    console.log(`Test server listening on port ${port}`);
    t.pass('Server started successfully');
    t.end();
  });
});

test('it should not crash when sent an empty message', (t) => {
  t.plan(1);
  const client = io.connect(socketURL, socketOptions);

  client.on('connect', () => {
    client.emit('message');
    t.ok(true, 'Empty message sent without crashing');
    client.disconnect();
  });
});

// Updated test for getMyId
test('it should return client id when getMyId is called', (t) => {
  t.plan(2);
  const client = io.connect(socketURL, socketOptions);

  client.on('connect', () => {
    console.log('Client connected for getMyId test');

    // Join a room first
    client.emit('join', 'testRoom', (err, joinData) => {
      t.ok(joinData, 'Received join data');
      console.log('Join data:', joinData);

      // Now get client id
      client.emit('getMyId', (clientId) => {
        t.ok(clientId, 'Received client id');
        console.log('Client id:', clientId);
        client.disconnect();
      });
    });
  });

  client.on('disconnect', () => {
    console.log('Client disconnected for getMyId test');
    t.end();
  });

  client.on('error', (error) => {
    console.error('Socket error:', error);
    t.fail('Socket error occurred in getMyId test');
    testsFailed = true;
    t.end();
  });

  // Add a timeout in case the test hangs
  setTimeout(() => {
    console.error('Test timed out in getMyId test');
    client.disconnect();
    t.fail('Test timed out in getMyId test');
    testsFailed = true;
    t.end();
  }, 5000); // 5 second timeout
});

// New test for stunservers
test('it should receive stunservers on connection', (t) => {
  t.plan(1);
  const client = io.connect(socketURL, socketOptions);

  client.on('stunservers', (stunservers) => {
    console.log('Received stunservers:', stunservers);
    t.ok(Array.isArray(stunservers), 'Received stunservers as an array');
    client.disconnect();
  });

  client.on('connect', () => {
    console.log('Client connected for stunservers test');
  });

  client.on('disconnect', () => {
    console.log('Client disconnected from stunservers test');
    t.end();
  });

  client.on('error', (error) => {
    console.error('Socket error in stunservers test:', error);
    t.fail('Socket error occurred in stunservers test');
    testsFailed = true;
    t.end();
  });

  // Add a timeout in case the test hangs
  setTimeout(() => {
    console.error('Stunservers test timed out');
    client.disconnect();
    t.fail('Stunservers test timed out');
    testsFailed = true;
    t.end();
  }, 5000); // 5 second timeout
});

test('Teardown', (t) => {
  server.close(() => {
    console.log('Test server closed');
    t.pass('Server closed successfully');
    t.end();
  });
});
