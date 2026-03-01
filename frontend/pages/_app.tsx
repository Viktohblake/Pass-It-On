/**
 * Next.js custom App — Privy provider + global styles + page transitions.
 *
 * PrivyProvider is client-only (it validates the app ID and uses browser APIs),
 * so we skip it during SSR/SSG and mount it only on the client.
 */

import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import { AnimatePresence } from "framer-motion";
import { PrivyProvider } from "@privy-io/react-auth";
import { base } from "viem/chains";
import "../styles/globals.css";

function PrivyWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "missing-privy-app-id"}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#3b82f6",
        },
        loginMethods: ["email", "wallet"],
        defaultChain: base,
        supportedChains: [base],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <PrivyWrapper>
      <AnimatePresence mode="wait">
        <Component key={router.route} {...pageProps} />
      </AnimatePresence>
    </PrivyWrapper>
  );
}
