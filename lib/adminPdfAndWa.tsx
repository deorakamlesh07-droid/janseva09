// ==============================================================================
// जनसेवा वार्ड 09 - PDF एक्सपोर्ट और WhatsApp ब्रॉडकास्ट इंजन
// पार्षद: संजय बिश्नोई (जाणी) (Sanjay Bishnoi)
// ==============================================================================

import React, { useState } from 'react'

export interface ComplaintForPdf {
  id: number
  code: string
  name: string
  phone: string
  email?: string | null
  mohalla: string
  category: string
  detail: string
  status: string
  created_at: string
  admin_note?: string | null
  photo_url?: string | null
  photo_urls?: string[] | null
  after_photo_url?: string | null
}

export interface CitizenForPdf {
  name: string
  phone: string
  email?: string | null
  mohalla?: string | null
  complaintCount?: number
  bloodGroup?: string | null
  tags?: string[]
  lastActive?: string
}

export interface WhatsAppRecipient {
  name: string
  phone: string
  mohalla?: string
  code?: string
  detail?: string
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. WhatsApp Helper
// ──────────────────────────────────────────────────────────────────────────────
export function buildWhatsAppUrl(phone: string, text: string, useWeb: boolean = true): string {
  const clean = phone.replace(/\D/g, '')
  const formattedPhone = clean.length === 10 ? `91${clean}` : clean
  const encoded = encodeURIComponent(text)
  if (useWeb) {
    return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`
  }
  return `https://wa.me/${formattedPhone}?text=${encoded}`
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. Direct PDF / Print Generator for Complaints List
// ──────────────────────────────────────────────────────────────────────────────
export function exportComplaintsPdf(complaints: ComplaintForPdf[], filterLabel: string = 'सब') {
  const printWindow = window.open('', '_blank', 'width=1200,height=800')
  if (!printWindow) {
    alert('कृपया ब्राउज़र में पॉप-अप (Pop-up) की अनुमति दें ताकि PDF रिपोर्ट खुल सके।')
    return
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  const rowsHtml = complaints.map((c, idx) => {
    const d = new Date(c.created_at)
    const cDate = d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    const emailVal = c.email || (c.detail && c.detail.match(/(?:ईमेल|email)\s*:\s*([^\s\n\r]+@[^\s\n\r]+)/i)?.[1]) || '—'

    let statusColor = '#1E3A8A'
    let statusBg = '#EFF6FF'
    if (c.status === 'काम पूरा' || c.status === 'पूरा') {
      statusColor = '#166534'
      statusBg = '#DCFCE7'
    } else if (c.status === 'काम चालू') {
      statusColor = '#9A3412'
      statusBg = '#FFEDD5'
    } else if (c.status === 'स्वीकृत') {
      statusColor = '#6B21A8'
      statusBg = '#F3E8FF'
    }

    return `
      <tr>
        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
        <td style="font-weight: 800; color: #1F2937; white-space: nowrap;">${c.code}</td>
        <td style="white-space: nowrap; font-size: 11px;">${cDate}</td>
        <td style="font-weight: 700; color: #111827;">${c.name}</td>
        <td style="font-weight: 700; color: #065F46; white-space: nowrap; font-size: 13px;">${c.phone}</td>
        <td style="font-size: 11.5px; color: #1E40AF; word-break: break-all;">${emailVal}</td>
        <td>${c.mohalla || '—'}</td>
        <td style="font-weight: 600; color: #D95C00;">${c.category}</td>
        <td style="font-size: 11.5px; line-height: 1.4; max-width: 280px;">${escapeHtml(c.detail)}</td>
        <td>
          <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; color: ${statusColor}; background: ${statusBg}; border: 1px solid ${statusColor}33;">
            ${c.status}
          </span>
        </td>
        <td style="font-size: 11px; color: #4B5563;">${c.admin_note ? escapeHtml(c.admin_note) : '—'}</td>
      </tr>
    `
  }).join('')

  const docHtml = `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8" />
  <title>वार्ड 09 शिकायत रिपोर्ट - ${dateStr}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Anek Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #1F2937;
      background: #F9FAFB;
      font-size: 12.5px;
    }
    .no-print-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #111827;
      color: #fff;
      padding: 12px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn {
      background: #D95C00;
      color: #fff;
      border: 0;
      padding: 9px 18px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { background: #b84e00; }
    .btn-secondary { background: #374151; }
    .btn-secondary:hover { background: #4B5563; }
    .page-container {
      background: #fff;
      padding: 24px;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 2.5px solid #D95C00;
      padding-bottom: 14px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .logo-title h1 {
      margin: 0 0 4px;
      font-size: 22px;
      color: #D95C00;
      font-weight: 800;
    }
    .logo-title p {
      margin: 2px 0 0;
      color: #4B5563;
      font-size: 13px;
      font-weight: 600;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #4B5563;
      line-height: 1.5;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background: #F3F4F6;
      color: #111827;
      border: 1px solid #D1D5DB;
      padding: 8px 6px;
      font-size: 11.5px;
      font-weight: 700;
      text-align: left;
    }
    td {
      border: 1px solid #E5E7EB;
      padding: 8px 6px;
      vertical-align: top;
    }
    tr:nth-child(even) { background: #F9FAFB; }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px dashed #D1D5DB;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6B7280;
    }
    @media print {
      body { background: #fff; padding: 0; font-size: 11px; }
      .no-print-bar { display: none !important; }
      .page-container { box-shadow: none; padding: 0; }
      @page { size: A4 landscape; margin: 8mm; }
      tr { page-break-inside: avoid; }
      th { background: #E5E7EB !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong style="font-size: 15px;">जनसेवा वार्ड 09 — आधिकारिक PDF एक्सपोर्ट</strong>
      <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">कुल ${complaints.length} शिकायतें (फ़िल्टर: ${filterLabel}) · सभी फ़ोन नंबर व ईमेल पूर्णतः दृश्यमान</div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn" onclick="window.print()">
        🖨️ PDF डाउनलोड / प्रिंट करें (Save as PDF)
      </button>
      <button class="btn btn-secondary" onclick="window.close()">✕ बंद करें</button>
    </div>
  </div>

  <div class="page-container">
    <div class="header">
      <div class="logo-title">
        <h1>जनसेवा वार्ड 09 — नागरिक शिकायत रिपोर्ट</h1>
        <p>पार्षद: <strong>श्री संजय बिश्नोई (जाणी)</strong> (वार्ड संख्या 08, जोधपुर) | नगर निगम</p>
      </div>
      <div class="meta-box">
        <div><strong>रिपोर्ट दिनांक:</strong> ${dateStr}</div>
        <div><strong>समय:</strong> ${timeStr}</div>
        <div><strong>स्थिति फ़िल्टर:</strong> ${filterLabel} (${complaints.length} रिकॉर्ड)</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 32px; text-align: center;">क्र.</th>
          <th>शिकायत कोड</th>
          <th>दिनांक</th>
          <th>नागरिक का नाम</th>
          <th>मोबाइल नंबर</th>
          <th>ईमेल पता</th>
          <th>मोहल्ला / क्षेत्र</th>
          <th>श्रेणी</th>
          <th>समस्या का विवरण</th>
          <th>वर्तमान स्थिति</th>
          <th>संचालक टिप्पणी / दिनांक</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="footer">
      <div>पोर्टल: <strong>जनसेवा 09 (janseva08.vercel.app)</strong> · वार्ड 09 नागरिक सेवा केंद्र, जोधपुर</div>
      <div>यह आधिकारिक कंप्यूटरीकृत रिपोर्ट है। सभी मोबाइल नंबर और विवरण पूर्ण रूप से प्रमाणित हैं।</div>
    </div>
  </div>

  <script>
    // Prompt user to print/save as PDF automatically
    setTimeout(function() {
      window.print();
    }, 450);
  </script>
</body>
</html>
  `

  printWindow.document.open()
  printWindow.document.write(docHtml)
  printWindow.document.close()
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Single Complaint PDF Slip (एकल शिकायत रसीद / पर्ची)
// ──────────────────────────────────────────────────────────────────────────────
export function exportSingleComplaintPdf(c: ComplaintForPdf) {
  const printWindow = window.open('', '_blank', 'width=900,height=800')
  if (!printWindow) {
    alert('कृपया ब्राउज़र में पॉप-अप (Pop-up) की अनुमति दें।')
    return
  }

  const cDate = new Date(c.created_at).toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const emailVal = c.email || (c.detail && c.detail.match(/(?:ईमेल|email)\s*:\s*([^\s\n\r]+@[^\s\n\r]+)/i)?.[1]) || 'दर्ज नहीं'

  let statusBg = '#EFF6FF'
  let statusColor = '#1E3A8A'
  if (c.status === 'काम पूरा' || c.status === 'पूरा') {
    statusBg = '#DCFCE7'; statusColor = '#166534'
  } else if (c.status === 'काम चालू') {
    statusBg = '#FFEDD5'; statusColor = '#9A3412'
  } else if (c.status === 'स्वीकृत') {
    statusBg = '#F3E8FF'; statusColor = '#6B21A8'
  }

  const docHtml = `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8" />
  <title>शिकायत रसीद_${c.code}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Anek Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0; padding: 20px; background: #F3F4F6; color: #1F2937;
    }
    .no-print-bar {
      display: flex; justify-content: space-between; align-items: center;
      background: #111827; color: #fff; padding: 12px 18px; border-radius: 8px; margin-bottom: 20px;
    }
    .btn {
      background: #D95C00; color: #fff; border: 0; padding: 9px 18px; border-radius: 6px; font-weight: 700; cursor: pointer;
    }
    .card {
      background: #fff; max-width: 780px; margin: 0 auto; padding: 32px; border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1.5px solid #E5E7EB;
    }
    .header {
      border-bottom: 2.5px solid #D95C00; padding-bottom: 16px; margin-bottom: 20px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .title h2 { margin: 0; font-size: 22px; color: #D95C00; }
    .title p { margin: 4px 0 0; color: #4B5563; font-size: 13px; font-weight: 600; }
    .code-badge {
      background: #FFF3E8; border: 2px solid #D95C00; color: #D95C00; padding: 8px 18px;
      border-radius: 10px; font-size: 24px; font-weight: 900; letter-spacing: 1px;
    }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .box { background: #F9FAFB; padding: 12px 16px; border-radius: 8px; border: 1px solid #E5E7EB; }
    .box-title { font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 700; margin-bottom: 4px; }
    .box-val { font-size: 15px; font-weight: 700; color: #111827; }
    .desc-box { background: #F9FAFB; padding: 16px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 20px; }
    .photos { display: flex; gap: 16px; margin-top: 14px; }
    .photo-card { flex: 1; border: 1px solid #D1D5DB; border-radius: 8px; overflow: hidden; }
    .photo-card img { width: 100%; height: 180px; object-fit: cover; display: block; }
    .photo-cap { padding: 6px 10px; background: #F3F4F6; font-size: 11.5px; font-weight: 700; text-align: center; }
    .footer {
      margin-top: 28px; padding-top: 16px; border-top: 1.5px dashed #D1D5DB;
      display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #4B5563;
    }
    .sig-box { text-align: center; width: 180px; }
    .sig-line { border-bottom: 1px solid #111827; margin-bottom: 6px; height: 35px; }
    @media print {
      body { background: #fff; padding: 0; }
      .no-print-bar { display: none !important; }
      .card { border: 0; box-shadow: none; padding: 10px; max-width: 100%; }
      @page { size: A4 portrait; margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>शिकायत रसीद (PDF) — कोड: ${c.code}</strong>
      <div style="font-size: 12px; opacity: 0.8;">नागरिक: ${c.name} (${c.phone})</div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn" onclick="window.print()">🖨️ PDF सेव करें / प्रिंट करें</button>
      <button class="btn" style="background: #374151;" onclick="window.close()">✕ बंद करें</button>
    </div>
  </div>

  <div class="card">
    <div class="header">
      <div class="title">
        <h2>जनसेवा वार्ड 09 — आधिकारिक शिकायत पर्ची</h2>
        <p>पार्षद: <strong>श्री संजय बिश्नोई (जाणी)</strong> | नगर निगम जोधपुर</p>
      </div>
      <div class="code-badge">${c.code}</div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-title">नागरिक का नाम</div>
        <div class="box-val">${c.name}</div>
      </div>
      <div class="box">
        <div class="box-title">मोबाइल नंबर (सत्यापित)</div>
        <div class="box-val" style="color: #065F46;">📞 ${c.phone}</div>
      </div>
      <div class="box">
        <div class="box-title">ईमेल पता</div>
        <div class="box-val" style="color: #1E40AF; font-size: 13.5px;">✉️ ${emailVal}</div>
      </div>
      <div class="box">
        <div class="box-title">मोहल्ला / क्षेत्र</div>
        <div class="box-val">📍 ${c.mohalla || 'वार्ड 09, जोधपुर'}</div>
      </div>
      <div class="box">
        <div class="box-title">शिकायत श्रेणी</div>
        <div class="box-val" style="color: #D95C00;">${c.category}</div>
      </div>
      <div class="box">
        <div class="box-title">दर्ज करने का समय व दिनांक</div>
        <div class="box-val" style="font-size: 13.5px;">🕒 ${cDate}</div>
      </div>
    </div>

    <div class="desc-box">
      <div class="box-title">समस्या का पूरा विवरण:</div>
      <div style="font-size: 14px; line-height: 1.6; margin-top: 6px; white-space: pre-wrap;">${escapeHtml(c.detail)}</div>
    </div>

    <div class="box" style="margin-bottom: 20px; background: ${statusBg}; border-color: ${statusColor}44;">
      <div class="box-title" style="color: ${statusColor};">वर्तमान स्थिति व कार्रवाई:</div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
        <span style="font-size: 16px; font-weight: 800; color: ${statusColor};">${c.status}</span>
        ${c.admin_note ? `<span style="font-size: 12.5px; color: #374151; font-weight: 600;">🕒 ${escapeHtml(c.admin_note)}</span>` : ''}
      </div>
    </div>

    ${(() => {
      const pics: string[] = c.photo_urls && c.photo_urls.length > 0 ? c.photo_urls : c.photo_url ? [c.photo_url] : []
      const hasPhotos = pics.length > 0 || !!c.after_photo_url
      if (!hasPhotos) return ''
      return `
        <div class="photos">
          ${pics.map((p, idx) => `
            <div class="photo-card">
              <img src="${p}" alt="समस्या फ़ोटो ${idx + 1}" />
              <div class="photo-cap">शिकायत की फ़ोटो${pics.length > 1 ? ` ${idx + 1}` : ''}</div>
            </div>
          `).join('')}
          ${c.after_photo_url ? `
            <div class="photo-card" style="border-color: #059669;">
              <img src="${c.after_photo_url}" alt="समाधान फ़ोटो" />
              <div class="photo-cap" style="background: #ECFDF5; color: #065F46;">✓ काम पूरा होने के बाद की फ़ोटो</div>
            </div>
          ` : ''}
        </div>
      `
    })()}

    <div class="footer">
      <div>
        <div>पोर्टल: <strong>janseva08.vercel.app</strong></div>
        <div>हेल्पलाइन व कार्यालय: वार्ड 09, जोधपुर</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div>पार्षद कार्यालय / प्राधिकृत हस्ताक्षर</div>
      </div>
    </div>
  </div>

  <script>
    setTimeout(function() { window.print(); }, 400);
  </script>
</body>
</html>
  `

  printWindow.document.open()
  printWindow.document.write(docHtml)
  printWindow.document.close()
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. Direct PDF / Print Generator for Citizens Directory
// ──────────────────────────────────────────────────────────────────────────────
export function exportCitizensPdf(citizens: CitizenForPdf[], filterLabel: string = 'सब') {
  const printWindow = window.open('', '_blank', 'width=1100,height=800')
  if (!printWindow) {
    alert('कृपया ब्राउज़र में पॉप-अप की अनुमति दें।')
    return
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  const rowsHtml = citizens.map((c, idx) => {
    const actDate = c.lastActive ? new Date(c.lastActive).toLocaleDateString('hi-IN') : '—'
    return `
      <tr>
        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
        <td style="font-weight: 700; color: #111827;">${c.name}</td>
        <td style="font-weight: 800; color: #065F46; white-space: nowrap; font-size: 13.5px;">${c.phone}</td>
        <td style="color: #1E40AF; font-size: 12px; word-break: break-all;">${c.email || '—'}</td>
        <td>${c.mohalla || '—'}</td>
        <td style="text-align: center; font-weight: 700; color: #D95C00;">${c.complaintCount ?? 0}</td>
        <td style="text-align: center; font-weight: 700; color: ${c.bloodGroup ? '#DC2626' : '#6B7280'};">${c.bloodGroup || '—'}</td>
        <td style="font-size: 11px;">${(c.tags || []).join(', ') || 'नागरिक'}</td>
        <td style="font-size: 11px; white-space: nowrap;">${actDate}</td>
      </tr>
    `
  }).join('')

  const docHtml = `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8" />
  <title>वार्ड 09 नागरिक डायरेक्टरी - ${dateStr}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Anek Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0; padding: 16px; background: #F9FAFB; color: #1F2937; font-size: 12.5px;
    }
    .no-print-bar {
      display: flex; justify-content: space-between; align-items: center;
      background: #111827; color: #fff; padding: 12px 20px; border-radius: 10px; margin-bottom: 20px;
    }
    .btn {
      background: #D95C00; color: #fff; border: 0; padding: 9px 18px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer;
    }
    .page-container { background: #fff; padding: 24px; border-radius: 10px; }
    .header {
      border-bottom: 2.5px solid #D95C00; padding-bottom: 14px; margin-bottom: 16px;
      display: flex; justify-content: space-between; align-items: flex-end;
    }
    .logo-title h1 { margin: 0 0 4px; font-size: 22px; color: #D95C00; font-weight: 800; }
    .logo-title p { margin: 2px 0 0; color: #4B5563; font-size: 13px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th {
      background: #F3F4F6; color: #111827; border: 1px solid #D1D5DB; padding: 8px; font-size: 12px; font-weight: 700; text-align: left;
    }
    td { border: 1px solid #E5E7EB; padding: 8px; vertical-align: middle; }
    tr:nth-child(even) { background: #F9FAFB; }
    @media print {
      body { background: #fff; padding: 0; font-size: 11px; }
      .no-print-bar { display: none !important; }
      .page-container { padding: 0; }
      @page { size: A4 landscape; margin: 10mm; }
      tr { page-break-inside: avoid; }
      th { background: #E5E7EB !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong style="font-size: 15px;">जनसेवा वार्ड 09 — नागरिक फ़ोन डायरेक्टरी रिपोर्ट</strong>
      <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">कुल ${citizens.length} नागरिक रिकॉर्ड · सभी फ़ोन नंबर व ईमेल पूर्णतः दृश्यमान</div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn" onclick="window.print()">🖨️ PDF डाउनलोड / प्रिंट करें (Save as PDF)</button>
      <button class="btn" style="background: #374151;" onclick="window.close()">✕ बंद करें</button>
    </div>
  </div>

  <div class="page-container">
    <div class="header">
      <div class="logo-title">
        <h1>जनसेवा वार्ड 09 — नागरिक फ़ोन डायरेक्टरी</h1>
        <p>पार्षद: <strong>श्री संजय बिश्नोई (जाणी)</strong> (वार्ड 09, जोधपुर) | नगर निगम</p>
      </div>
      <div style="text-align: right; font-size: 12px; color: #4B5563; line-height: 1.5;">
        <div><strong>दिनांक:</strong> ${dateStr} (${timeStr})</div>
        <div><strong>फ़िल्टर:</strong> ${filterLabel} (${citizens.length} रिकॉर्ड)</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 32px; text-align: center;">क्र.</th>
          <th>नागरिक का नाम</th>
          <th>मोबाइल नंबर</th>
          <th>ईमेल पता</th>
          <th>मोहल्ला / क्षेत्र</th>
          <th style="text-align: center;">कुल शिकायतें</th>
          <th style="text-align: center;">ब्लड ग्रुप</th>
          <th>टैग्स / विवरण</th>
          <th>अंतिम गतिविधि</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <script>
    setTimeout(function() { window.print(); }, 400);
  </script>
</body>
</html>
  `

  printWindow.document.open()
  printWindow.document.write(docHtml)
  printWindow.document.close()
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. Interactive WhatsApp Broadcast Modal Component
// ──────────────────────────────────────────────────────────────────────────────
export interface WhatsAppModalProps {
  title: string
  recipients: WhatsAppRecipient[]
  defaultTemplate?: string
  onClose: () => void
}

export function WhatsAppModal({
  title,
  recipients,
  defaultTemplate,
  onClose,
}: WhatsAppModalProps) {
  const [msg, setMsg] = useState(
    defaultTemplate ||
      'नमस्ते {नाम} जी, वार्ड 09 पार्षद कार्यालय (संजय बिश्नोई (जाणी)) की ओर से महत्वपूर्ण सूचना:\n\n[यहाँ अपना संदेश लिखें]\n\n— वार्ड 09 नागरिक सेवा केंद्र'
  )
  const [useWeb, setUseWeb] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({})
  const [copiedAll, setCopiedAll] = useState(false)

  const total = recipients.length
  const sentCount = Object.keys(sentMap).length

  // Quick templates
  const templates = [
    {
      label: '📢 सामान्य सूचना',
      text: 'नमस्ते {नाम} जी, वार्ड 09 पार्षद कार्यालय (संजय बिश्नोई (जाणी)) की ओर से महत्वपूर्ण सूचना:\n\n[यहाँ अपना संदेश लिखें]\n\n— वार्ड 09 नागरिक सेवा केंद्र',
    },
    {
      label: '🛠️ शिकायत संज्ञान सूचना',
      text: 'नमस्ते {नाम} जी, आपकी शिकायत (कोड: {कोड}) पर वार्ड 09 पार्षद संजय बिश्नोई (जाणी) जी द्वारा संज्ञान लिया गया है और संबंधित विभाग द्वारा कार्य चालू किया जा रहा है। किसी भी असुविधा पर संपर्क करें।\n— वार्ड 09 सेवा केंद्र',
    },
    {
      label: '✅ कार्य पूरा सूचना',
      text: 'नमस्ते {नाम} जी, आपकी शिकायत (कोड: {कोड}) का कार्य सफलतापूर्वक पूरा कर दिया गया है। पोर्टल janseva08.vercel.app पर जाकर आप कार्य के बाद की फ़ोटो देख सकते हैं। धन्यवाद!\n— वार्ड 09 पार्षद संजय बिश्नोई (जाणी)',
    },
    {
      label: '🧹 सफ़ाई अभियान',
      text: 'नमस्ते {नाम} जी, वार्ड 09 में आगामी विशेष सफ़ाई एवं सैनिटाइजेशन अभियान चलाया जा रहा है। अपने क्षेत्र को स्वच्छ रखने में सहयोग करें।\n— वार्ड 09 पार्षद संजय बिश्नोई (जाणी) कार्यालय',
    },
    {
      label: '🩸 रक्तदान अपील',
      text: 'नमस्ते {नाम} जी, वार्ड 09 के एक मरीज हेतु रक्त की तुरंत आवश्यकता है। यदि आप या कोई परिचित सहयोग कर सकें तो कृपया संपर्क करें।\n— वार्ड 09 ब्लड डोनर सेवा, जोधपुर',
    },
  ]

  function formatMessageFor(r: WhatsAppRecipient): string {
    return msg
      .replace(/\{नाम\}/g, r.name || 'नागरिक')
      .replace(/\{फ़ोन\}/g, r.phone || '')
      .replace(/\{मोहल्ला\}/g, r.mohalla || 'वार्ड 09')
      .replace(/\{कोड\}/g, r.code || '')
      .replace(/\{वार्ड\}/g, 'वार्ड 09')
  }

  function sendToRecipient(r: WhatsAppRecipient, index?: number) {
    const text = formatMessageFor(r)
    const url = buildWhatsAppUrl(r.phone, text, useWeb)
    window.open(url, '_blank')
    setSentMap(prev => ({ ...prev, [r.phone]: true }))
    if (typeof index === 'number') {
      setCurrentIndex(Math.min(index + 1, total - 1))
    }
  }

  function handleSendNext() {
    if (recipients.length === 0) return
    const targetIdx = currentIndex < total ? currentIndex : 0
    const r = recipients[targetIdx]
    if (r) {
      sendToRecipient(r, targetIdx)
    }
  }

  function copyAllPhones() {
    const phones = recipients.map(r => r.phone.replace(/\D/g, '')).filter(Boolean)
    if (phones.length === 0) return
    navigator.clipboard.writeText(phones.join('\n'))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2500)
  }

  const nextRecipient = recipients[currentIndex]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 780,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#fff',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>💬</span>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 4 }}>
              वर्तमान सूची के {total} नागरिकों को आपके डिवाइस में लॉगिन WhatsApp से मैसेज भेजें
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 0,
              color: '#fff',
              fontSize: 18,
              width: 32,
              height: 32,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {/* Platform toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F0FDF4',
              border: '1.5px solid #BBF7D0',
              padding: '10px 14px',
              borderRadius: 10,
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
              डिवाइस WhatsApp प्रकार:
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="radio"
                  name="waPlatform"
                  checked={useWeb}
                  onChange={() => setUseWeb(true)}
                />
                WhatsApp Web (ब्राउज़र / PC)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="radio"
                  name="waPlatform"
                  checked={!useWeb}
                  onChange={() => setUseWeb(false)}
                />
                WhatsApp App (मोबाइल ऐप)
              </label>
            </div>
          </div>

          {/* Quick template buttons */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 6 }}>
              ⚡ त्वरित टेम्पलेट (Quick Templates):
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {templates.map(t => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setMsg(t.text)}
                  style={{
                    background: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#374151',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>
                कस्टम संदेश (Custom Message):
              </label>
              <div style={{ fontSize: 11.5, color: '#6B7280' }}>
                टैग्स: <code style={{ color: '#D95C00' }}>{'{नाम}'}</code>, <code style={{ color: '#D95C00' }}>{'{फ़ोन}'}</code>, <code style={{ color: '#D95C00' }}>{'{मोहल्ला}'}</code>
                {recipients.some(r => r.code) && <>, <code style={{ color: '#D95C00' }}>{'{कोड}'}</code></>}
              </div>
            </div>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1.5px solid #D1D5DB',
                fontSize: 13.5,
                fontFamily: 'inherit',
                lineHeight: 1.5,
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Sequential 1-Click Sender Box */}
          <div
            style={{
              background: '#F9FAFB',
              border: '2px dashed #059669',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
              <div>
                <strong style={{ fontSize: 14, color: '#111827' }}>क्रमवार प्रेषक (1-Click Sender)</strong>
                <div style={{ fontSize: 12, color: '#4B5563', marginTop: 2 }}>
                  एक क्लिक में चैट खुलती है और संदेश पहले से लिखा रहता है — बस भेजें (Send) पर टैप करें।
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>
                  {sentCount} / {total} भेजा गया
                </span>
                <div style={{ height: 6, width: 120, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${total ? (sentCount * 100) / total : 0}%`,
                      background: '#059669',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleSendNext}
                disabled={total === 0}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 0,
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
                }}
              >
                <span>🚀 अगले को भेजें:</span>
                <strong>{nextRecipient ? `${nextRecipient.name} (${nextRecipient.phone})` : 'पूर्ण'}</strong>
                <span>👉</span>
              </button>

              <button
                type="button"
                onClick={copyAllPhones}
                style={{
                  background: '#fff',
                  border: '1.5px solid #D1D5DB',
                  padding: '9px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                {copiedAll ? '✓ सभी नंबर कॉपी हुए!' : `📋 सभी नंबर कॉपी करें (${total})`}
              </button>
            </div>
          </div>

          {/* Recipients List Table */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              प्राप्तकर्ता सूची ({total}):
            </div>
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead style={{ background: '#F3F4F6', position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>नाम</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>मोबाइल नंबर</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>क्षेत्र</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #D1D5DB' }}>स्थिति</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #D1D5DB' }}>कार्रवाई</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r, i) => {
                    const isSent = !!sentMap[r.phone]
                    const isCurrent = currentIndex === i
                    return (
                      <tr
                        key={r.phone}
                        style={{
                          background: isCurrent ? '#FEF3C7' : i % 2 === 0 ? '#fff' : '#F9FAFB',
                          borderBottom: '1px solid #E5E7EB',
                        }}
                      >
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                          {isCurrent && <span style={{ color: '#D97706', marginRight: 4 }}>👉</span>}
                          {r.name}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#065F46' }}>{r.phone}</td>
                        <td style={{ padding: '8px 10px', color: '#6B7280' }}>{r.mohalla || '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {isSent ? (
                            <span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                              ✓ भेजा गया
                            </span>
                          ) : (
                            <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                              लंबित
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => sendToRecipient(r, i)}
                            style={{
                              background: '#25D366',
                              color: '#fff',
                              border: 0,
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            💬 भेजें
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 22px',
            background: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            नोट: WhatsApp आपके डिवाइस (मोबाइल/डेस्कटॉप) में लॉगिन होना चाहिए।
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#374151',
              color: '#fff',
              border: 0,
              padding: '8px 18px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            समाप्त (Done)
          </button>
        </div>
      </div>
    </div>
  )
}
