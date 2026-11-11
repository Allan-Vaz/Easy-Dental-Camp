export const DEFAULT_TOOTH_DIAGNOSES = [
  {
    id: 'C_R',
    name: 'Deep Cavity',
    severity: 'Urgent',
    colorHex: '#E52629',
    adviceEn: 'Deep cavity detected. Immediate dental filling or root canal consultation advised to prevent pain and tooth loss.',
    adviceMr: 'तुमच्या पाल्याच्या दातांमध्ये खोल कीड सुरु झाली आहे. पुढील दुखापत व वेदना टाळण्यासाठी वेळीच सिमेंट भरणे (Filling) व उपचाराची गरज आहे.'
  },
  {
    id: 'C_Y',
    name: 'Early Decay',
    severity: 'Medium',
    colorHex: '#f59e0b',
    adviceEn: 'Early enamel decay noted. Preventive filling and fluoride therapy advised before decay progresses.',
    adviceMr: 'दातांवर सुरुवातीची कीड आढळली आहे. कीड वाढण्यापूर्वी प्रतिबंधक उपचार (Filling) करून घेणे हिताचे ठरेल.'
  },
  {
    id: 'M',
    name: 'Missing Tooth',
    severity: 'Medium',
    colorHex: '#1B2F5A',
    adviceEn: 'Missing tooth noted. Consult dentist for space maintainer or permanent tooth eruption check.',
    adviceMr: 'दात पडलेला / नसलेला आढळला आहे. कायमचा दात वेळेवर येण्यासाठी डॉक्टरांचा सल्ला घ्यावा.'
  },
  {
    id: 'R',
    name: 'Retained Milk Tooth',
    severity: 'Medium',
    colorHex: '#ea580c',
    adviceEn: 'Mobile or retained primary tooth noted. Pediatric extraction or evaluation advised.',
    adviceMr: 'दुधाचे दात हलत आहेत किंवा नवीन कायमचे दात येताना जागा कमी पडत आहे. योग्य मार्गदर्शनासाठी डॉक्टरांचा सल्ला घ्यावा.'
  }
];

export const DEFAULT_DIAGNOSES = [
  {
    id: 'cavities',
    labelEn: 'Cavities Detected',
    labelMr: 'किडलेले दात',
    defaultSeverity: 'Urgent',
    adviceEn: 'Cavities detected. Timely dental filling is recommended to prevent pain and root canal issues.',
    adviceMr: 'तुमच्या पाल्याच्या दातांमध्ये कीड सुरु झाली आहे. पुढील दुखापत व वेदना टाळण्यासाठी वेळीच सिमेंट भरणे (Filling) व उपचाराची गरज आहे.'
  },
  {
    id: 'tartar',
    labelEn: 'Tartar - Cleaning Needed',
    labelMr: 'पिवळे दात / टार्टर',
    defaultSeverity: 'Medium',
    adviceEn: 'Tartar buildup or yellowish plaque noted. Professional scaling and cleaning advised.',
    adviceMr: 'दातांवर पिवळी पुट (Tartar) साचली आहे. क्लिनिकमध्ये येऊन दातांची व्यावसायिक स्वच्छता (Scaling) करून घ्यावी.'
  },
  {
    id: 'alignment',
    labelEn: 'Braces / Alignment Needed',
    labelMr: 'वेडेवाकडे दात',
    defaultSeverity: 'Medium',
    adviceEn: 'Malaligned teeth. Orthodontic consultation for braces/aligners recommended.',
    adviceMr: 'दातांची रचना सरळ करण्यासाठी तज्ज्ञ ऑर्थोडॉन्टिस्टकडून (Braces/Aligners) तपासणी करून घ्यावी.'
  },
  {
    id: 'milk_tooth',
    labelEn: 'Retained / Mobile Milk Tooth',
    labelMr: 'हलणारे दुधाचे दात',
    defaultSeverity: 'Medium',
    adviceEn: 'Mobile or retained milk tooth observed. Pediatric dental consultation advised for proper eruption.',
    adviceMr: 'दुधाचे दात हलत आहेत किंवा नवीन कायमचे दात येताना जागा कमी पडत आहे. योग्य मार्गदर्शनासाठी डॉक्टरांचा सल्ला घ्यावा.'
  },
  {
    id: 'gums',
    labelEn: 'Gum Inflammation / Bleeding',
    labelMr: 'हिरड्यांची सूज / रक्त येणे',
    defaultSeverity: 'Medium',
    adviceEn: 'Gums are inflamed or bleeding on brushing. Proper gingival treatment is recommended.',
    adviceMr: 'हिरड्यांना सूज आहे किंवा ब्रश करताना रक्त येते. हिरड्यांच्या आरोग्यासाठी वेळेवर उपचार घेणे आवश्यक आहे.'
  },
  {
    id: 'stains',
    labelEn: 'Surface Stains / Discoloration',
    labelMr: 'दातांवर डाग',
    defaultSeverity: 'Medium',
    adviceEn: 'Surface discoloration or extrinsic staining noted. Professional polishing is recommended.',
    adviceMr: 'दातांवरील बाह्य डाग काढण्यासाठी पॉलिशिंग व स्वच्छतेची शिफारस केली जाते.'
  }
];

export const DEFAULT_RULE_GROUPS = [
  {
    id: 'RG_PRIMARY',
    name: 'Pre-Primary & Early Primary (Kids)',
    classes: ['Nursery', 'JRKG', 'SRKG', '1st-A', '2nd-A'],
    teethPerQuad: 5, // A, B, C, D, E
    activeToothDiagnoses: ['C_R', 'C_Y', 'R'],
    activeChecks: ['cavities', 'milk_tooth', 'gums']
  },
  {
    id: 'RG_MIDDLE',
    name: 'Upper Primary & Middle School',
    classes: ['3rd-A', '4th-B', '5th-A', '6th-A', '7th-A'],
    teethPerQuad: 6, // 1 to 6
    activeToothDiagnoses: ['C_R', 'C_Y', 'M', 'R'],
    activeChecks: ['cavities', 'tartar', 'alignment', 'milk_tooth', 'gums']
  },
  {
    id: 'RG_HIGH',
    name: 'High School & Junior College',
    classes: ['8th-A', '9th-A', '10th-A'],
    teethPerQuad: 7, // 1 to 7
    activeToothDiagnoses: ['C_R', 'C_Y', 'M'],
    activeChecks: ['cavities', 'tartar', 'alignment', 'gums', 'stains']
  }
];

export const ADVICE_TEMPLATES = {
  HEALTHY: {
    code: 'HEALTHY',
    label: 'Healthy Smile (Oral Hygiene Maintenance)',
    labelMr: 'निरोगी दात (दातांची निगा व सवयी)',
    labelEn: 'Healthy Smile (Routine Oral Habits)',
    textMr: 'अभिनंदन! तुमच्या पाल्याचे दात पूर्णपणे निरोगी आहेत. हे उत्तम आरोग्य टिकवण्यासाठी दिवसातून दोनदा (सकाळी व रात्री) ब्रश करा, गोड पदार्थ खाल्ल्यावर खळखळून गुळण्या करा आणि दर ६ महिन्यांनी दातांची नियमित तपासणी करा.',
    textEn: "Congratulations! Your child's teeth are completely healthy. To maintain this great oral health, brush twice daily (morning & night), rinse thoroughly after sweets, and continue routine 6-month dental checkups."
  },
  URG_FILL: {
    code: 'URG_FILL',
    label: 'Cavity Care & Dental Filling',
    labelMr: 'कीड प्रतिबंध व सिमेंट भरणे (Filling)',
    labelEn: 'Cavity Care & Dental Filling',
    textMr: 'तुमच्या पाल्याच्या दातांमध्ये कीड सुरु झाली आहे. पुढील दुखापत व वेदना टाळण्यासाठी वेळीच सिमेंट भरणे (Filling) व उपचाराची गरज आहे.',
    textEn: 'Cavities detected. Timely dental filling is recommended to prevent pain and root canal issues.'
  },
  CLEAN_ALIGN: {
    code: 'CLEAN_ALIGN',
    label: 'Tartar & Cleaning (Scaling)',
    labelMr: 'दातांची स्वच्छता व पॉलिशिंग (Scaling)',
    labelEn: 'Tartar Removal & Professional Cleaning',
    textMr: 'दातांवर पिवळी पुट (Tartar) साचली आहे. क्लिनिकमध्ये येऊन दातांची व्यावसायिक स्वच्छता (Scaling) करून घ्यावी.',
    textEn: 'Tartar buildup observed. Professional scaling and polishing advised to maintain gum health.'
  },
  BRACES_ALIGN: {
    code: 'BRACES_ALIGN',
    label: 'Orthodontic / Braces Consultation',
    labelMr: 'वेडेवाकडे दात (Braces तपासणी)',
    labelEn: 'Braces / Orthodontic Consultation',
    textMr: 'दातांची रचना सरळ करण्यासाठी तज्ज्ञ ऑर्थोडॉन्टिस्टकडून (Braces/Aligners) तपासणी करून घ्यावी.',
    textEn: 'Malaligned teeth observed. Orthodontic consultation for braces or aligners is recommended.'
  },
  MILK_CARE: {
    code: 'MILK_CARE',
    label: 'Pediatric / Milk Tooth Care',
    labelMr: 'दुधाच्या दातांची तपासणी (Pediatric Care)',
    labelEn: 'Retained Milk Tooth / Pediatric Consultation',
    textMr: 'दुधाचे दात हलत आहेत किंवा नवीन दात येताना जागा कमी पडत आहे. योग्य मार्गदर्शनासाठी डॉक्टरांचा सल्ला घ्यावा.',
    textEn: 'Mobile or retained milk tooth observed. Pediatric dental consultation advised for proper eruption.'
  },
  GUM_CARE: {
    code: 'GUM_CARE',
    label: 'Gum Inflammation Care',
    labelMr: 'हिरड्यांची काळजी व उपचार (Gum Care)',
    labelEn: 'Gum Inflammation & Periodontal Care',
    textMr: 'हिरड्यांना सूज आहे किंवा ब्रश करताना रक्त येते. हिरड्यांच्या आरोग्यासाठी वेळेवर उपचार व स्वच्छता घेणे आवश्यक आहे.',
    textEn: 'Gum inflammation or bleeding on brushing noted. Periodontal care and proper brushing technique advised.'
  }
};

export const DEFAULT_STAFF = [
  { id: 'stf_admin', username: 'admin', pin: '1234', role: 'admin', displayName: 'Allan Vaz (Admin)' },
  { id: 'stf_doc1', username: 'drkunal', pin: '4455', role: 'doctor', displayName: 'Dr. Kunal Shet' },
  { id: 'stf_asst1', username: 'assistant', pin: '1122', role: 'assistant', displayName: 'Camp Assistant' }
];

export const INITIAL_CAMPS = [
  {
    id: 'CMP_ADSV_2026',
    campCode: 'ADSV',
    instituteName: 'अशोक दादा साबळे विद्यालय, माणगाव',
    instituteNameEn: 'Ashok Dada Sable Vidyalaya, Mangaon',
    campDate: '2026-11-10',
    voucherExpiryDate: '2026-12-10',
    offerTextMarathi: 'मोफत कुटुंब तपासणी + ५०% सूट!',
    offerTextEnglish: 'FREE Family Consultation + 50% OFF Scaling & Cleaning for entire family',
    clinicPhone: '9545660336',
    clinicAddress: 'Trinity Plaza, Morba Road, Mangaon, Raigad',
    whatsappCustomUrl: '',
    schoolLogoData: '',
    avmLogoData: '',
    customQrData: '',
    mascotImageData: '',
    ruleGroups: DEFAULT_RULE_GROUPS,
    groups: [
      {
        id: '2nd-A',
        name: '2nd-A',
        teethPerQuad: 5,
        activeToothDiagnoses: ['C_R', 'C_Y', 'R'],
        activeChecks: ['cavities', 'milk_tooth', 'gums']
      },
      {
        id: '4th-B',
        name: '4th-B',
        teethPerQuad: 6,
        activeToothDiagnoses: ['C_R', 'C_Y', 'M', 'R'],
        activeChecks: ['cavities', 'tartar', 'alignment', 'milk_tooth', 'gums']
      },
      {
        id: '9th-A',
        name: '9th-A',
        teethPerQuad: 7,
        activeToothDiagnoses: ['C_R', 'C_Y', 'M'],
        activeChecks: ['cavities', 'tartar', 'alignment', 'gums', 'stains']
      }
    ]
  }
];

export const INITIAL_PATIENTS = [
  {
    id: 'CMP_ADSV_2026_4th-B_12',
    campId: 'CMP_ADSV_2026',
    groupId: '4th-B',
    rollNo: 12,
    name: 'Omkar Sachin Patil',
    age: 10,
    gender: 'M',
    status: 'checked',
    exam: {
      teeth: { UR4: 'C_R', LL5: 'C_R' },
      flags: ['cavities', 'tartar'],
      severity: 'R',
      noteCode: 'URG_FILL',
      customNote: '',
      checkedBy: 'Dr. Kunal Shet',
      updatedAt: '2026-11-10'
    }
  },
  {
    id: 'CMP_ADSV_2026_4th-B_13',
    campId: 'CMP_ADSV_2026',
    groupId: '4th-B',
    rollNo: 13,
    name: 'Swara Mangesh Sawant (स्वरा सावंत)',
    age: 10,
    gender: 'F',
    status: 'checked',
    exam: {
      teeth: { UL4: 'C_Y' },
      flags: ['cavities', 'alignment'],
      severity: 'Y',
      noteCode: 'CLEAN_ALIGN',
      customNote: '',
      checkedBy: 'Dr. Kunal Shet',
      updatedAt: '2026-11-10'
    }
  },
  {
    id: 'CMP_ADSV_2026_4th-B_14',
    campId: 'CMP_ADSV_2026',
    groupId: '4th-B',
    rollNo: 14,
    name: 'Aarav Pramod Pawar',
    age: 9,
    gender: 'M',
    status: 'checked',
    exam: {
      teeth: {},
      flags: [],
      severity: 'G',
      noteCode: 'HEALTHY',
      customNote: '',
      checkedBy: 'Dr. Kunal Shet',
      updatedAt: '2026-11-10'
    }
  },
  {
    id: 'CMP_ADSV_2026_4th-B_15',
    campId: 'CMP_ADSV_2026',
    groupId: '4th-B',
    rollNo: 15,
    name: 'Tanvi Sandeep Kadam (तन्वी कदम)',
    age: 10,
    gender: 'F',
    status: 'checked',
    exam: {
      teeth: { LR6: 'C_R', UL2: 'R' },
      flags: ['cavities', 'milk_tooth'],
      severity: 'R',
      noteCode: 'URG_FILL',
      customNote: 'Lower right molar needs deep filling.',
      checkedBy: 'Dr. Kunal Shet',
      updatedAt: '2026-11-10'
    }
  },
  {
    id: 'CMP_ADSV_2026_4th-B_16',
    campId: 'CMP_ADSV_2026',
    groupId: '4th-B',
    rollNo: 16,
    name: 'Rohan Santosh More',
    age: 10,
    gender: 'M',
    status: 'pending',
    exam: { teeth: {}, flags: [], severity: 'G', noteCode: 'HEALTHY', customNote: '' }
  },
  {
    id: 'CMP_ADSV_2026_4th-B_17',
    campId: 'CMP_ADSV_2026',
    groupId: '4th-B',
    rollNo: 17,
    name: 'Ananya Shinde',
    age: 9,
    gender: 'F',
    status: 'pending',
    exam: { teeth: {}, flags: [], severity: 'G', noteCode: 'HEALTHY', customNote: '' }
  },
  {
    id: 'CMP_ADSV_2026_2nd-A_1',
    campId: 'CMP_ADSV_2026',
    groupId: '2nd-A',
    rollNo: 1,
    name: 'Vedant Jadhav',
    age: 7,
    gender: 'M',
    status: 'checked',
    exam: {
      teeth: { URD: 'C_Y', LLE: 'C_R' },
      flags: ['cavities', 'milk_tooth'],
      severity: 'R',
      noteCode: 'MILK_CARE',
      customNote: '',
      checkedBy: 'Dr. Kunal Shet',
      updatedAt: '2026-11-10'
    }
  },
  {
    id: 'CMP_ADSV_2026_9th-A_1',
    campId: 'CMP_ADSV_2026',
    groupId: '9th-A',
    rollNo: 1,
    name: 'Sahil Deshmukh',
    age: 14,
    gender: 'M',
    status: 'checked',
    exam: {
      teeth: { LR6: 'C_Y' },
      flags: ['tartar', 'alignment'],
      severity: 'Y',
      noteCode: 'CLEAN_ALIGN',
      customNote: '',
      checkedBy: 'Dr. Kunal Shet',
      updatedAt: '2026-11-10'
    }
  }
];

export const DEFAULT_CLINIC_PROFILE = {
  id: 'clinic_avm_smiles',
  clinicName: 'AVM Smiles Dental Wellness',
  clinicAddress: 'Trinity Plaza, Morba Road, Mangaon, Raigad, Maharashtra',
  phone: '9545660336',
  whatsappNumber: '9545660336',
  customWaUrl: '',
  clinicLogoData: '',
  doctorSignData: '',
  doctorName: 'Dr. Kunal Shet',
  doctorRegNo: 'Reg. No. A-28491',
  defaultOfferMarathi: 'मोफत कुटुंब तपासणी + ५०% सूट!',
  defaultOfferEnglish: 'FREE Family Consultation + 50% OFF Scaling & Cleaning for entire family',
  defaultOfferEnglishLine1: 'FREE Family Consultation',
  defaultOfferEnglishLine2: '+ 50% OFF Scaling & Cleaning for entire family',
  defaultVoucherDays: 30,
  voucherPromoImageData: '',
  addressLine1: 'First Floor, Trinity Plaza',
  addressLine2: 'Morba Road, Mangaon',
  addressLine3: 'Raigad, Maharashtra',
  googleReviewsText: '4.8 Stars on Google Reviews',
  workingHours: '10:00 AM - 8:00 PM (Monday - Saturday)'
};

