import * as Joi from 'joi';

export const validationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  SECRET_JWT: Joi.string().required().min(16),
  SECRET_ORDER: Joi.string().required().min(16),
  PORT: Joi.number().default(3000),
});
