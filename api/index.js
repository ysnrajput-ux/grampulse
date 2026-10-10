import 'dotenv/config';
import {connect,migrate} from '../dist/server/db.js';
import {createApp} from '../dist/server/app.js';

let handler;
let initialization;
let database;

function sendUnavailable(response, code, message, requestId) {
  if (response.headersSent) return;
  const body = { success: false, error: { code, message, ...(requestId ? { requestId } : {}) } };
  if (typeof response.status === 'function' && typeof response.json === 'function') {
    response.status(503).json(body);
    return;
  }
  response.statusCode = 503;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export default async function api(request, response) {
  try {
    if (process.env.VERCEL && !process.env.DATABASE_URL) {
      sendUnavailable(response, 'DATABASE_NOT_CONFIGURED', 'Database is not configured. Set DATABASE_URL in Vercel Project Settings → Environment Variables, then redeploy.');
      return;
    }

    if (!initialization) {
      initialization = (async () => {
        database = await connect();
        await migrate(database);
        handler = createApp(database);
      })();
    }
    await initialization;
    await new Promise((resolve, reject) => {
      response.once('finish', resolve);
      response.once('close', resolve);
      try { handler(request, response); } catch (error) { reject(error); }
    });
  } catch (error) {
    initialization = undefined;
    if (database) {
      try { await database.close(); } catch (closeError) { console.error('GRAM-PULSE database cleanup failed', closeError instanceof Error ? closeError.message : 'unknown error'); }
      database = undefined;
      handler = undefined;
    }
    const detail = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ event: 'api_initialization_failed', detail }));
    sendUnavailable(response, 'SERVICE_INITIALIZATION_FAILED', 'GRAM-PULSE could not initialize its API. Check DATABASE_URL, database network access, and that migrations are applied. The Vercel Function log contains the internal error.', typeof response.getHeader === 'function' ? response.getHeader('X-Request-ID') : undefined);
  }
}
