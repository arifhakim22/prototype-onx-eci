import express from 'express';
import cors from 'cors';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for development
app.use(cors());
app.use(express.json());

// Configure connection pool to local PostgreSQL database
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'meng',
  database: 'postgres',
  // Local connections normally don't need a password with 'trust' authentication
});

// Endpoint to check database and server status
app.get('/api/status', async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT version(), NOW()');
      res.json({
        status: 'online',
        database: 'connected',
        postgresVersion: result.rows[0].version,
        serverTime: result.rows[0].now,
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Database connection error:', err);
    res.status(500).json({
      status: 'online',
      database: 'disconnected',
      error: err.message,
    });
  }
});

// Endpoint to fetch participants list
app.get('/api/get_list_peserta', async (_req, res) => {
  try {
    const result = await pool.query(`
      select peserta_id,id_user, email, nama, status_test, status_download_pdf
      from m_paket_project_peserta_36 a 
      join m_users b on a.id_user = b.id
      where type_user = 'user_real' order by status_download_pdf
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to remove template editor controls and normalize styles
const cleanHtml = (html: string) => {
  if (!html) return '';
  const pattern = /<div style="position:\s*absolute;\s*top:\s*0px;\s*right:\s*0px;\s*display:\s*flex;\s*gap:\s*4px;\s*z-index:\s*1000;">\s*<div[^>]*>✏️\s*Edit<\/div>\s*<div[^>]*>🗑️\s*Remove Header<\/div>\s*<\/div>/gi;
  let cleaned = html.replace(pattern, '');
  // Replace class bg-[#EBEBEB] with bg-[#1C63C2] case-insensitively
  cleaned = cleaned.replace(/bg-\[#EBEBEB\]/gi, 'bg-[#1C63C2]');
  return cleaned;
};

// Helper function to generate PDF documents using Puppeteer-core with local Chrome
async function generatePDFs(nama: string, reportItems: any[]): Promise<{ wawasanKebangsaan: string | null; corporateValue: string | null }> {
  const dirPath = path.join(process.cwd(), 'public', 'pdf', 'wawasan_kebangsaan', nama);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const pdfPaths = {
    wawasanKebangsaan: `/pdf/wawasan_kebangsaan/${encodeURIComponent(nama)}/Tes_Wawasan_Kebangsaan_${encodeURIComponent(nama)}.pdf`,
    corporateValue: `/pdf/wawasan_kebangsaan/${encodeURIComponent(nama)}/Tes_Corporate_Value_1.0${encodeURIComponent(nama)}.pdf`
  };

  const filePaths = {
    wawasanKebangsaan: path.join(dirPath, `Tes_Wawasan_Kebangsaan_${nama}.pdf`),
    corporateValue: path.join(dirPath, `Tes_Corporate_Value_1.0${nama}.pdf`)
  };

  // If both PDFs already exist, return paths immediately
  if (fs.existsSync(filePaths.wawasanKebangsaan) && fs.existsSync(filePaths.corporateValue)) {
    return pdfPaths;
  }

  console.log(`[PDF Generator] Generating PDFs for user: ${nama}...`);

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    for (const item of reportItems) {
      const isWawasan = item.namafile === 'Tes Wawasan Kebangsaan' || item.namaFile === 'Tes Wawasan Kebangsaan';
      const isCorp = item.namafile === 'Tes Corporate Value 1.0' || item.namaFile === 'Tes Corporate Value 1.0';

      if (!isWawasan && !isCorp) continue;

      const targetPath = isWawasan ? filePaths.wawasanKebangsaan : filePaths.corporateValue;

      // Skip generating if file exists already
      if (fs.existsSync(targetPath)) continue;

      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body {
                font-family: system-ui, sans-serif;
                background-color: white;
                color: black;
                padding: 0;
                margin: 0;
                font-size: 14px;
              }
              /* Table border rendering overrides */
              table[border="1"], table[border="1"] th, table[border="1"] td {
                border: 1px solid #d1d5db !important;
              }
              table[border="1"] {
                border-collapse: collapse !important;
              }
              table th, table td {
                padding: 8px 12px;
              }
            </style>
          </head>
          <body class="bg-white text-slate-800 antialiased">
            ${cleanHtml(item.html)}
          </body>
        </html>
      `;

      await page.setContent(fullHtml, { waitUntil: 'load' });
      await new Promise(resolve => setTimeout(resolve, 500));
      await page.pdf({
        path: targetPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
      });
    }
  } catch (error) {
    console.error('Error generating PDF via Puppeteer-core:', error);
  } finally {
    await browser.close();
  }

  return pdfPaths;
}

// Endpoint to fetch personal report by id_user
app.get('/api/get_reporting', async (req, res) => {
  const id_user = req.query.id_user;
  if (!id_user) {
    return res.status(400).json({ error: 'Missing id_user query parameter' });
  }

  try {
    const result = await pool.query(
      `select personal_report, nama 
       from m_paket_project_peserta_36 a 
       join m_users b on a.id_user = b.id 
       where id_user = $1`,
      [id_user]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const nama = result.rows[0].nama;
    let report = result.rows[0].personal_report;
    if (typeof report === 'string') {
      try {
        report = JSON.parse(report);
      } catch (e) {
        console.error('Failed to parse personal_report JSON:', e);
      }
    }

    let pdfPaths = null;
    if (Array.isArray(report) && report.length > 0) {
      pdfPaths = await generatePDFs(nama, report);
    }

    res.json({
      reports: report,
      pdfPaths: pdfPaths
    });
  } catch (err: any) {
    console.error('Error fetching personal report:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to update download status from null to 1 based on peserta_id
app.post('/api/update_download_status', async (req, res) => {
  const peserta_id = req.query.peserta_id || (req.body && req.body.peserta_id);
  if (!peserta_id) {
    return res.status(400).json({ error: 'Missing peserta_id query or body parameter' });
  }

  try {
    // 1. Fetch report details to generate PDF first
    const reportResult = await pool.query(
      `select personal_report, nama 
       from m_paket_project_peserta_36 a 
       join m_users b on a.id_user = b.id 
       where peserta_id = $1`,
      [peserta_id]
    );

    if (reportResult.rows.length > 0) {
      const nama = reportResult.rows[0].nama;
      let report = reportResult.rows[0].personal_report;
      if (typeof report === 'string') {
        try {
          report = JSON.parse(report);
        } catch (e) {
          console.error('Failed to parse personal_report JSON:', e);
        }
      }
      if (Array.isArray(report) && report.length > 0) {
        await generatePDFs(nama, report);
      }
    }

    // 2. Update status in database
    const result = await pool.query(
      'UPDATE m_paket_project_peserta_36 SET status_download_pdf = 1 WHERE peserta_id = $1',
      [peserta_id]
    );
    res.json({ success: true, message: 'status_download_pdf updated to 1', rowCount: result.rowCount });
  } catch (err: any) {
    console.error('Error updating download status:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start listening
app.listen(PORT, () => {
  console.log(`[Backend Server] Running on http://localhost:${PORT}`);
});
