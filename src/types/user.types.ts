export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHashed: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  tokenVersion: number;
  resetPasswordToken: string;
  resetPasswordExpires: Date;
}
