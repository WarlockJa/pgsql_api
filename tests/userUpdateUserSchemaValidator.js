import Joi from "joi";

export default {
    validateExternalId: (schema, name) => {
        return (req, res, next) => {
            const result = Joi.validate({ param: req.params[name] }, schema);
            if (result.error) {
            return res.status(400).send(result.error.details[0].message);
            }
            next();
        };
    },
    schemas: {
        schemaUpdateUser: Joi.object({
            // user name
            name: Joi.string()
                .min(1)
                .max(254),
            // user surname
            surname: Joi.string().
                min(0),
            // new password is checked for complexity rules
            oldpassword: Joi.string(),
            newpassword: Joi.string().pattern(new RegExp(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,60}$/)),
            // preferred theme s - system, d - dark, l - light
            preferredtheme: Joi.string().valid('s', 'd', 'l'),
            locale: Joi.string().valid('en-US'),
            picture: Joi.string()
        }).and('oldpassword', 'newpassword')
    },
  };