// validates req.body or req.params 
const validate = (schema, source = "body") => {
    return (req, res, next) => {
        const data = source === "params" ? req.params : req.body;
        const { error } = schema.validate(data, { abortEarly: false });

        if (error) {
            const messages = error.details.map((d) => d.message);
            res.status(400).send({ error: "Validation failed", details: messages });
            return;
        }

        next();
    };
};

export default validate;
