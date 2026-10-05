import Document, { Html, Head, Main, NextScript } from 'next/document';
import { randomBytes } from 'node:crypto';

export default class ShogiDocument extends Document {
  static async getInitialProps(context) {
    const nonce = randomBytes(16).toString('base64');
    const development = process.env.NODE_ENV !== 'production';
    const policy = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      `connect-src 'self'${development ? ' ws: wss:' : ''}`,
      "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
    ].join('; ');
    context.res?.setHeader('Content-Security-Policy', policy);
    context.res?.setHeader('X-Content-Type-Options', 'nosniff');
    context.res?.setHeader('Referrer-Policy', 'same-origin');
    return { ...await Document.getInitialProps(context), nonce };
  }

  render() {
    return <Html lang="en"><Head nonce={this.props.nonce} /><body className="antialiased"><Main /><NextScript nonce={this.props.nonce} /></body></Html>;
  }
}
