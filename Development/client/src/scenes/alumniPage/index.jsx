import AlumniNavbar from "scenes/alumniPage/alumniNavbar";

const AlumniPage = () => {
  return (
    <div className="min-h-screen bg-grey-50 dark:bg-grey-900">
      <AlumniNavbar />
      <div className="px-[6%] py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-grey-800 dark:text-grey-100 mb-4">
            Alumni Network
          </h2>
          <p className="text-grey-600 dark:text-grey-300">
            Connect with alumni based on specialization
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlumniPage;