import GoogleStrategy from "passport-google-oauth20";
import authorsModel from "../../api/authors/model.js";
import { createAccessToken } from "./tools.js";

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: `${process.env.API_URL}/authors/googleRedirect`,
  },
  //   function (accessToken, refreshToken, profile, cb) {}
  async (_, __, profile, passportNext) => {
    try {
      const { email, given_name, family_name, sub } = profile._json;
      console.log("PROFILE:", profile);

      const user = await authorsModel.findOne({ email });
      if (user) {
        const accessToken = await createAccessToken({
          _id: user._id,
          role: user.role,
        });

        passportNext(null, { accessToken });
      } else {
        const newUser = new authorsModel({
          name: given_name,
          surname: family_name,
          email,
          googleId: sub,
        });

        const createdUser = await newUser.save();

        const accessToken = await createAccessToken({
          _id: createdUser._id,
          role: createdUser.role,
        });

        passportNext(null, { accessToken });
      }
    } catch (error) {
      passportNext(error);
    }
  }
);

export default googleStrategy;
