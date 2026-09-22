import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

function aistudioSheetsProxyPlugin(): Plugin {
  return {
    name: 'vite-plugin-sheets-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/sheets-info')) {
          const urlObj = new URL(req.url, 'http://localhost:3000');
          const spreadsheetId = urlObj.searchParams.get('id');
          if (!spreadsheetId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing spreadsheet id' }));
            return;
          }

          try {
            const googleUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
            const gRes = await fetch(googleUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            });
            if (!gRes.ok) {
              res.statusCode = gRes.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Could not fetch public sheet HTML' }));
              return;
            }
            const text = await gRes.text();

            const titleMatch = text.match(/<title>([^<]+)<\/title>/);
            const title = titleMatch
              ? titleMatch[1].replace(/ - Google (Drive|Docs|Sheets)$/i, '').trim()
              : 'Google Spreadsheet';

            const sheets: { sheetId: number; title: string; index: number }[] = [];
            const regex =
              /items\.push\(\{\s*name:\s*"([^"]+)",\s*pageUrl:\s*"[^"]*",\s*gid:\s*"([0-9]+)"/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
              sheets.push({
                sheetId: parseInt(match[2], 10),
                title: match[1],
                index: sheets.length,
              });
            }

            if (sheets.length === 0) {
              const liRegex =
                /<li id="sheet-button-([0-9]+)"[^>]*><a[^>]*>([^<]+)<\/a>/g;
              while ((match = liRegex.exec(text)) !== null) {
                sheets.push({
                  sheetId: parseInt(match[1], 10),
                  title: match[2].trim(),
                  index: sheets.length,
                });
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ title, sheets }));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Server proxy error' }));
            return;
          }
        }

        if (req.url && (req.url.startsWith('/api/download-offline-html') || req.url.startsWith('/dashboard-offline.html'))) {
          const offlinePath = path.resolve(__dirname, 'dashboard-offline.html');
          if (fs.existsSync(offlinePath)) {
            const isDownload = req.url.startsWith('/api/download-offline-html') || req.url.includes('download');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            if (isDownload) {
              res.setHeader('Content-Disposition', 'attachment; filename="google-sheets-dashboard.html"');
            }
            res.end(fs.readFileSync(offlinePath));
            return;
          }
        }

        if (req.url && req.url.startsWith('/api/sheets-csv')) {
          const urlObj = new URL(req.url, 'http://localhost:3000');
          const spreadsheetId = urlObj.searchParams.get('id');
          const gid = urlObj.searchParams.get('gid');
          const sheet = urlObj.searchParams.get('sheet');
          if (!spreadsheetId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing spreadsheet id' }));
            return;
          }

          const urlsToTry: string[] = [];
          if (gid !== null && gid !== undefined && gid !== '') {
            urlsToTry.push(
              `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
            );
            urlsToTry.push(
              `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
            );
          }
          if (sheet && !sheet.startsWith('Sheet (gid:')) {
            urlsToTry.push(
              `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`
            );
          }
          urlsToTry.push(
            `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`
          );
          urlsToTry.push(
            `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`
          );

          for (const targetUrl of urlsToTry) {
            try {
              const gRes = await fetch(targetUrl, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
              });
              if (!gRes.ok) continue;
              const text = await gRes.text();
              if (
                !text ||
                text.includes('<!DOCTYPE html>') ||
                text.includes('<html') ||
                text.includes('accounts.google.com')
              ) {
                continue;
              }
              res.setHeader('Content-Type', 'text/csv; charset=utf-8');
              res.end(text);
              return;
            } catch {
              // Continue to next attempt
            }
          }

          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Could not fetch public CSV' }));
          return;
        }
        next();
      });
    },
  };
}

function copyToOfflineHtmlPlugin(): Plugin {
  return {
    name: 'copy-to-offline-html',
    closeBundle() {
      try {
        const distIndex = path.resolve(__dirname, 'dist', 'index.html');
        const targetRoot = path.resolve(__dirname, 'dashboard-offline.html');
        const targetPublic = path.resolve(__dirname, 'public', 'dashboard-offline.html');
        if (fs.existsSync(distIndex)) {
          fs.copyFileSync(distIndex, targetRoot);
          fs.copyFileSync(distIndex, targetPublic);
        }
      } catch (err) {
        console.error('Failed to copy to dashboard-offline.html', err);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      viteSingleFile(),
      copyToOfflineHtmlPlugin(),
      aistudioMediaPlugin(),
      aistudioSheetsProxyPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
