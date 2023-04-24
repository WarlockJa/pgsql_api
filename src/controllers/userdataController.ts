// GET identify IP address from user's request
const getGeodata = (req, res) => {
    // console.log(req.headers['x-forwarded-for']);
    return res.status(200).json({ message: req.socket.remoteAddress, status: 200 });
}

export default { getGeodata }