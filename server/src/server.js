import './config/env.js';
import app from './app.js';
import { createServer } from 'node:http';
import { attachRealtime } from './services/realtime.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in .env');
    }

    await connectDB();

    const httpServer = createServer(app);
    attachRealtime(httpServer, app);
    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `Port ${PORT} is already in use. Keep the existing backend running, or stop it with Ctrl+C in its terminal before starting this one.`,
        );
      } else {
        console.error(`HTTP server could not start (${error.code || 'unknown error'}).`);
      }
      process.exit(1);
    });
    httpServer.listen(PORT, process.env.HOST, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // Driver messages can contain connection details. Log only known-safe summaries.
    const serverErrors = [...(error.reason?.servers?.values() ?? [])];
    const tlsAlert80 = serverErrors.some((server) =>
      /alert.*80|alert internal error/i.test(server.error?.message ?? ''),
    );
    console.error('Database startup failed.');
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing; configure server/.env.');
    } else if (error.syscall === 'querySrv' || error.syscall === 'queryTxt') {
      console.error(
        'Atlas DNS lookup failed. Check your DNS resolver or configure MONGO_DNS_SERVERS in server/.env.',
      );
    } else if (
      serverErrors.some((server) =>
        [
          'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
          'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
          'SELF_SIGNED_CERT_IN_CHAIN',
        ].includes(server.error?.cause?.code),
      )
    ) {
      console.error(
        'TLS certificate chain verification failed. Run npm run dev or npm start to use the system trusted CA store.',
      );
    } else if (tlsAlert80) {
      console.error(
        "TLS alert 80: check the Atlas project's IP access list for this machine's public egress IP, cluster availability, and any VPN/firewall TLS inspection. TLS verification remains enabled.",
      );
    } else {
      console.error(
        'Check the MongoDB URI, Atlas access settings, and network connectivity.',
      );
    }
    process.exit(1);
  }
}

startServer();
