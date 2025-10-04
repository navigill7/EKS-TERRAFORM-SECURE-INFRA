const WidgetWrapper = ({ children, className = "" }) => {
    return (
      <div className={`
        p-6 pb-3
        bg-white dark:bg-grey-800
        rounded-xl
        shadow-sm hover:shadow-md
        transition-all duration-300
        border border-grey-100 dark:border-grey-700
        ${className}
      `}>
        {children}
      </div>
    );
  };
  
  export default WidgetWrapper;