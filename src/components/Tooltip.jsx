import React from 'react';

import { AnimatePresence } from 'framer-motion';

const Tooltip = React.memo(({ children, text }) => {
  const [show, setShow] = React.useState(false);
  return (
    <span
      className="neo-tooltip-container"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
      style={{outline:'none'}}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.span
            className="neo-tooltip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
});

export default Tooltip;
