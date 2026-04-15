import Joi from "joi";

export const bookSeatSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().min(1).max(255).required(),
});
