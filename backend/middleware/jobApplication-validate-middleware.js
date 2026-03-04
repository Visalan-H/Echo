// Middleware to validate incoming job application data against defined Joi schemas before processing it in the controller.
function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const messages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: messages });
        }

        req.validatedBody = value;
        next();
    };
}

module.exports = validate;
