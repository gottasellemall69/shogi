import Layout from "@/components/layout";
import '@/styles/shogiBoard.css';
import '@/styles/ShogiBoard2.css';
import '@/styles/globals.css';

export default function App( { Component, pageProps } ) {
  return (
    <Layout>
      <Component { ...pageProps } />
    </Layout>
  );
}
