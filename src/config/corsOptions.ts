// Cross Origin Resource Sharing
import allowedOrigin from './allowedOrigin.js';
// corsOptions from the documentation
const corsOptions = {
    origin: (origin: string, callback) => {
        if(allowedOrigin.indexOf(origin) !== -1 || !origin) { // !origin for localhost testing
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus: 200
}

export default corsOptions;