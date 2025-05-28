import { Html, Head, Main, NextScript } from "next/document";

export default async function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased mx-auto max-w-full h-full">
        <div className='mx-auto'>
          <Main />
        </div>
        <NextScript />
      </body>
    </Html>
  );
}
