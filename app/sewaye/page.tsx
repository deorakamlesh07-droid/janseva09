export default function Sewaye() {
  const services = [
    {
      title: 'जन्म प्रमाण पत्र',
      sub: 'नगर निगम जोधपुर · ई-मित्र',
      docs: ['अस्पताल की पर्ची', 'माता-पिता का आधार', 'पता का प्रमाण'],
      url: 'https://pehchan.rajasthan.gov.in/',
    },
    {
      title: 'मृत्यु प्रमाण पत्र',
      sub: 'नगर निगम जोधपुर · ई-मित्र',
      docs: ['अस्पताल या श्मशान की पर्ची', 'मृतक का आधार', 'आवेदक का आधार'],
      url: 'https://pehchan.rajasthan.gov.in/',
    },
    {
      title: 'आय · जाति · निवास',
      sub: 'SDM कार्यालय · ई-मित्र',
      docs: ['आधार और राशन कार्ड', 'बिजली या पानी का बिल', 'शपथ पत्र'],
      url: 'https://emitra.rajasthan.gov.in',
    },
    {
      title: 'गृह कर · पट्टा · नामांतरण',
      sub: 'नगर निगम जोधपुर',
      docs: ['पुराना पट्टा या रजिस्ट्री', 'पिछली रसीद', 'आधार'],
      url: 'https://lsg.urban.rajasthan.gov.in',
    },
    {
      title: 'राशन कार्ड',
      sub: 'खाद्य एवं नागरिक आपूर्ति विभाग',
      docs: ['परिवार के सब आधार', 'जन आधार', 'पता का प्रमाण'],
      url: 'https://food.rajasthan.gov.in',
    },
    {
      title: 'पेंशन',
      sub: 'सामाजिक न्याय एवं अधिकारिता विभाग',
      docs: ['जन आधार', 'आयु और आय प्रमाण', 'बैंक खाता'],
      url: 'https://ssp.rajasthan.gov.in',
    },
  ]

  return (
    <section className="sec">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <h2 className="sh">सरकारी सेवाएँ</h2>
        <p className="sp">कौन सा काम कहाँ होता है और क्या साथ ले जाना है — फ़ीस वहीं देखिए, यहाँ नहीं लिखी</p>

        {services.map(s => (
          <a key={s.title} className="swcard" href={s.url} target="_blank" rel="noopener">
            <b>{s.title}</b>
            <div className="sub">{s.sub}</div>
            <ul>
              {s.docs.map(d => <li key={d}>{d}</li>)}
            </ul>
            <span className="swlink">
              कहाँ बनता है
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
