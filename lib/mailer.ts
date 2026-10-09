import nodemailer from 'nodemailer'

/** New format J001 has no slash — use as-is. Legacy 09/1 → 09-1 for URL slug. */
function toCodeSlug(code: string): string {
  return /^[A-Z]\d{3}$/.test(code) ? code : code.replace('/', '-')
}

/** Resolves the correct public app URL in both local dev and Vercel production */
function getAppUrl(): string {
  // 1. Explicit override (set in Vercel env vars or .env.local)
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  // 2. Vercel automatically sets VERCEL_URL (no https prefix) in production/preview
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // 3. Local fallback
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

interface ComplaintEmailProps {
  code: string
  name: string
  phone: string
  email?: string | null
  mohalla: string
  category: string
  detail: string
  photo_url?: string | null
  latitude?: string | null
  longitude?: string | null
  createdAt?: string
}

function getMailTransporter() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
  const smtpUser = process.env.SMTP_USER || ''
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '')

  if (!smtpUser || !smtpPass) return null

  return smtpHost.includes('gmail')
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      })
    : nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      })
}

export async function sendComplaintNotificationEmail(props: ComplaintEmailProps) {
  const { code, name, phone, email, mohalla, category, detail, photo_url, latitude, longitude } = props

  const toEmail = process.env.SANCHALAK_EMAIL || process.env.SMTP_USER || ''
  const smtpUser = process.env.SMTP_USER || ''
  const smtpFrom = process.env.SMTP_FROM || `"वार्ड मित्र 09" <${smtpUser || 'noreply@wardmitra09.in'}>`
  const appUrl = getAppUrl()

  if (!toEmail) {
    console.log(`[Mailer] सूचना: संचालक ईमेल (SANCHALAK_EMAIL) सेट नहीं है।`)
    return { ok: false, message: 'संचालक ईमेल सेट नहीं है।' }
  }

  const transporter = getMailTransporter()
  if (!transporter) {
    console.log(`[Mailer] सूचना: SMTP क्रेडेंशियल (SMTP_USER / SMTP_PASS) .env.local में सेट नहीं हैं। नई शिकायत: ${code} - ${name} (${phone})`)
    return { ok: false, message: 'SMTP क्रेडेंशियल सेट नहीं हैं।' }
  }

  try {
    const codeSlug = toCodeSlug(code)
    const publicUrl = `${appUrl}/s/${codeSlug}`
    const admUrl = `${appUrl}/adm`

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #111827; padding: 24px 28px; color: #ffffff;">
          <div style="font-size: 13px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">वार्ड मित्र 09 · संचालक सूचना</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3;">नई नागरिक शिकायत प्राप्त हुई</h1>
          <div style="margin-top: 10px; display: inline-block; background: #f59e0b; color: #111827; font-weight: 800; padding: 4px 12px; border-radius: 6px; font-size: 15px;">
            कोड: ${code}
          </div>
        </div>

        <div style="padding: 28px;">
          <h2 style="font-size: 16px; margin: 0 0 16px 0; color: #1f2937; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">नागरिक विवरण</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 140px;">नागरिक का नाम:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 700;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">मोबाइल नंबर:</td>
              <td style="padding: 8px 0; color: #2563eb; font-weight: 700;">
                <a href="tel:${phone}" style="color: #2563eb; text-decoration: none;">${phone}</a>
              </td>
            </tr>
            ${
              email
                ? `<tr>
              <td style="padding: 8px 0; color: #6b7280;">ईमेल पता:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">
                <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
              </td>
            </tr>`
                : ''
            }
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">मोहल्ला / क्षेत्र:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${mohalla}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">शिकायत श्रेणी:</td>
              <td style="padding: 8px 0; color: #d97706; font-weight: 700;">${category}</td>
            </tr>
          </table>

          <h2 style="font-size: 16px; margin: 0 0 12px 0; color: #1f2937; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">शिकायत का विवरण</h2>
          <div style="background: #f9fafb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 4px; font-size: 14.5px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            ${detail}
          </div>

          ${
            photo_url
              ? `
            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #4b5563;">नागरिक द्वारा संलग्न फ़ोटो:</h3>
              <a href="${photo_url}" target="_blank">
                <img src="${photo_url}" alt="शिकायत फ़ोटो" style="max-width: 100%; height: auto; max-height: 280px; border-radius: 8px; border: 1px solid #e5e7eb; object-fit: cover;" />
              </a>
            </div>
          `
              : ''
          }

          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; flex-wrap: wrap;">
            ${
              latitude && longitude
                ? `
              <a href="https://maps.google.com/?q=${latitude},${longitude}" target="_blank" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                📍 नक्शे पर लोकेशन देखें →
              </a>
            `
                : ''
            }
            <a href="${admUrl}" style="background: #111827; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
              संचालक पोर्टल खोलें →
            </a>
            <a href="${publicUrl}" style="background: #f3f4f6; color: #374151; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
              सार्वजनिक लिंक
            </a>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 16px 28px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb;">
          यह ईमेल वार्ड मित्र 09 शिकायत रजिस्टर प्रणाली द्वारा स्वतः भेजा गया है।
        </div>
      </div>
    `

    const textContent = `
वार्ड मित्र 09 · संचालक सूचना
नई नागरिक शिकायत प्राप्त हुई: कोड ${code}

नागरिक का नाम: ${name}
मोबाइल नंबर: ${phone}
${email ? `ईमेल पता: ${email}\n` : ''}मोहल्ला: ${mohalla}
शिकायत श्रेणी: ${category}

विवरण:
${detail}

${photo_url ? `फ़ोटो लिंक: ${photo_url}\n` : ''}
संचालक पोर्टल: ${admUrl}
सार्वजनिक लिंक: ${publicUrl}
    `

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: toEmail,
      subject: `[वार्ड मित्र 09] नई शिकायत दर्ज हुई — ${code} (${category})`,
      text: textContent,
      html: htmlContent,
    })

    console.log(`[Mailer] संचालक ईमेल भेजा गया: ${info.messageId} to ${toEmail}`)
    return { ok: true, messageId: info.messageId }
  } catch (err: any) {
    console.error('[Mailer] संचालक ईमेल भेजने में त्रुटि:', err)
    return { ok: false, error: err.message }
  }
}

export interface ComplaintResolvedEmailProps {
  code: string
  name: string
  toEmail: string
  category: string
  mohalla: string
  detail: string
  admin_note?: string | null
  after_photo_url?: string | null
  photo_url?: string | null
}

export async function sendComplaintResolvedEmail(props: ComplaintResolvedEmailProps) {
  const { code, name, toEmail, category, mohalla, detail, admin_note, after_photo_url, photo_url } = props

  if (!toEmail || !toEmail.includes('@')) {
    console.log(`[Mailer] शिकायतकर्ता ईमेल अनुपलब्ध है (${code}). समाधान ईमेल नहीं भेजा गया।`)
    return { ok: false, message: 'ईमेल पता नहीं दिया गया है।' }
  }

  const transporter = getMailTransporter()
  if (!transporter) {
    console.log(`[Mailer] SMTP क्रेडेंशियल सेट नहीं हैं। समाधान ईमेल नहीं भेजा जा सका (${code} -> ${toEmail})`)
    return { ok: false, message: 'SMTP क्रेडेंशियल सेट नहीं हैं।' }
  }

  const smtpUser = process.env.SMTP_USER || ''
  const smtpFrom = process.env.SMTP_FROM || `"वार्ड मित्र 09" <${smtpUser || 'noreply@wardmitra09.in'}>`
  const appUrl = getAppUrl()
  const codeSlug = toCodeSlug(code)
  const publicUrl = `${appUrl}/s/${codeSlug}`

  try {
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <!-- Top Header -->
        <div style="background: linear-gradient(135deg, #065f46 0%, #047857 60%, #059669 100%); padding: 26px 28px; color: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.8px;">वार्ड 09 · जनसेवा समाधान</span>
            <span style="background: rgba(255,255,255,0.2); font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px;">✓ कार्य पूर्ण</span>
          </div>
          <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; line-height: 1.3;">आपकी शिकायत का समाधान हो गया है!</h1>
          <div style="margin-top: 10px; display: inline-block; background: #ffffff; color: #065f46; font-weight: 800; padding: 4px 14px; border-radius: 6px; font-size: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            शिकायत कोड: ${code}
          </div>
        </div>

        <!-- Main Body -->
        <div style="padding: 28px;">
          <p style="font-size: 15.5px; line-height: 1.6; color: #1f2937; margin: 0 0 18px 0;">
            नमस्ते <strong>${name} जी</strong>,<br>
            वार्ड 09 संचालक टीम द्वारा आपकी शिकायत का समाधान सफलतापूर्वक कर दिया गया है।
          </p>

          <!-- Status Box -->
          <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
            <div style="font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">स्थिति अपडेट</div>
            <div style="font-size: 18px; font-weight: 800; color: #15803d; display: flex; align-items: center; gap: 8px;">
              ✓ काम पूरा हो गया (Resolved)
            </div>
            ${
              admin_note
                ? `<div style="font-size: 13.5px; color: #166534; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #bbf7d0;">
                <strong>संचालक टिप्पणी / समय:</strong> ${admin_note}
              </div>`
                : ''
            }
          </div>

          <!-- Complaint Details Table -->
          <h2 style="font-size: 15px; margin: 0 0 12px 0; color: #374151; border-bottom: 2px solid #f3f4f6; padding-bottom: 6px;">शिकायत का संक्षिप्त विवरण</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td style="padding: 7px 0; color: #6b7280; width: 130px;">शिकायत श्रेणी:</td>
              <td style="padding: 7px 0; color: #111827; font-weight: 700;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #6b7280;">मोहल्ला / क्षेत्र:</td>
              <td style="padding: 7px 0; color: #111827; font-weight: 600;">${mohalla}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #6b7280; vertical-align: top;">मूल समस्या:</td>
              <td style="padding: 7px 0; color: #374151; font-size: 13.5px; line-height: 1.5;">${detail}</td>
            </tr>
          </table>

          <!-- Photos Comparison -->
          ${
            after_photo_url
              ? `
            <div style="margin: 22px 0; background: #fafafa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px;">
              <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #047857; font-weight: 700;">
                ✓ समाधान प्रमाण (काम के बाद की तस्वीर):
              </h3>
              <a href="${after_photo_url}" target="_blank">
                <img src="${after_photo_url}" alt="समाधान फ़ोटो" style="max-width: 100%; height: auto; max-height: 280px; border-radius: 8px; border: 1.5px solid #10b981; object-fit: cover;" />
              </a>
            </div>
          `
              : ''
          }

          <!-- View Action Button -->
          <div style="margin-top: 24px; text-align: center;">
            <a href="${publicUrl}" target="_blank" style="background: #047857; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 3px 8px rgba(4,120,87,0.3);">
              पोर्टल पर पूरी स्थिति देखें →
            </a>
          </div>

          <div style="margin-top: 26px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 13px; color: #6b7280; line-height: 1.5;">
            वार्ड 09 को स्वच्छ और बेहतर बनाने में आपके सहयोग के लिए धन्यवाद।<br>
            यदि आपको कोई और समस्या है, तो आप कभी भी <a href="${appUrl}/new" style="color: #047857; font-weight: 600;">नया आवेदन / शिकायत दर्ज</a> कर सकते हैं।
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px 28px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb;">
          वार्ड 09 जनसेवा · संजय बिश्नोई (पार्षद वार्ड 09) · जनसेवा 09 डिजिटल पोर्टल
        </div>
      </div>
    `

    const textContent = `
वार्ड मित्र 09 · समाधान सूचना
नमस्ते ${name} जी,

आपकी शिकायत (कोड: ${code}) का समाधान सफलता से कर दिया गया है!

स्थिति: काम पूरा (Resolved)
${admin_note ? `संचालक टिप्पणी / समय: ${admin_note}\n` : ''}
शिकायत श्रेणी: ${category}
मोहल्ला: ${mohalla}

पोर्टल पर स्थिति देखें: ${publicUrl}
${after_photo_url ? `समाधान फ़ोटो प्रमाण: ${after_photo_url}\n` : ''}

वार्ड 09 को स्वच्छ व बेहतर बनाने में आपके सहयोग के लिए धन्यवाद।
— वार्ड 09 जनसेवा
    `

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: toEmail,
      subject: `[वार्ड मित्र 09] आपकी शिकायत का समाधान हो गया है — कोड: ${code}`,
      text: textContent,
      html: htmlContent,
    })

    console.log(`[Mailer] शिकायतकर्ता समाधान ईमेल भेजा गया: ${info.messageId} to ${toEmail} for ${code}`)
    return { ok: true, messageId: info.messageId }
  } catch (err: any) {
    console.error(`[Mailer] शिकायतकर्ता को ईमेल भेजने में त्रुटि (${toEmail}):`, err)
    return { ok: false, error: err.message }
  }
}

export interface ComplaintCitizenConfirmationProps {
  code: string
  name: string
  toEmail: string
  category: string
  mohalla: string
  detail: string
  photo_url?: string | null
}

export async function sendComplaintCitizenConfirmationEmail(props: ComplaintCitizenConfirmationProps) {
  const { code, name, toEmail, category, mohalla, detail, photo_url } = props

  if (!toEmail || !toEmail.includes('@')) {
    console.log(`[Mailer] नागरिक ईमेल अनुपलब्ध है (${code}). पुष्टिकरण ईमेल नहीं भेजा गया।`)
    return { ok: false, message: 'ईमेल पता नहीं दिया गया है।' }
  }

  const transporter = getMailTransporter()
  if (!transporter) {
    console.log(`[Mailer] SMTP क्रेडेंशियल सेट नहीं हैं। नागरिक को पुष्टिकरण ईमेल नहीं भेजा जा सका (${code} -> ${toEmail})`)
    return { ok: false, message: 'SMTP क्रेडेंशियल सेट नहीं हैं।' }
  }

  const smtpUser = process.env.SMTP_USER || ''
  const smtpFrom = process.env.SMTP_FROM || `"वार्ड मित्र 09" <${smtpUser || 'noreply@wardmitra09.in'}>`
  const appUrl = getAppUrl()
  const codeSlug = code.replace('/', '-')
  const publicUrl = `${appUrl}/s/${codeSlug}`

  try {
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <!-- Top Header Banner -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%); padding: 26px 28px; color: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.8px;">वार्ड 09 · जनसेवा पावती (Acknowledgment)</span>
            <span style="background: rgba(255,255,255,0.2); font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px;">✓ दर्ज हुई</span>
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; line-height: 1.3;">आपकी शिकायत सफलतापूर्वक दर्ज हो गई है</h1>
          
          <!-- Prominent Complaint Code Badge -->
          <div style="margin-top: 12px; background: #ffffff; padding: 12px 18px; border-radius: 10px; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            <div style="font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">आपकी शिकायत संख्या / कोड:</div>
            <div style="font-size: 24px; font-weight: 900; color: #1e40af; letter-spacing: 0.5px; margin-top: 2px;">
              ${code}
            </div>
          </div>
        </div>

        <!-- Main Body -->
        <div style="padding: 28px;">
          <p style="font-size: 15.5px; line-height: 1.6; color: #1f2937; margin: 0 0 18px 0;">
            नमस्ते <strong>${name} जी</strong>,<br>
            वार्ड 09 जनसेवा पोर्टल पर आपकी शिकायत प्राप्त हो गई है। इसे वार्ड पार्षद श्री <strong>संजय बिश्नोई (पार्षद वार्ड 09)</strong> एवं वार्ड टीम के संज्ञान में दर्ज कर लिया गया है।
          </p>

          <!-- Status Highlight Card -->
          <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
            <div style="font-size: 12.5px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">वर्तमान स्थिति</div>
            <div style="font-size: 17px; font-weight: 800; color: #1d4ed8; display: flex; align-items: center; gap: 8px;">
              📋 दर्ज (Registered) — जल्द कार्रवाई की जाएगी
            </div>
          </div>

          <!-- Complaint Details Table -->
          <h2 style="font-size: 15px; margin: 0 0 12px 0; color: #374151; border-bottom: 2px solid #f3f4f6; padding-bottom: 6px;">दर्ज की गई शिकायत का विवरण</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td style="padding: 7px 0; color: #6b7280; width: 130px;">शिकायत संख्या:</td>
              <td style="padding: 7px 0; color: #1e40af; font-weight: 800; font-size: 15px;">${code}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #6b7280;">शिकायत श्रेणी:</td>
              <td style="padding: 7px 0; color: #111827; font-weight: 700;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #6b7280;">मोहल्ला / क्षेत्र:</td>
              <td style="padding: 7px 0; color: #111827; font-weight: 600;">${mohalla}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #6b7280; vertical-align: top;">समस्या का विवरण:</td>
              <td style="padding: 7px 0; color: #374151; font-size: 13.5px; line-height: 1.5;">${detail}</td>
            </tr>
          </table>

          <!-- Attached Photo (if any) -->
          ${
            photo_url
              ? `
            <div style="margin: 20px 0; background: #fafafa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px;">
              <h3 style="font-size: 13.5px; margin: 0 0 8px 0; color: #4b5563; font-weight: 700;">
                📷 आपके द्वारा संलग्न फ़ोटो:
              </h3>
              <a href="${photo_url}" target="_blank">
                <img src="${photo_url}" alt="शिकायत फ़ोटो" style="max-width: 100%; height: auto; max-height: 240px; border-radius: 8px; border: 1px solid #d1d5db; object-fit: cover;" />
              </a>
            </div>
          `
              : ''
          }

          <!-- View Action Button -->
          <div style="margin-top: 24px; text-align: center;">
            <a href="${publicUrl}" target="_blank" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 3px 8px rgba(37,99,235,0.3);">
              पोर्टल पर स्थिति ट्रैक करें →
            </a>
          </div>

          <div style="margin-top: 26px; padding: 14px 16px; background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; font-size: 13px; color: #854d0e; line-height: 1.5;">
            <strong>📌 ध्यान रखें:</strong> कृपया भविष्य के संदर्भ और शिकायत की प्रगति जांचने के लिए यह शिकायत नंबर <strong>${code}</strong> सुरक्षित रखें। जैसे ही इस समस्या का समाधान हो जाएगा, आपको पुनः ईमेल भेजकर सूचित किया जाएगा।
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px 28px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb;">
          वार्ड 09 जनसेवा · संजय बिश्नोई (पार्षद वार्ड 09) · जनसेवा 09 डिजिटल पोर्टल
        </div>
      </div>
    `

    const textContent = `
वार्ड मित्र 09 · जनसेवा पावती
नमस्ते ${name} जी,

आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है!
आपकी शिकायत संख्या / कोड: ${code}

स्थिति: दर्ज (Registered)
शिकायत श्रेणी: ${category}
मोहल्ला: ${mohalla}

विवरण:
${detail}

पोर्टल पर स्थिति देखें / ट्रैक करें:
${publicUrl}

कृपया यह शिकायत नंबर (${code}) भविष्य के लिए सुरक्षित रखें। समाधान होने पर आपको पुनः ईमेल भेजा जाएगा।
— संजय बिश्नोई (पार्षद वार्ड 09)
    `

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: toEmail,
      subject: `[वार्ड 09 जनसेवा] आपकी शिकायत दर्ज हुई — शिकायत नंबर: ${code}`,
      text: textContent,
      html: htmlContent,
    })

    console.log(`[Mailer] नागरिक पुष्टिकरण ईमेल भेजा गया: ${info.messageId} to ${toEmail} for ${code}`)
    return { ok: true, messageId: info.messageId }
  } catch (err: any) {
    console.error(`[Mailer] नागरिक पुष्टिकरण ईमेल भेजने में त्रुटि (${toEmail}):`, err)
    return { ok: false, error: err.message }
  }
}

