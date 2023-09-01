import styles from "../styles/index.module.scss";
import Head from "next/head";

export default function Index() {
  return (
    <div className={styles.page}>
      <Head>
        <title>kabodha</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
    </div>
  );
}
