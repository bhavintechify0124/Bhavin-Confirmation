import logo from "../../assets/butterfly.png";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import { useNavigate, useLocation, useResolvedPath } from "react-router-dom";
import defaultImage from "../../assets/profileImg.webp";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import data from "../../assets/data.json";
import Select from "react-select";
import {
  userPasswordUpdateAction,
  userProfileGetAction,
  userProfileUpdateAction,
} from "../../Redux/User/UserAction";
import {
  adminPasswordUpdateAction,
  adminProfileGetAction,
  adminProfileUpdateAction,
} from "../../Redux/Admin/AdminAction";
import { clearUser, logOut } from "../../Redux/Auth/AuthSlice";
const apiUrl = import.meta.env.VITE_BASE_URL;

const passwordSchema = yup.object().shape({
  old_passworddddd: yup
    .string()
    .required("Old password is required")
    .matches(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[a-z]).{8,}$/,
      "Password must be at least 8 characters with an uppercase letter and a special character"
    ),
  new_password: yup
    .string()
    .required("New password is required")
    .matches(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[a-z]).{8,}$/,
      "Password must be at least 8 characters with an uppercase letter and a special character"
    ),
  confirm_new_password: yup
    .string()
    .required("Confirm new password is required")
    .oneOf(
      [yup.ref("new_password"), null],
      "Passwords must match with new password"
    ),
});

const ChangePassword = () => {
  const loading = useSelector((state) => state.admin.passwordChange.loading);
  const user = useSelector((state) => state?.auth.user);

  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const adminUrl = location.pathname.includes("admin");

  const {
    handleSubmit,
    control,
    setValue,
    register,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(passwordSchema),
  });
  const onComplete = (response) => {
    dispatch(logOut());
    if (adminUrl) {
      navigate("/admin/signin");
    } else {
      navigate("/signin");
    }
    toast.success(response.data.message);
  };
  const onError = (response) => {
    toast.error(response.data.message);
  };
  const onSubmit = (data) => {
    if (adminUrl) {
      dispatch(
        adminPasswordUpdateAction({
          functions: {
            onComplete: onComplete,
            formData: data,
            onError,
          },
        })
      );
    } else {
      dispatch(
        userPasswordUpdateAction({
          functions: {
            onComplete: onComplete,
            formData: data,
            onError,
          },
        })
      );
    }
  };

  useEffect(() => {
    if (user === null) {
      navigate("/signin");
    } else if (user?.role === "admin" && !adminUrl) {
      dispatch(logOut());
      navigate("/admin/signin?logout=true");
    } else if (user?.role === "user" && adminUrl) {
      dispatch(logOut());
      navigate("/signin?logout=true");
    }
  }, []);

  return (
    <div class="card-body px-3 px-md-7 px-xl-4 " style={{ marginTop: "-10px" }}>
      <div class="row">
        <div class="d-flex justify-content-between">
          <div class="mb-4 col-5">
            <h3>Change Password</h3>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row gy-3 overflow-hidden">
          <div className="mb-1">
            <label htmlFor="password" className="form-label">
              Old Password
            </label>{" "}
            <span style={{ fontSize: "1.2em" }} className="text-danger">
              *
            </span>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className={`form-control ${
                  errors.old_passworddddd ? "is-invalid" : ""
                }`}
                id="password"
                placeholder="Old password"
                {...register("old_passworddddd")}
                onKeyDown={(e) => {
                  if (e.key === " ") e.preventDefault();
                }}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
              {errors.old_passworddddd && (
                <div className="invalid-feedback">
                  {errors.old_passworddddd.message}
                </div>
              )}
            </div>
          </div>
          <div className="mb-1">
            <label htmlFor="password" className="form-label">
              New Password{" "}
              <span style={{ fontSize: "1.2em" }} className="text-danger">
                *
              </span>
            </label>

            <div class="input-group">
              <input
                type={showPassword1 ? "text" : "password"}
                className={`form-control ${
                  errors.new_password ? "is-invalid" : ""
                }`}
                id="password"
                placeholder="New password"
                {...register("new_password")}
                onKeyDown={(e) => {
                  if (e.key === " ") e.preventDefault();
                }}
              />

              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setShowPassword1(!showPassword1)}
              >
                <FontAwesomeIcon icon={showPassword1 ? faEyeSlash : faEye} />
              </button>

              {errors.new_password && (
                <div className="invalid-feedback">
                  {errors.new_password.message}
                </div>
              )}
            </div>
          </div>

          <div className="mb-1">
            <label htmlFor="password" className="form-label">
              Confirm New Password{" "}
              <span style={{ fontSize: "1.2em" }} className="text-danger">
                *
              </span>
            </label>

            <div class="input-group">
              <input
                type={showPassword2 ? "text" : "password"}
                className={`form-control ${
                  errors.confirm_new_password ? "is-invalid" : ""
                }`}
                id="password"
                placeholder="Confirm new password"
                {...register("confirm_new_password")}
                onKeyDown={(e) => {
                  if (e.key === " ") e.preventDefault();
                }}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
              >
                <FontAwesomeIcon icon={showPassword2 ? faEyeSlash : faEye} />
              </button>
              {errors.confirm_new_password && (
                <div className="invalid-feedback">
                  {errors.confirm_new_password.message}
                </div>
              )}
            </div>
          </div>

          <div class="col-3">
            <div class="d-grid">
              <button
                class="btn btn-primary btn-lg"
                type="submit"
                disabled={loading}
                style={{ width: "200px", marginTop: "1rem" }}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  </>
                ) : (
                  "Change Password"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
