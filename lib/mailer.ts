import nodemailer from 'nodemailer'

interface ComplaintEmailProps {
  code: string
  name: string
  phone: string
  mohalla: string
  category: string
  detail: string
  photo_url?: string | null
  latitude?: string | null
  longitude?: string | null
  createdAt?: string
}

export async function sendComplaintNotificationEmail(props: ComplaintEmailProps) {
  const { code, name, phone, mohalla, category, detail, photo_url, latitude, longitude } = props

  const toEmail = process.env.SANCHALAK_EMAIL || process.env.SMTP_USER || ''
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
  const smtpUser = process.env.SMTP_USER || ''
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '')
  const smtpFrom = process.env.SMTP_FROM || `"वार्ड मित्र 09" <${smtpUser || 'noreply@wardmitra09.in'}>`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!toEmail) {
    console.log(`[Mailer] सूचना: संचालक ईमेल (SANCHALAK_EMAIL) सेट नहीं है।`)
    return { ok: false, message: 'संचालक ईमेल सेट नहीं है।' }
  }

  if (!smtpUser || !smtpPass) {
    console.log(`[Mailer] सूचना: SMTP क्रेडेंशियल (SMTP_USER / SMTP_PASS) .env.local में सेट नहीं हैं। नई शिकायत: ${code} - ${name} (${phone})`)
    return { ok: false, message: 'SMTP क्रेडेंशियल सेट नहीं हैं।' }
  }

  try {
    const transporter = smtpHost.includes('gmail')
      ? nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        })
      : nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        })

    const codeSlug = code.replace('/', '-')
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
मोहल्ला: ${mohalla}
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

    console.log(`[Mailer] ईमेल सफलता से भेजा गया: ${info.messageId} to ${toEmail}`)
    return { ok: true, messageId: info.messageId }
  } catch (err: any) {
    console.error('[Mailer] ईमेल भेजने में त्रुटि:', err)
    return { ok: false, error: err.message }
  }
}
