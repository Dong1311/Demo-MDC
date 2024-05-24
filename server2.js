
require('dotenv').config();
const express = require('express');
const sql = require("mssql");
const crypto = require('crypto');
const path = require('path');
const rateLimit = require('express-rate-limit');

const PORT = process.env.PORT || 8080;
const app = express();

const useRateLimiter = false;

const loginLimiter = rateLimit({
    windowMs:  5 * 1000, 
    max: 5, //Gioi han 5 rq
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
        res.status(429).json({ message: "Too many requests, please try again later." });
    }
});

app.use(express.json());

var config = {
    user: 'dong1313',        
    password: 'dong1313',
    server: 'localhost',
    database: 'Test23_5',  
    options: {
        enableArithAbort: true,
        encrypt: true,
        trustServerCertificate: true 
    }
};

app.get('/initialize-users', async function (req, res) {
    try {
        await sql.connect(config);
        const request = new sql.Request();
        const tableCreationQuery = `
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
            BEGIN
                CREATE TABLE users (
                    userid INT IDENTITY(1,1) PRIMARY KEY,
                    username VARCHAR(256) NOT NULL UNIQUE,
                    password VARCHAR(256) NOT NULL,
                    loggedin SMALLINT DEFAULT 0,
                    loggedAt DATETIME
                )
            END
        `;
        await request.query(tableCreationQuery);

        let totalUsers = 0;
        while (totalUsers < 1000000) {
            const insertQuery = "INSERT INTO users (username, password) VALUES ";
            const userValues = [];
            while (userValues.length < 1000 && totalUsers < 1000000) {
                const username = generateUniqueUsername();
                const randomPassword = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
                const hashedPassword = crypto.createHash('sha256').update(randomPassword).digest('hex');

                userValues.push(`('${username}', '${hashedPassword}')`);
                totalUsers++;
            }

            try {
                await request.query(insertQuery + userValues.join(','));
            } catch (error) {
                if (error.message.includes('Violation of UNIQUE KEY constraint')) {

                    totalUsers -= userValues.length; // Rollback 
                    continue; // Thu lai
                } else {
                    throw error; 
                }
            }
        }

        res.send('Initialized 1,000,000 users successfully!');
    } catch (err) {
        console.error(err);
        res.send('Error initializing users: ' + err.message);
    }
});

app.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname, 'page2.html'));
});


app.post('/login', useRateLimiter ? loginLimiter : (req, res, next) => next(), async function (req, res) {
    const { username, password } = req.body;
    const passwordAsNumberString = password.toString();
    const hashedPassword = crypto.createHash('sha256').update(passwordAsNumberString).digest('hex');

    try {
        await sql.connect(config);
        const request = new sql.Request();
        const query = `SELECT userid FROM users WHERE username = @username AND password = @hashedPassword`;
        request.input('username', sql.VarChar, username);
        request.input('hashedPassword', sql.VarChar, hashedPassword);

        const result = await request.query(query);
        if (result.recordset.length > 0) {
            const userid = result.recordset[0].userid;
            const updateQuery = `UPDATE users SET loggedin = 1, loggedAt = GETDATE() WHERE userid = @userid`;
            request.input('userid', sql.Int, userid);
            await request.query(updateQuery);

            res.json({ status: 'success', message: 'Login successful', userid: userid });
        } else {
            res.json({ status: 'failed', message: 'Invalid username or password' });
        }
    } catch (err) {
        console.error(err);
        if (err.status === 429) {
            res.status(429).json({ status: 'error', message: 'Too many requests, please try again later.' });
        } else {
            res.status(500).json({ status: 'error', message: 'An error occurred during the login process.' });
        }
    }
});


function generateUniqueUsername() {
    return Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('');
}

var server = app.listen(PORT, () => console.log(`Server is starting at port ${PORT}`));

