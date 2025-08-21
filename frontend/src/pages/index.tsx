import Head from 'next/head';
import UploadArea from '@/components/UploadArea';
import styles from '../styles/Home.module.scss';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Bank Statement Converter</title>
        <meta name="description" content="Convert PDF bank statements to CSV and XLSX formats" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Bank Statement PDF Converter
        </h1>

        <p className={styles.description}>
          Upload your PDF bank statement and convert it to CSV or XLSX format
        </p>

        <UploadArea />
      </main>
    </div>
  );
}