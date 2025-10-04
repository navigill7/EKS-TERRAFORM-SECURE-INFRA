import { useState } from "react";
import { Edit2 } from "lucide-react";
import { Formik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setLogin } from "state";
import Dropzone from "react-dropzone";
import FlexBetween from "components/FlexBetween";
import { API_ENDPOINTS } from "config/api";

const registerSchema = yup.object().shape({
  firstName: yup.string().required("required"),
  lastName: yup.string().required("required"),
  email: yup.string().email("invalid email").required("required"),
  password: yup.string().required("required"),
  location: yup.string().required("required"),
  Year: yup.string().required("required"),
  picture: yup.string().required("required"),
});

const loginSchema = yup.object().shape({
  email: yup.string().email("invalid email").required("required"),
  password: yup.string().required("required"),
});

const initialValuesRegister = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  location: "",
  Year: "",
  picture: "",
};

const initialValuesLogin = {
  email: "",
  password: "",
};

const Form = () => {
  const [pageType, setPageType] = useState("login");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLogin = pageType === "login";
  const isRegister = pageType === "register";

  const handleDiscordLogin = () => {
    window.location.href = "http://localhost:3001/auth/discord";
  };

  const register = async (values, onSubmitProps) => {
    const formData = new FormData();
    for (let value in values) {
      formData.append(value, values[value]);
    }
    formData.append("picturePath", values.picture.name);

    const savedUserResponse = await fetch(API_ENDPOINTS.REGISTER, {
      method: "POST",
      body: formData,
    });
    if (savedUserResponse.ok) {
      const savedUser = await savedUserResponse.json();
      onSubmitProps.resetForm();
      if (savedUser) {
        setPageType("login");
      }
    } else {
      console.error("Failed to register:", savedUserResponse.statusText);
    }
  };

  const login = async (values, onSubmitProps) => {
    const loggedInResponse = await fetch(API_ENDPOINTS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (loggedInResponse.ok) {
      const loggedIn = await loggedInResponse.json();
      onSubmitProps.resetForm();
      if (loggedIn) {
        dispatch(
          setLogin({
            user: loggedIn.user,
            token: loggedIn.token,
          })
        );
        navigate("/home");
      }
    } else {
      console.error("Failed to login:", loggedInResponse.statusText);
    }
  };

  const handleFormSubmit = async (values, onSubmitProps) => {
    if (isLogin) await login(values, onSubmitProps);
    if (isRegister) await register(values, onSubmitProps);
  };

 

  return (
    <Formik
      onSubmit={handleFormSubmit}
      initialValues={isLogin ? initialValuesLogin : initialValuesRegister}
      validationSchema={isLogin ? loginSchema : registerSchema}
    >
      {({
        values,
        errors,
        touched,
        handleBlur,
        handleChange,
        handleSubmit,
        setFieldValue,
        resetForm,
      }) => (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isRegister && (
              <>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-2">
                    First Name
                  </label>
                  <input
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.firstName}
                    name="firstName"
                    className="w-full px-4 py-3 rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800 text-grey-700 dark:text-grey-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 outline-none"
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-2">
                    Last Name
                  </label>
                  <input
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.lastName}
                    name="lastName"
                    className="w-full px-4 py-3 rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800 text-grey-700 dark:text-grey-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 outline-none"
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-2">
                    Location
                  </label>
                  <input
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.location}
                    name="location"
                    className="w-full px-4 py-3 rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800 text-grey-700 dark:text-grey-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 outline-none"
                  />
                  {touched.location && errors.location && (
                    <p className="mt-1 text-sm text-red-500">{errors.location}</p>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-2">
                    Year
                  </label>
                  <input
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.Year}
                    name="Year"
                    className="w-full px-4 py-3 rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800 text-grey-700 dark:text-grey-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 outline-none"
                  />
                  {touched.Year && errors.Year && (
                    <p className="mt-1 text-sm text-red-500">{errors.Year}</p>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-2">
                    Profile Picture
                  </label>
                  <Dropzone
                    acceptedFiles=".jpg,.jpeg,.png"
                    multiple={false}
                    onDrop={(acceptedFiles) =>
                      setFieldValue("picture", acceptedFiles[0])
                    }
                  >
                    {({ getRootProps, getInputProps }) => (
                      <div
                        {...getRootProps()}
                        className="border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-lg p-6 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all duration-200"
                      >
                        <input {...getInputProps()} />
                        {!values.picture ? (
                          <p className="text-center text-grey-500 dark:text-grey-400">
                            Click or drag to add picture
                          </p>
                        ) : (
                          <FlexBetween>
                            <p className="text-grey-700 dark:text-grey-100">{values.picture.name}</p>
                            <Edit2 className="w-5 h-5 text-primary-500" />
                          </FlexBetween>
                        )}
                      </div>
                    )}
                  </Dropzone>
                  {touched.picture && errors.picture && (
                    <p className="mt-1 text-sm text-red-500">{errors.picture}</p>
                  )}
                </div>
              </>
            )}

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-2">
                Email
              </label>
              <input
                type="email"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.email}
                name="email"
                className="w-full px-4 py-3 rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800 text-grey-700 dark:text-grey-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 outline-none"
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-2">
                Password
              </label>
              <input
                type="password"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.password}
                name="password"
                className="w-full px-4 py-3 rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800 text-grey-700 dark:text-grey-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 outline-none"
              />
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {isLogin ? "LOGIN" : "REGISTER"}
          </button>

          {/* Divider - Only show on login page */}
          {isLogin && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-grey-200 dark:border-grey-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-grey-800 text-grey-500 dark:text-grey-400">
                  Or continue with
                </span>
              </div>
            </div>
          )}

          {/* Discord Login Button - Only show on login page */}
          {isLogin && (
            <button
              type="button"
              onClick={handleDiscordLogin}
              className="w-full py-3 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Continue with Discord</span>
            </button>
          )}

          <p
            onClick={() => {
              setPageType(isLogin ? "register" : "login");
              resetForm();
            }}
            className="text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 cursor-pointer transition-colors duration-200"
          >
            {isLogin
              ? "Don't have an account? Sign Up here."
              : "Already have an account? Login here."}
          </p>
        </form>
      )}
    </Formik>
  );
};

export default Form;