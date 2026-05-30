import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        willChange: 'opacity, transform'
      }}
    >
      {children}
    </motion.div>
  );
}
