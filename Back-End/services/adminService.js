const jwt = require("jsonwebtoken");
const Admin = require("../models/adminSchema");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  returnMessage,
  validateEmail,
  passwordValidation,
  forgotPasswordEmailTemplate,
  paginationObject,
} = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../helpers/sendEmail");
const User = require("../models/userSchema");
const Skill = require("../models/skillsSchema");
const fs = require("fs");
const Notification = require("../models/notificationSchema");
class AdminService {
  tokenGenerator = (payload) => {
    try {
      const expiresIn = payload?.remember_me
        ? process.env.JWT_REMEMBER_EXPIRE
        : process.env.JWT_EXPIRES_IN;

      const token = jwt.sign(
        { id: payload._id },
        process.env.JWT_ADMIN_SECRET_KEY,
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

  // Admin Login
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
      const admin_exist = await Admin.findOne({
        email,
        is_deleted: false,
      }).lean();
      if (!admin_exist)
        return throwError(
          returnMessage("admin", "adminNotFound"),
          statusCode.notFound
        );

      const correct_password = await bcrypt.compare(
        password,
        admin_exist?.password
      );
      if (!correct_password)
        return throwError(returnMessage("auth", "incorrectPassword"));
      return this.tokenGenerator({ ...admin_exist, remember_me });
    } catch (error) {
      logger.error(`Error while admin login, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Admin Change Password
  changePassword = async (payload, admin_id) => {
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

      const user = await Admin.findById({ _id: admin_id });
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
      logger.error(`Error while admin changePassword, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Admin get Profile
  getProfile = async (user) => {
    try {
      const getUser = await Admin.findOne(
        { _id: user._id, is_deleted: false },
        { is_deleted: 0, password: 0, __v: 0 }
      ).select("-reset_password_token");
      return getUser;
    } catch (error) {
      logger.error(`Error while admin get profile: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Admin update Profile
  updateProfile = async (payload, user, image) => {
    try {
      const { first_name, last_name } = payload;
      let imagePath = false;
      if (image) {
        imagePath = "uploads/" + image.filename;
      } else if (image === undefined && !payload?.profile_image) {
        imagePath = "";
        const existingImage = await Admin.findById(user._id);
        existingImage &&
          fs.unlink(`./${existingImage.profile_image}`, (err) => {
            if (err) {
              logger.error(`Error while unlinking the documents: ${err}`);
            }
          });
      }
      await Admin.findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          first_name,
          last_name,
          ...((imagePath || imagePath === "") && { profile_image: imagePath }),
        },
        { new: true, useFindAndModify: false }
      );

      return;
    } catch (error) {
      logger.error(`Error while affiliate signup: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Admin Forgot Password
  forgotPassword = async (payload) => {
    try {
      const { email } = payload;

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      const user = await Admin.findOne({ email: email }, { password: 0 });
      if (!user) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }
      const reset_password_token = crypto.randomBytes(32).toString("hex");
      const encode = encodeURIComponent(email);
      const link = `${process.env.REACT_APP_URL}/admin/reset-password?token=${reset_password_token}&email=${encode}`;
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
      logger.error(`Error while admin forgot password, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Admin Reset Password

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

      const user = await Admin.findOne({
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
      logger.error(`Error while admin resetPassword, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // User list

  userList = async (searchObj, user) => {
    try {
      const queryObj = {
        is_deleted: false,
      };

      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            first_name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },

          {
            last_name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            email: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            contact_number: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
        ];
      }
      if (searchObj.skill_name_n && searchObj.skill_name_n !== "") {
        queryObj["skills.value"] = {
          $regex: searchObj.skill_name_n.toLowerCase(),
          $options: "i",
        };
      }
      if (searchObj.gender && searchObj.gender !== "") {
        queryObj["gender"] = {
          $regex: searchObj.gender.toLowerCase(),
          $options: "i",
        };
      }
      if (searchObj.department && searchObj.department !== "") {
        queryObj["department"] = {
          $regex: searchObj.department.toLowerCase(),
          $options: "i",
        };
      }

      const pagination = paginationObject(searchObj);

      const [users, totalUser] = await Promise.all([
        User.find(queryObj)
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page)
          .select("-is_deleted")
          .lean(),
        User.countDocuments(queryObj),
      ]);

      return {
        user_list: users,
        page_count: Math.ceil(totalUser / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(`Error while Lising ALL Invoice Listing, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Customer list

  customerList = async (searchObj, user) => {
    try {
      const queryObj = {
        is_deleted: false,
      };

      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            first_name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },

          {
            last_name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            email: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            contact_number: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
        ];
      }
      if (searchObj.skill_name_n && searchObj.skill_name_n !== "") {
        queryObj["skills.value"] = {
          $regex: searchObj.skill_name_n.toLowerCase(),
          $options: "i",
        };
      }
      if (searchObj.gender && searchObj.gender !== "") {
        queryObj["gender"] = {
          $regex: searchObj.gender.toLowerCase(),
          $options: "i",
        };
      }
      if (searchObj.department && searchObj.department !== "") {
        queryObj["department"] = {
          $regex: searchObj.department.toLowerCase(),
          $options: "i",
        };
      }

      const pagination = paginationObject(searchObj);

      const [customers, totalCustomer] = await Promise.all([
        User.find(queryObj)
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page)
          .select("-is_deleted")
          .lean(),
        User.countDocuments(queryObj),
      ]);

      return {
        customer_list: customers,
        page_count: Math.ceil(totalCustomer / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(`Error while Listing ALL Customers, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Skill list

  skillList = async (searchObj) => {
    try {
      let queryObj = {};
      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
        ];
      }
      const skills = await Skill.find(queryObj)
        .select("-createdAt -updatedAt -__v")
        .lean();
      return skills;
    } catch (error) {
      logger.error(`Error while Listing ALL skills , ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Change user status

  changeUserStatus = async (payload, user_id) => {
    try {
      const user = await User.findByIdAndUpdate(
        user_id,
        { is_active: payload.status },
        { new: true }
      );
      if (!user) {
        return throwError(returnMessage("admin", "userNotFound"));
      }
      return;
    } catch (error) {
      logger.error(`Error while Listing ALL skills , ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Change user status

  deleteUser = async (payload, user_id) => {
    try {
      const user = await User.findByIdAndUpdate(
        user_id,
        { is_deleted: true },
        { new: true }
      );
      if (!user) {
        return throwError(returnMessage("admin", "userNotFound"));
      }
      return;
    } catch (error) {
      logger.error(`Error while Listing ALL skills , ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Get Notifications
  getNotification = async (user, searchObj) => {
    try {
      const { skip, limit } = searchObj;

      const admin = await Admin.findOne({});

      const notifications = await Notification.find({
        user_id: admin?._id,
      })
        .sort({ createdAt: -1, is_read: -1 })
        .skip(skip)
        .limit(limit);
      const un_read_count = await Notification.find({
        user_id: user._id,
        is_read: false,
      }).countDocuments();
      return {
        notificationList: notifications,
        un_read_count: un_read_count,
      };
    } catch (error) {
      logger.error(`Error while fetching agencies: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Read Notifications
  readNotification = async (payload, user) => {
    try {
      const { notification_id } = payload;
      const admin = await Admin.findOne({});
      if (notification_id === "all") {
        await Notification.updateMany(
          {
            user_id: admin._id,
          },
          {
            is_read: true,
          },
          { new: true }
        );
      } else {
        await Notification.findOneAndUpdate(
          {
            _id: notification_id,
            user_id: admin._id,
          },
          {
            is_read: true,
          },
          { new: true, useFindAndModify: false }
        );
      }

      return;
    } catch (error) {
      logger.error(`Error while fetching agencies: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = AdminService;
