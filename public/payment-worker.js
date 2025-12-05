/* eslint-disable no-restricted-globals */

// Payment Worker - Handles concurrent payment processing off the main thread

let isRunning = false;
let queue = [];
let activeRequests = 0;
let config = {
    apiUrl: 'http://localhost:3001/transfers',
    workers: 20,
    delay: 10,
    restartInterval: 200,
    payerIdType: 'MSISDN',
    payerId: '123456789'
};

// Batch updates to avoid flooding the main thread
let pendingLogs = [];
let lastUpdate = Date.now();
let processedCount = 0; // Local counter for restart logic

const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

self.onmessage = function (e) {
    const { type, payload } = e.data;

    switch (type) {
        case 'START':
            config = { ...config, ...payload.config };
            // IMPORTANT: Keep the original _index from the row, don't re-index!
            queue = [...payload.data];
            isRunning = true;
            processedCount = 0;
            processQueue();
            break;

        case 'STOP':
            isRunning = false;
            // Flush any pending updates before stopping
            flushUpdates(true);
            break;

        case 'UPDATE_CONFIG':
            config = { ...config, ...payload };
            break;
    }
};

async function processQueue() {
    if (!isRunning) return;

    // Fill up workers
    while (activeRequests < config.workers && queue.length > 0 && isRunning) {
        const item = queue.shift();
        activeRequests++;
        processItem(item).then(() => {
            activeRequests--;
            processQueue();
        });

        // Add slight delay between dispatching if configured
        if (config.delay > 0) {
            await new Promise(r => setTimeout(r, config.delay));
        }
    }

    // Check if done
    if (activeRequests === 0 && queue.length === 0) {
        isRunning = false;
        flushUpdates(true);
        self.postMessage({ type: 'COMPLETE' });
    } else {
        flushUpdates();
    }
}

async function processItem(row) {
    const txId = uuid();
    const payload = {
        from: { displayName: 'Government Pension Fund', idType: config.payerIdType, idValue: config.payerId },
        to: { idType: row.type_id, idValue: row.valeur_id },
        amountType: "SEND",
        currency: row.devise,
        amount: row.montant,
        transactionType: "TRANSFER",
        note: `Pension - ${row.nom_complet}`,
        homeTransactionId: txId
    };

    const startTs = Date.now();
    let result = {
        row,
        success: false,
        httpCode: 0,
        httpStatus: '',
        txId,
        duration: 0,
        timestamp: new Date().toISOString()
    };

    try {
        processedCount++;

        // Check for restart need
        if (processedCount > 0 && processedCount % config.restartInterval === 0) {
            self.postMessage({ type: 'RESTART_NEEDED' });
        }

        const res = await fetch(config.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const duration = Date.now() - startTs;
        let responseBody = {};
        try { responseBody = await res.json(); } catch { }

        result = {
            ...result,
            success: res.ok,
            httpCode: res.status,
            httpStatus: res.statusText,
            duration,
            transferId: responseBody.transferId || '',
            currentState: responseBody.currentState || responseBody.transferState?.currentState || '',
            message: responseBody.message || '',
            lastError: responseBody.lastError?.httpStatusCode || responseBody.transferState?.lastError?.httpStatusCode || ''
        };

    } catch (e) {
        result = {
            ...result,
            httpStatus: 'NETWORK_ERROR',
            message: e.message,
            duration: Date.now() - startTs
        };
    }

    // Queue update - send each result individually, main thread handles stats
    pendingLogs.push(result);
}

function flushUpdates(force = false) {
    const now = Date.now();
    if (force || (now - lastUpdate > 100 && pendingLogs.length > 0)) {
        self.postMessage({
            type: 'PROGRESS',
            payload: {
                logs: pendingLogs
            }
        });
        pendingLogs = [];
        lastUpdate = now;
    }
}
