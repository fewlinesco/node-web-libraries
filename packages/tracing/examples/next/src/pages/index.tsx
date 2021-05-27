import Head from "next/head";

import styles from "./Home.module.css";

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>@fwl/tracing Next.JS example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>@fwl/tracing Next.JS example</h1>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Traces &rarr;</h3>

            <p>
              Go to{" "}
              <a target="_blank" href="http://localhost:29797/">
                Jaeger
              </a>
            </p>
          </div>

          <div className={styles.card}>
            <h3>Test &rarr;</h3>
            <p>
              Go to the <a href="/api/hello">Hello example</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
export default Home;
