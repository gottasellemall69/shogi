import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased mx-auto w-fit h-full">
        <div className='mx-auto aspect-1'>
          <Main />
        </div>
        <NextScript />
      </body>
    </Html>
  );
}
