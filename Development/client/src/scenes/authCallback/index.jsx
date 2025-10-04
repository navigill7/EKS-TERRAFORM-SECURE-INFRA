import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setLogin } from "state";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get("token");
    const userString = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      console.error("Authentication error:", error);
      alert("Authentication failed. Please try again.");
      navigate("/");
      return;
    }

    if (token && userString) {
      try {
        const user = JSON.parse(decodeURIComponent(userString));
        
        console.log("Discord login successful:", user);
        
        // Save to Redux
        dispatch(setLogin({ user, token }));
        
        // Redirect to home
        navigate("/home");
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/");
      }
    } else {
      console.log("No token or user data found, redirecting to login");
      navigate("/");
    }
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-grey-50 dark:bg-grey-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-grey-700 dark:text-grey-200 text-lg">Completing authentication...</p>
        <p className="text-grey-500 dark:text-grey-400 text-sm mt-2">Please wait while we sign you in</p>
      </div>
    </div>
  );
};

export default AuthCallback;