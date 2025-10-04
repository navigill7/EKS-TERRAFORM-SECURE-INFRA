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

  const register = async (values, onSubmitProps) => {
    const formData = new FormData();
    for (let value in values) {
      formData.append(value, values[value]);
    }
    formData.append("picturePath", values.picture.name);

    const savedUserResponse = await fetch(`http://localhost:3001/auth/register`, {
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
    const loggedInResponse = await fetch(`http://localhost:3001/auth/login`, {
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