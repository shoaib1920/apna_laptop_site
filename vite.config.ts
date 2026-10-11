import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import {handleChat} from './api/chat';

// Serves the /api/chat Vercel function during `npm run dev`.
const devChatApi = (env: Record<string, string>): Plugin => ({
  name: 'dev-chat-api',
  configureServer(server) {
    server.middlewares.use('/api/chat', (req, res) => {
      let raw = '';
      req.on('data', (chunk) => (raw += chunk));
      req.on('end', async () => {
        let body: unknown = {};
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          // fall through with an empty body; handleChat rejects it
        }
        const result = await handleChat(body, env.GEMINI_API_KEY, env.GEMINI_MODEL);
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.body));
      });
    });
  },
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), devChatApi(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
