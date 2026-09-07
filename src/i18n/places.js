// Curated English/Tamil/Hindi renderings for India's 28 States + 8 Union
// Territories (A4.3 -- place names get real dictionary entries, never naive
// character-by-character transliteration).
//
// District (751) and constituency (536) names are NOT hand-curated here --
// doing that accurately for every entry is out of scope for Session A.
// getPlaceName() falls back to the original English record for any name
// without a curated entry, which is the honest behaviour: no name is ever
// silently machine-transliterated.

export const STATE_NAMES = {
  "Andhra Pradesh": { ta: "ஆந்திரப் பிரதேசம்", hi: "आंध्र प्रदेश" },
  "Arunachal Pradesh": { ta: "அருணாச்சலப் பிரதேசம்", hi: "अरुणाचल प्रदेश" },
  "Assam": { ta: "அசாம்", hi: "असम" },
  "Bihar": { ta: "பீகார்", hi: "बिहार" },
  "Chhattisgarh": { ta: "சத்தீஸ்கர்", hi: "छत्तीसगढ़" },
  "Goa": { ta: "கோவா", hi: "गोवा" },
  "Gujarat": { ta: "குஜராத்", hi: "गुजरात" },
  "Haryana": { ta: "ஹரியானா", hi: "हरियाणा" },
  "Himachal Pradesh": { ta: "இமாச்சலப் பிரதேசம்", hi: "हिमाचल प्रदेश" },
  "Jharkhand": { ta: "ஜார்க்கண்ட்", hi: "झारखंड" },
  "Karnataka": { ta: "கர்நாடகா", hi: "कर्नाटक" },
  "Kerala": { ta: "கேரளா", hi: "केरल" },
  "Madhya Pradesh": { ta: "மத்தியப் பிரதேசம்", hi: "मध्य प्रदेश" },
  "Maharashtra": { ta: "மகாராஷ்டிரா", hi: "महाराष्ट्र" },
  "Manipur": { ta: "மணிப்பூர்", hi: "मणिपुर" },
  "Meghalaya": { ta: "மேகாலயா", hi: "मेघालय" },
  "Mizoram": { ta: "மிசோரம்", hi: "मिज़ोरम" },
  "Nagaland": { ta: "நாகாலாந்து", hi: "नागालैंड" },
  "Odisha": { ta: "ஒடிசா", hi: "ओडिशा" },
  "Punjab": { ta: "பஞ்சாப்", hi: "पंजाब" },
  "Rajasthan": { ta: "ராஜஸ்தான்", hi: "राजस्थान" },
  "Sikkim": { ta: "சிக்கிம்", hi: "सिक्किम" },
  "Tamil Nadu": { ta: "தமிழ்நாடு", hi: "तमिलनाडु" },
  "Telangana": { ta: "தெலங்காணா", hi: "तेलंगाना" },
  "Tripura": { ta: "திரிபுரா", hi: "त्रिपुरा" },
  "Uttar Pradesh": { ta: "உத்தரப் பிரதேசம்", hi: "उत्तर प्रदेश" },
  "Uttarakhand": { ta: "உத்தராகண்ட்", hi: "उत्तराखंड" },
  "West Bengal": { ta: "மேற்கு வங்காளம்", hi: "पश्चिम बंगाल" },
  // Union Territories
  "Andaman And Nicobar Islands": { ta: "அந்தமான் நிக்கோபார் தீவுகள்", hi: "अंडमान और निकोबार द्वीप समूह" },
  "Chandigarh": { ta: "சண்டிகர்", hi: "चंडीगढ़" },
  "Dadra And Nagar Haveli And Daman And Diu": { ta: "தாத்ரா நகர் அவேலி மற்றும் தமன் தியூ", hi: "दादरा और नगर हवेली और दमन और दीव" },
  "Delhi": { ta: "டெல்லி", hi: "दिल्ली" },
  "Jammu And Kashmir": { ta: "ஜம்மு காஷ்மீர்", hi: "जम्मू और कश्मीर" },
  "Ladakh": { ta: "லடாக்", hi: "लद्दाख" },
  "Lakshadweep": { ta: "லட்சத்தீவு", hi: "लक्षद्वीप" },
  "Puducherry": { ta: "புதுச்சேரி", hi: "पुदुचेरी" },
};

/**
 * Look up a curated translation for a place name. Falls back to the
 * original English name when no curated entry exists -- never guesses via
 * transliteration.
 */
export function getPlaceName(name, lang) {
  if (!name || lang === "en" || !lang) return name;
  const entry = STATE_NAMES[name] || STATE_NAMES[titleCase(name)];
  return entry?.[lang] || name;
}

function titleCase(str) {
  return String(str)
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bAnd\b/g, "And");
}

export const STATE_UT_COUNT = { states: 28, uts: 8, total: 36 };
