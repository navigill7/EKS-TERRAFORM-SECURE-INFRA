import Form from "./Form";
import { useSelector } from "react-redux";

const LoginPage = () => {
  const mode = useSelector((state) => state.mode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-grey-900 dark:via-grey-800 dark:to-grey-900">
      {/* Header */}
      <div className="w-full bg-white/80 dark:bg-grey-800/80 backdrop-blur-lg border-b border-grey-100 dark:border-grey-700 px-[6%] py-4 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
          Uni-Link
        </h1>
      </div>

      {/* Form Container */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-white dark:bg-grey-800 rounded-2xl shadow-2xl p-8 md:p-12 border border-grey-100 dark:border-grey-700 animate-scale-in">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-grey-800 dark:text-grey-100 mb-2">
                Welcome to UniLink
              </h2>
              <p className="text-grey-500 dark:text-grey-400">
                Connecting Minds, Building Futures
              </p>
            </div>
            <Form />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;