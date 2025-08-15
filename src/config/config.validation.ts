import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.number().default(900),
  JWT_ISSUER: Joi.string().required(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.number().default(604800),

  DB_TYPE: Joi.string().valid('postgres', 'mysql', 'mariadb', 'sqlite', 'mssql', 'oracle').required(),

  DB_HOST: Joi.string().hostname().required(),

  DB_PORT: Joi.number().port().required(),

  DB_USERNAME: Joi.string().min(1).required(),

  DB_PASSWORD: Joi.string().allow('').required(),

  DB_NAME: Joi.string().min(1).required(),

  DB_SYNC: Joi.boolean().truthy('true').falsy('false').default(false),

  DB_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),

  REDIS_URL: Joi.string().required().default('redis://localhost:6379'),
});
