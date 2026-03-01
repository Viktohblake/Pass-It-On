/**
 * Next.js custom App — imports global styles and provides
 * AnimatePresence for page transitions.
 */

import type { AppProps } from "next/app";
import { AnimatePresence } from "framer-motion";
import "../styles/globals.css";

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <AnimatePresence mode="wait">
      <Component key={router.route} {...pageProps} />
    </AnimatePresence>
  );
}
