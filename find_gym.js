const https = require('https');

const options = {
    hostname: 'thegymgroup.netpulse.com',
    port: 443,
    path: '/np/thegymgroup/v1.0/gyms?pageSize=500',
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'X-NP-Api-Version': '1.5',
        'X-NP-App-Version': '9999',
        'User-Agent': 'TheGymGroup/2.14.0 (iPhone; iOS 16.1.1; Scale/3.00)',
        'X-NP-User-Agent': 'clientType=MOBILE;devicePlatform=IOS;applicationName=The Gym Group;applicationVersion=2.14.0'
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const gyms = JSON.parse(data);
            const list = Array.isArray(gyms) ? gyms : (gyms.gyms || gyms.results || gyms.data || []);
            const cardiffGyms = list.filter(g => {
                const searchStr = `${g.name} ${g.city} ${g.address}`.toLowerCase();
                return searchStr.includes('cardiff') || searchStr.includes('newport');
            });
            console.log(JSON.stringify(cardiffGyms, null, 2));
        } catch (e) {
            console.log('Error parsing:', e.message);
        }
    });
});

req.on('error', e => console.error(e));
req.end();
