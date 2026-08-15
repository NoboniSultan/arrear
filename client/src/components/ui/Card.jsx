import styles from './Card.module.css';

export function Card({ className = '', padded = true, children, ...props }) {
  return (
    <div className={`${styles.card} ${padded ? styles.padded : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
