import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased mx-auto w-fit h-fit">
        <div className='mx-auto'>
          <Main />
        </div>
        <NextScript />
      </body>
    </Html>
  );
}
