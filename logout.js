const express = require("express");



const logout = express();
logout.use(express.json());

logout.post('/logout', async (req, res) => {
    res
        .clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' })
        .clearCookie('token', { httpOnly: true, sameSite: 'strict' })
        .send();
});

module.exports = logout;