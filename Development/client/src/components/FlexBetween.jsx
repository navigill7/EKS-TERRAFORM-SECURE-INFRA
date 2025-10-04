const FlexBetween = ({ children, className = "", gap = "", ...props }) => {
    return (
      <div 
        className={`flex justify-between items-center ${gap} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  };
  
  export default FlexBetween;