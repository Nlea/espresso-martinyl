import type { ValidationTargets, Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { formatZodError } from '../lib/zod-error';
//import { validator } from 'hono/validator';

export const customZodValidator = <
  Target extends keyof ValidationTargets,
  Schema extends z.ZodSchema
>(target: Target, schema: Schema) => {
    
  
  return zValidator(target, schema, (result, c) => {

    // We have to run validation ourselves
    //return validator(target, async (value, c: Context): Promise<z.output<Schema>> => {
    //const result = await schema.safeParseAsync(value);
    
    if (!result.success) {
      return c.json({
        success: false,
        timestamp: Date.now(),
        error: {
          message: `Invalid ${target}`,
          issues: formatZodError(result.error.issues)
        }
      }, 400);
    }
    return result.data;
  });
};
