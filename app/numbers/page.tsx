export const metadata = { title: 'ज़रूरी नंबर — जनसेवा 09' }

const EMERGENCY = [
  { num: '112', label: 'पुलिस, एम्बुलेंस, दमकल — एक ही नंबर' },
  { num: '108', label: 'एम्बुलेंस' },
  { num: '100', label: 'पुलिस कंट्रोल रूम' },
  { num: '101', label: 'दमकल (फ़ायर ब्रिगेड)' },
  { num: '102', label: 'जननी शिशु सुरक्षा — गर्भवती/नवजात' },
  { num: '104', label: 'स्वास्थ्य सलाह (मेडिकल हेल्पलाइन)' },
  { num: '1070', label: 'राष्ट्रीय आपदा हेल्पलाइन (NDMA)' },
  { num: '1098', label: 'बाल हेल्पलाइन — बच्चों की मदद' },
  { num: '1091', label: 'महिला हेल्पलाइन' },
  { num: '1930', label: 'साइबर क्राइम / ऑनलाइन ठगी' },
  { num: '14567', label: 'वरिष्ठ नागरिक हेल्पलाइन' },
  { num: '181', label: 'राजस्थान संपर्क — सरकारी शिकायत' },
  { num: '1962', label: 'पशु चिकित्सा हेल्पलाइन' },
  { num: '1800-180-6236', label: 'जलदाय विभाग — पानी शिकायत टोल फ्री' },
]

const DEPT = [
  { title: 'नगर निगम जोधपुर — कंट्रोल रूम', sub: 'सफ़ाई, कचरा गाड़ी, सीवर, सड़क', num: '0291-2432598' },
  { title: 'वार्ड 09 — सफ़ाई जमादार', sub: 'गली की सफ़ाई, कचरा', num: null },
  { title: 'जलदाय विभाग — जोधपुर', sub: 'पानी सप्लाई, टैंकर, लीकेज', num: '0291-2511760' },
  { title: 'बिजली — JDVVNL शिकायत', sub: 'फ़ॉल्ट, स्ट्रीट लाइट, मीटर', num: '1800-180-6565' },
  { title: 'राजस्थान संपर्क', sub: 'किसी भी विभाग की सरकारी शिकायत', num: '181' },
  { title: 'नगर पालिका — जन सुविधा', sub: 'नक्शा, पट्टा, नामांतरण', num: '0291-2544744' },
  { title: 'ट्रैफ़िक पुलिस जोधपुर', sub: 'जाम, दुर्घटना, अतिक्रमण', num: '0291-2620023' },
]

const LINKS = [
  { title: 'ई-मित्र', sub: 'जन्म, मृत्यु, आय, निवास, जाति प्रमाण पत्र', url: 'https://emitra.rajasthan.gov.in' },
  { title: 'SSO राजस्थान', sub: 'राज्य की सारी ऑनलाइन सेवाएँ एक जगह', url: 'https://sso.rajasthan.gov.in' },
  { title: 'नगर निगम जोधपुर', sub: 'गृह कर, नामांतरण, पट्टा', url: 'https://lsg.urban.rajasthan.gov.in' },
  { title: 'राशन · पेंशन', sub: 'खाद्य विभाग और सामाजिक न्याय विभाग', url: 'https://food.rajasthan.gov.in' },
]

export default function Numbers() {
  return (
    <section className="sec">
      <div className="wrap two">
        <div>
          <div className="emgbox">
            <h2 className="sh" style={{ fontSize: 20, marginBottom: 2 }}>आपातकालीन नंबर</h2>
            <p className="sp" style={{ marginBottom: 14 }}>दबाते ही कॉल लग जाएगा</p>
            <div className="egrid">
              {EMERGENCY.map(e => (
                <a key={e.num} href={`tel:${e.num}`}>
                  <b>{e.num}</b><span>{e.label}</span>
                </a>
              ))}
            </div>
          </div>

          <h2 className="sh" style={{ marginTop: 30 }}>वार्ड और विभाग के नंबर</h2>
          <p className="sp">कुछ काम सीधे फ़ोन से भी हो जाते हैं</p>
          {DEPT.map(d => (
            <div key={d.title} className="nrow">
              <div><b>{d.title}</b><span>{d.sub}</span></div>
              {d.num ? (
                <a href={`tel:${d.num.replace(/-/g, '')}`} className="tf" style={{ color: 'var(--red)', fontWeight: 700, textDecoration: 'none' }}>
                  {d.num}
                </a>
              ) : (
                <em className="tf" style={{ color: '#94A3B8', fontStyle: 'italic' }}>अभी उपलब्ध नहीं</em>
              )}
            </div>
          ))}
          <div className="hint" style={{ marginTop: 14 }}>जो नंबर यहाँ लिखा है वो जाँचा हुआ है। जो नहीं जाँचा, वो लिखा ही नहीं गया।</div>
        </div>

        <div>
          <h2 className="sh">सरकारी काम कहाँ होता है</h2>
          <p className="sp">लिंक सीधे सरकारी साइट पर ले जाते हैं — फ़ीस वहीं देखिए</p>
          {LINKS.map(l => (
            <a key={l.url} className="lrow" href={l.url} target="_blank" rel="noopener">
              <b>{l.title}</b><span>{l.sub}</span>
            </a>
          ))}
          <a className="lrow" href="/sewaye"><b>पूरी सूची देखिए</b><span>कौन सा काम कहाँ, और क्या साथ ले जाना है</span></a>
        </div>
      </div>
    </section>
  )
}
