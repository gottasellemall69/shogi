import Layout from "@/components/layout";
import '@/styles/ShogiBoard.css';
import '@/styles/globals.css';

export default function App( { Component, pageProps } ) {
  return (
    <Layout>
      <Component { ...pageProps } />
    </Layout>
  );
}
