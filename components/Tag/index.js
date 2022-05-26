import styles from "./index.module.scss";

export default function Tag({type, active, onClick, children}) {

  return (
    <div
      className={`
      ${styles.container}
      ${type === 'blue' ? styles.blue : styles.green}
      ${active && type === 'blue' ? styles.blueActive : '' }
      ${active && type === 'green' ? styles.greenActive : '' }
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
