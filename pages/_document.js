import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased mx-auto w-full h-fit">
        <div className='mx-auto p-3 flex flex-wrap w-full'>
          <article className='mx-auto w-full col-span-1'>
            <Main />
          </article>
        </div>
        <NextScript />
      </body>
    </Html>
  );
}
