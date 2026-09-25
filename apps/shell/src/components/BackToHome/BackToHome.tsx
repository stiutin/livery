import { Link, useLocation } from "react-router";
import styles from "./BackToHome.module.css";

export default function BackToHome() {
  const { search } = useLocation();

  return (
    <div className={styles.backToHome}>
      <Link to={{ pathname: "/", search }}>Back to Home</Link>
    </div>
  );
}
