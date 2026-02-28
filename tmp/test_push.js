const { sendPushNotification } = require('./src/lib/push-server');
const path = require('path');
const envPath = path.resolve('c:/Users/Karr/Documents/Projects/karr-OS/.env.local');
require('dotenv').config({ path: envPath });

async function test() {
    process.env.PAGER = 'cat';
    console.log('--- Testing Push for karr ---');
    try {
        const result = await sendPushNotification(
            '🕵️ Debug Alert',
            'This is a manual test of the push system. Time: ' + new Date().toLocaleTimeString(),
            '/finances'
        );
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Fatal Test Error:', err);
    }
}

test();
