import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Block MetaMask inpage.js auto-connect errors before React loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.addEventListener('unhandledrejection', function(e) {
                  var msg = (e.reason && e.reason.message) || String(e.reason || '');
                  if (msg.indexOf('MetaMask') !== -1 || msg.indexOf('inpage') !== -1) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                  }
                });
                window.addEventListener('error', function(e) {
                  var msg = (e.message || '') + (e.filename || '');
                  if (msg.indexOf('MetaMask') !== -1 || msg.indexOf('inpage') !== -1) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return true;
                  }
                });
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
