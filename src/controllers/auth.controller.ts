import { InferType } from "yup";
import { SignInSchema, SignUpSchema } from "../types/auth";
import { validator } from "../middlewares/validators";
import bcrypt from "bcryptjs";
import middleware from "../middlewares";
import { db } from "../db/connect";
import utils from "../utils";
import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate";

export const signup = validator.catchError(
  async (req: AuthenticatedRequest, res: Response) => {
    await validator.signUp(req.body);

    const { confirmPassword, ...data } = req.body as any as InferType<
      typeof SignUpSchema
    >;

    // hash password
    const pwd = await bcrypt.hash(data.password, 12);

    const user = await db.user.create({
      data: {
        ...data,
        age: Number(data.age),
        password: pwd,
      },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        village: true,
        country: true,
        language: true,
      },
    });

    req.user = { ...user, stories: [] };
    const tokens = await utils.generateAuthJWT(data.email);

    res.statusMessage = "Login successful";

    res.status(200).json({ token: tokens.accessToken, user: req.user });
  }
);

export const signin = validator.catchError(
  async (req: AuthenticatedRequest, res: Response) => {
    await validator.signIn(req.body);

    const { password, email } = req.body as any as InferType<
      typeof SignInSchema
    >;

    req.user = await middleware.checkLoginCredentials(email, password);

    const tokens = await utils.generateAuthJWT(email);

    res.statusMessage = "Login successful";
    res.status(200).json({ token: tokens, user: req.user });
  }
);
