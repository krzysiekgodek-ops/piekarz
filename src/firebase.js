import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDgwnYBDAK9hw4AwmUGl0kIRT7PbomI9Kc",
  authDomain: "masarski-pro-v2.firebaseapp.com",
  projectId: "masarski-pro-v2",
  storageBucket: "masarski-pro-v2.firebasestorage.app",
  messagingSenderId: "704198423857",
  appId: "1:704198423857:web:c008416788a064a65cec10"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const SUPER_ROOT = 'krzysiekgodek@gmail.com';
export const MYDEVIL_URL     = 'https://www.piekarz.ebra.pl/upload_image.php';
export const MYDEVIL_PDF_URL = 'https://www.piekarz.ebra.pl/upload_pdf.php';
