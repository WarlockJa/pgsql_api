import { pool } from '../db/DBConnect.js';
import compareTimestamps from '../util/compareTimestamps.js';
const verifyUser = async (req, res) => {
    const userEmail = req.params.email;
    const confirmationToken = req.params.token;
    try {
        const result = await pool.execute('SELECT * FROM verify WHERE email = ?', [userEmail]);
        // checking that verification request was issued
        if (Array.isArray(result[0]) && result[0].length === 0)
            return res.sendStatus(400);
        const verificationRequest = result[0][0];
        // verufying token data
        if (verificationRequest.token !== confirmationToken)
            return res.status(401).json({ message: 'Incorrect verification data' });
        // checking that verification request is not outdated
        // compareTimestamps accepts MySQL timestamp string, MySQL Offset (Planetscale MySQL UTC-4), and max delta in seconds
        if (!compareTimestamps({ mySQLTimestamp: verificationRequest.ts, mySQLOffset: -4, maxDelta: 10 * 60 }))
            return res.status(400).json({ message: 'Verification link expired' });
        // applying verified status and removing verification request data from the DB
        await pool.execute('DELETE FROM verify WHERE email = ?', [userEmail]);
        await pool.execute('UPDATE users SET email_confirmed = ? WHERE email = ?', [true, userEmail]);
        return res.status(200).json({ message: `${userEmail} verified` });
    }
    catch (error) {
        return res.status(500).json({ message: error.stack });
    }
};
export default { verifyUser };
//# sourceMappingURL=verifyEmailController.js.map