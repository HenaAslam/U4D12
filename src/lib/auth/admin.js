import createHttpError from "http-errors";

export const adminOnlyMiddleware = (req, res, next) => {
  if (req.user.role === "admin") {
    next();
  } else {
    next(createHttpError(403, "Admins  only endpoint!"));
  }
};
