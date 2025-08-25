import { PropsWithChildren } from 'react';

export default function RootHTML({ children }: PropsWithChildren) {
  return (
    <html lang="nl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/assets/images/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" href="/assets/images/favicon-16x16.png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body>{children}</body>
    </html>
  );
}


