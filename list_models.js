const https = require('https');

const apiKey = 'AIzaSyAtG98EaM6svIUMoC2e26yTaCcPksxncx8';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

const fs = require('fs');

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        fs.writeFileSync('models.json', JSON.stringify(JSON.parse(data), null, 2));
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
