import styles from './Toggle.module.css';

export function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`${styles.toggle} ${checked ? styles.on : ''}`}
      onClick={() => onChange && onChange(!checked)}
    >
      <span className={styles.knob} />
    </button>
  );
}
