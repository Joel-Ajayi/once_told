import { HttpError } from "../utils/error";
import { db } from "../db/connect";
import bcrypt from "bcryptjs";
import consts from "../types/conts";
import { User } from "../types/user";
import { Decimal } from "@prisma/client/runtime/library";

class MiddleWare {
  public checkUser(user?: User | null) {
    if (!user) {
      throw new HttpError(consts.errors.signIn, 401);
    }
  }

  public async checkLoginCredentials(
    email: string,
    pass: string
  ): Promise<User> {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        village: true,
        country: true,
        language: true,
        password: true,
      },
    });

    if (!user) {
      throw new HttpError(consts.errors.invalidSignIn, 400);
    }

    const { password, ...rest } = user;

    const isMatched = await bcrypt.compare(pass, user.password);
    if (!isMatched) {
      throw new HttpError(consts.errors.invalidSignIn, 400);
    }
    return {
      ...rest,
      stories: [],
    };
  }

  public async alreadySignedUp(email: string): Promise<void> {
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      throw new HttpError(consts.errors.userAlreadyExist, 400);
    }
  }

  public async alreadySignedIn(user: User | null | undefined): Promise<void> {
    if (!!user) {
      throw new HttpError(consts.errors.alreadySignedIn, 400);
    }
  }
}

const middleware = new MiddleWare();
export default middleware;
