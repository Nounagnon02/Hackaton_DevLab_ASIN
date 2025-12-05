const http = require('http');
const { exec } = require('child_process');

const PROXY_PORT = 3001;
const SDK_HOST = 'localhost';
const SDK_PORT = 4001;

let isRestarting = false;

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Restart ALL containers (TTK + SDK + Redis)
    if (req.url === '/restart-all' && req.method === 'POST') {
        if (isRestarting) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Already restarting' }));
            return;
        }

        isRestarting = true;
        console.log('🔄 Restarting ALL containers (TTK + SDK + Redis)...');

        exec('docker-compose restart', { cwd: process.cwd() }, (error, stdout, stderr) => {
            if (error) {
                console.log('❌ Restart failed:', error.message);
                isRestarting = false;
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            } else {
                console.log('✅ All containers restarted, waiting for services...');
                // Wait for all services to be ready
                setTimeout(() => {
                    isRestarting = false;
                    console.log('✅ Services should be ready now');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'All containers restarted' }));
                }, 20000); // Wait 20 seconds for all services
            }
        });
        return;
    }

    // Restart SDK only
    if (req.url === '/restart-sdk' && req.method === 'POST') {
        if (isRestarting) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Already restarting' }));
            return;
        }

        isRestarting = true;
        console.log('🔄 Restarting SDK container...');

        exec('docker restart sdk-ttk-main-mojaloop-connector-load-test-1', (error) => {
            setTimeout(() => {
                isRestarting = false;
                res.writeHead(error ? 500 : 200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: !error }));
            }, 10000);
        });
        return;
    }

    // Flush Redis cache
    if (req.url === '/flush-cache' && req.method === 'POST') {
        exec('docker exec sdk-ttk-main-redis-1 redis-cli FLUSHALL', (error) => {
            res.writeHead(error ? 500 : 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: !error }));
        });
        return;
    }

    // Check status
    if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ isRestarting }));
        return;
    }

    // Block requests during restart
    if (isRestarting) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Services restarting, please wait...' }));
        return;
    }

    // Proxy to SDK
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        const options = {
            hostname: SDK_HOST,
            port: SDK_PORT,
            path: req.url,
            method: req.method,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        };

        const proxyReq = http.request(options, proxyRes => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => {
                res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        });

        proxyReq.on('error', err => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        });

        if (body) proxyReq.write(body);
        proxyReq.end();
    });
});

server.listen(PROXY_PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║  🚀 PROXY CORS + RESTART MANAGER                 ║
╠══════════════════════════════════════════════════╣
║  Port: ${PROXY_PORT}                                       ║
║  POST /restart-all  → Restart TTK + SDK + Redis  ║
║  POST /restart-sdk  → Restart SDK only           ║
║  POST /flush-cache  → Flush Redis cache          ║
╚══════════════════════════════════════════════════╝
`);
});
