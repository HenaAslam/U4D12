import { checkSchema, validationResult } from "express-validator";
import createHttpError from "http-errors";

const blogSchema = {
  category: {
    in: ["body"],
    isString: {
      errorMessage: "Category is a mandatory field and needs to be a string",
    },
    isLength: {
      errorMessage: "category can't be empty",

      options: { min: 1 },
    },
  },
  title: {
    in: ["body"],
    isString: {
      errorMessage: "Title is a mandatory field and needs to be a string",
    },
    isLength: {
      errorMessage: "title can't be empty",

      options: { min: 1 },
    },
  },

  cover: {
    in: ["body"],
    isString: {
      errorMessage: "Cover is a mandatory field and needs to be a string",
    },
  },
  content: {
    in: ["body"],
    isString: {
      errorMessage: "Content is a mandatory field and needs to be a string",
    },
    isLength: {
      errorMessage: "content can't be empty",

      options: { min: 1 },
    },
  },

  "readTime.value": {
    in: ["body"],
    isDecimal: {
      errorMessage:
        "readTime value is a mandatory field and needs to be a number",
    },
    isLength: {
      errorMessage: "readtime can't be empty",

      options: { min: 1 },
    },
  },
  "readTime.unit": {
    in: ["body"],
    isString: {
      errorMessage:
        "readTime unit is a mandatory field and needs to be a string",
    },
  },
  "author.name": {
    in: ["body"],
    isString: {
      errorMessage: "author name is a mandatory field and needs to be a string",
    },
    isLength: {
      errorMessage: "author name can't be empty",

      options: { min: 1 },
    },
  },
  "author.avatar": {
    in: ["body"],
    isString: {
      errorMessage:
        "author avatar is a mandatory field and needs to be a string",
    },
    isLength: {
      errorMessage: "author avatar can't be empty",

      options: { min: 1 },
    },
  },
};

export const checkBlogSchema = checkSchema(blogSchema);

export const triggerBadRequest = (req, res, next) => {
  const errors = validationResult(req);

  console.log(errors.array());

  if (errors.isEmpty()) {
    next();
  } else {
    next(
      createHttpError(400, "Errors during blog validation", {
        errorsList: errors.array(),
      })
    );
  }
};
