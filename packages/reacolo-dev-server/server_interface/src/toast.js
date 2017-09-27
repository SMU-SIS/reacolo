export default (parent, duration) => {
  // Create the toast dom.
  const dom = document.createElement('div');
  dom.classList.add('toast');
  parent.appendChild(dom);
  // Timeout id to cancel the toast disappearance.
  let toastTimeOut;
  // Return the toast function.
  return (message) => {
    // Clear any potential previous toast timeout.
    clearTimeout(toastTimeOut);
    // Set up the toast message.
    dom.innerHTML = message;
    // Show the toast.
    dom.classList.add('shown');
    // Make the toast disappear after duration.
    toastTimeOut = setTimeout(() => {
      dom.classList.remove('shown');
    }, duration);
  };
};
