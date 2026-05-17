import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(2, "Username must be at least 2 characters."),
  password: z.string().min(4, "Password must be at least 4 characters."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
