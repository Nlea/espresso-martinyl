import { z } from 'zod';

export interface FormattedZodError {
  path: string[];
  message: string;
  code?: string;
  expected?: string;
  received?: string;
}

export const formatZodError = (issues: z.ZodIssue[]): FormattedZodError[] => {
  const formattedErrors: FormattedZodError[] = [];

  for (const issue of issues) {
    if (issue.code === 'invalid_union') {
      // Handle union errors by flattening all nested issues
      for (const unionError of issue.unionErrors) {
        formattedErrors.push(...formatZodError(unionError.issues));
      }
    } else {
      formattedErrors.push({
        path: issue.path.map(String),
        message: issue.message,
        code: issue.code,
        ...(issue.code === 'invalid_type' && {
          expected: (issue as z.ZodInvalidTypeIssue).expected,
          received: (issue as z.ZodInvalidTypeIssue).received,
        }),
      });
    }
  }

  return formattedErrors;
};
