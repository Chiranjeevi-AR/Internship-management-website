import { useEffect, useRef } from 'react';

/**
 * A custom hook that handles clicking outside of specified DOM element
 * @param {Function} handler - The function to call when a click outside occurs
 * @returns {React.MutableRefObject} - The ref to attach to the DOM element
 */
const useClickOutside = (handler) => {
  const ref = useRef();
  
  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      
      handler(event);
    };
    
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);
  
  return ref;
};

export default useClickOutside;
