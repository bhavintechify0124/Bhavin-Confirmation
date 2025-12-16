const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  returnMessage,
  validateEmail,
  passwordValidation,
  forgotPasswordEmailTemplate,
  capitalizeFirstLetter,
  verifyUser,
} = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../helpers/sendEmail");
const Skill = require("../models/skillsSchema");
const fs = require("fs");
const { eventEmitter } = require("../socket");
const Notification = require("../models/notificationSchema");
const Admin = require("../models/adminSchema");

class UserService {
  tokenGenerator = (payload) => {
    try {
      const expiresIn = payload?.remember_me
        ? process.env.JWT_REMEMBER_EXPIRE
        : process.env.JWT_EXPIRES_IN;
      const token = jwt.sign(
        { id: payload._id },
        process.env.JWT_User_SECRET_KEY,
        {
          expiresIn,
        }
      );
      return { token, user: payload };
    } catch (error) {
      logger.error(`Error while token generate, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // User Login
  logIn = async (payload) => {
    try {
      const { email, password, remember_me } = payload;

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      if (!passwordValidation(password)) {
        return throwError(returnMessage("auth", "invalidPassword"));
      }

      if (!email || !password)
        return throwError(
          returnMessage("auth", "emailPassNotFound"),
          statusCode.badRequest
        );
      const user_exist = await User.findOne({
        email,
        is_deleted: false,
      }).lean();
      if (!user_exist)
        return throwError(
          returnMessage("user", "userNotFound"),
          statusCode.notFound
        );

      if (!user_exist?.is_verified)
        return throwError(
          returnMessage("user", "userNotVerified"),
          statusCode.notFound
        );
      if (!user_exist?.is_active)
        return throwError(
          returnMessage("user", "userNotActive"),
          statusCode.notFound
        );

      const correct_password = await bcrypt.compare(
        password,
        user_exist?.password
      );
      if (!correct_password)
        return throwError(returnMessage("auth", "incorrectPassword"));

      const { is_active, is_verified, is_deleted, ...other_data } = user_exist;

      return this.tokenGenerator({ ...other_data, remember_me });
    } catch (error) {
      logger.error(`Error while user login, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // User Sign up
  signUp = async (payload, image) => {
    try {
      const { email, password, contact_number, first_name, last_name } =
        payload;

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      if (!passwordValidation(password)) {
        return throwError(returnMessage("auth", "invalidPassword"));
      }

      const user = await User.findOne({ email: email });
      if (user) {
        return throwError(returnMessage("auth", "emailExist"));
      }

      const hash_password = await bcrypt.hash(password, 14);

      const verification_token = crypto.randomBytes(32).toString("hex");

      let imagePath = "";
      if (image) {
        imagePath = "uploads/" + image.filename;
      }

      let newUser = await User.create({
        email,
        password: hash_password,
        first_name,
        last_name,
        contact_number,
        verification_token: verification_token,
        ...(imagePath && { profile_image: imagePath }),
      });
      newUser.save();

      const encode = encodeURIComponent(payload?.email);
      const link = `${process.env.REACT_APP_URL}/verify/?token=${verification_token}&email=${encode}`;
      const user_verify_template = verifyUser(
        link,
        payload?.first_name + " " + payload?.last_name
      );
      sendEmail({
        email: email,
        subject: returnMessage("emailTemplate", "verifyUser"),
        message: user_verify_template,
      });

      const admin = await Admin.findOne({});
      const message = `New user ${
        newUser.first_name + " " + newUser.last_name
      } joined"`;

      const notification = await Notification.create({
        user_id: admin._id,
        type: "general",
        // data_reference_id: id,
        message: message,
      });

      const with_unread_count = async (notification_data, user_id) => {
        const un_read_count = await Notification.countDocuments({
          user_id: user_id,
          is_read: false,
        });
        return {
          notification: notification_data,
          un_read_count: un_read_count,
        };
      };

      // Notification
      eventEmitter(
        "NOTIFICATION",
        await with_unread_count(notification, admin._id),
        admin._id
      );

      return;
    } catch (error) {
      logger.error(`Error while user signup: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Verify User
  verifyUser = async (payload) => {
    try {
      const { email, verification_token } = payload;
      const decodedMail = decodeURIComponent(email);
      const user = await User.findOne({
        email: decodedMail,
        verification_token: verification_token,
      });
      if (!user) {
        return throwError(returnMessage("admin", "userNotFound"));
      }
      user.verification_token = null;
      user.is_active = true;
      user.is_verified = true;
      user.save();
      return;
    } catch (error) {
      logger.error(`Error while user signup: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // User Change Password
  changePassword = async (payload, user_id) => {
    try {
      const { new_password, old_passworddddd } = payload;
      if (!old_passworddddd || !new_password) {
        return throwError(returnMessage("auth", "fillAll"));
      }

      if (new_password === old_passworddddd) {
        return throwError(returnMessage("auth", "oldAndNewPasswordSame"));
      }

      if (!passwordValidation(new_password)) {
        return throwError(returnMessage("auth", "invalidPassword"));
      }

      const user = await User.findById({ _id: user_id });
      if (!user) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      const is_match = await bcrypt.compare(old_passworddddd, user.password);
      if (!is_match) {
        return throwError(returnMessage("auth", "passwordNotMatch"));
      }
      const hash_password = await bcrypt.hash(new_password, 14);
      user.password = hash_password;
      await user.save();
    } catch (error) {
      logger.error(`Error while user changePassword, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // User get Profile
  getProfile = async (user) => {
    try {
      const getUser = await User.findOne(
        { _id: user._id, is_deleted: false },
        { is_deleted: 0, password: 0, __v: 0 }
      ).select(
        "-is_read -is_deleted -is_verified -is_active -verification_token"
      );
      return getUser;
    } catch (error) {
      logger.error(`Error while user get profile: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // User update Profile
  updateProfile = async (payload, user, image) => {
    try {
      const {
        first_name,
        last_name,
        gender,
        department,
        skills,
        contact_number,
      } = payload;
      let parsedSkills;

      if (skills !== undefined) {
        parsedSkills = JSON.parse(skills[1]);
      }

      let imagePath = false;
      if (image) {
        imagePath = "uploads/" + image.filename;
      } else if (image === undefined && !payload?.profile_image) {
        imagePath = "";
        const existingImage = await User.findById(user._id);
        existingImage &&
          fs.unlink(`./${existingImage.profile_image}`, (err) => {
            if (err) {
              logger.error(`Error while unlinking the documents: ${err}`);
            }
          });
      }

      // let updatedSkills = [];
      // if (Array.isArray(skills)) {
      //   updatedSkills = skills
      //     .filter((skill) => typeof skill === "string" && skill.trim() !== "")
      //     .map((skill) => skill.trim());
      // }

      parsedSkills &&
        parsedSkills[0] &&
        parsedSkills.forEach(async (item) => {
          const isExist = await Skill.findOne({
            value: item.value,
          });
          if (!isExist) {
            await Skill.create({
              value: item.value,
              label: item.label,
            });
          }
        });

      await User.findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          first_name,
          last_name,
          ...((imagePath || imagePath === "") && { profile_image: imagePath }),
          gender,
          department,
          ...(parsedSkills &&
            parsedSkills[0] && {
              skills: parsedSkills,
            }),
          ...(skills === undefined && {
            skills: [],
            contact_number,
          }),
        },
        { new: true, useFindAndModify: false }
      );

      return;
    } catch (error) {
      logger.error(`Error while affiliate signup: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // User Forgot Password
  forgotPassword = async (payload) => {
    try {
      const { email } = payload;

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      const user = await User.findOne({ email: email }, { password: 0 });
      if (!user) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }
      const reset_password_token = crypto.randomBytes(32).toString("hex");
      const encode = encodeURIComponent(email);
      const link = `${process.env.REACT_APP_URL}/reset-password?token=${reset_password_token}&email=${encode}`;
      const forgot_email_template = forgotPasswordEmailTemplate(
        link,
        user?.first_name + " " + user?.last_name
      );

      await sendEmail({
        email: email,
        subject: returnMessage("emailTemplate", "forgotPasswordSubject"),
        message: forgot_email_template,
      });

      const hash_token = crypto
        .createHash("sha256")
        .update(reset_password_token)
        .digest("hex");
      user.reset_password_token = hash_token;
      await user.save();
      return;
    } catch (error) {
      logger.error(`Error while user forgot password, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // User Reset Password

  resetPassword = async (payload) => {
    try {
      const { token, email, new_password } = payload;
      if (!passwordValidation(new_password)) {
        return throwError(returnMessage("auth", "invalidPassword"));
      }

      const hash_token = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        email: email,
        reset_password_token: hash_token,
        is_deleted: false,
      });

      if (!user) {
        return throwError(returnMessage("auth", "invalidToken"));
      }

      const hash_password = await bcrypt.hash(new_password, 14);
      user.password = hash_password;
      user.reset_password_token = null;
      await user.save();
      return;
    } catch (error) {
      logger.error(`Error while User resetPassword, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Add Skill

  addSkill = async (payload) => {
    try {
      const { value, label } = payload; // Assuming request body contains 'value' and 'label' fields

      // Create a new skill instance
      const newSkill = new Skill({
        value,
        label,
      });

      // Save the skill to the database
      await newSkill.save();
    } catch (error) {
      logger.error(`Error while Lising ALL skills , ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = UserService;
