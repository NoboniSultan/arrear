import styles from './Button.module.css';

export function Button({ variant = 'secondary', as: Component = 'button', className = '', ...props }) {
  return <Component className={`${styles.button} ${styles[variant]} ${className}`} {...props} />;
}
