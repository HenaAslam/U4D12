import createHttpError from "http-errors";
import atob from "atob";
import authorsModel from "../../api/authors/model.js";

export const basicAuthMiddleware = async (req, res, next) => {
  if (!req.headers.authorization) {
    next(
      createHttpError(401, "Please provide credentials in Authorization header")
    );
  } else {
    const encodedCredentials = req.headers.authorization.replace("Basic ", "");

    const credentials = atob(encodedCredentials);
    const [email, password] = credentials.split(":");

    const user = await authorsModel.checkCredentials(email, password);

    if (user) {
      req.user = user;
      next();
    } else {
      next(createHttpError(401, "Credentials are not ok!"));
    }
  }
};
