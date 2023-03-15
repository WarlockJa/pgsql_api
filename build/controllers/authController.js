import { OAuth2Client } from "google-auth-library";
async function verify({ clientId, credential }) {
    const client = new OAuth2Client(clientId);
    try {
        // Call the verifyIdToken to varify and decode it
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });
        // Get the JSON with all the user info
        const payload = ticket.getPayload();
        // This is a JSON object that contains all the user info
        return payload;
    }
    catch (error) {
        return error;
    }
}
const authUser = async (req, res) => {
    const { clientId, credential } = req.body;
    if (!clientId || !credential)
        return res.status(400).json({ message: 'insufficient data' });
    const verifiedUserData = await verify({ clientId, credential });
    res.status(200).json({ content: verifiedUserData });
};
export default { authUser };
//# sourceMappingURL=authController.js.map