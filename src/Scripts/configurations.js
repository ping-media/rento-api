// language Settings 

db.getCollection("configurations").insert({
    name: 'language_settings',
    types: {
        data:  [
    { language: 'arabic', shortform: 'ar' },
    { language: 'bengali', shortform: 'bn' },
    { language: 'chinese', shortform: 'zh' },
    { language: 'czech', shortform: 'cs' },
    { language: 'danish', shortform: 'da' },
    { language: 'dutch', shortform: 'nl' },
    { language: 'english', shortform: 'en' },
    { language: 'farsi', shortform: 'fa' },
    { language: 'finnish', shortform: 'fi' },
    { language: 'french', shortform: 'fr' },
    { language: 'german', shortform: 'de' },
    { language: 'greek', shortform: 'el' },
    { language: 'hebrew', shortform: 'he' },
    { language: 'hindi', shortform: 'hi' },
    { language: 'hungarian', shortform: 'hu' },
    { language: 'indonesian', shortform: 'id' },
    { language: 'italian', shortform: 'it' },
    { language: 'japanese', shortform: 'ja' },
    { language: 'korean', shortform: 'ko' },
    { language: 'malay', shortform: 'ms' },
    { language: 'norwegian', shortform: 'no' },
    { language: 'polish', shortform: 'pl' },
    { language: 'portuguese', shortform: 'pt' },
    { language: 'punjabi', shortform: 'pa' },
    { language: 'romanian', shortform: 'ro' },
    { language: 'russian', shortform: 'ru' },
    { language: 'serbian', shortform: 'sr' },
    { language: 'slovak', shortform: 'sk' },
    { language: 'slovenian', shortform: 'sl' },
    { language: 'spanish', shortform: 'es' },
    { language: 'swahili', shortform: 'sw' },
    { language: 'swedish', shortform: 'sv' },
    { language: 'tagalog', shortform: 'tl' },
    { language: 'tamil', shortform: 'ta' },
    { language: 'telugu', shortform: 'te' },
    { language: 'thai', shortform: 'th' },
    { language: 'turkish', shortform: 'tr' },
    { language: 'ukrainian', shortform: 'uk' },
    { language: 'urdu', shortform: 'ur' },
    { language: 'vietnamese', shortform: 'vi' },
    { language: 'yoruba', shortform: 'yo' },
    { language: 'zulu', shortform: 'zu' }
  ]
}     
})

// time zone


const timezone ={
  "_id" : ObjectId("63a191008aae9a6111b9668a"),
  "name" : "timezones",
  "types" : [
      {
          "name" : "Pacific/Midway",
          "nameWithOffset" : "(-11:00) Midway Island",
          "abbreviation" : "SST",
          "offset" : -11.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b3f6")
      },
      {
          "name" : "Pacific/Pago_Pago",
          "nameWithOffset" : "(-11:00) American Samoa",
          "abbreviation" : "SST",
          "offset" : -11.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b3f7")
      },
      {
          "name" : "Pacific/Midway",
          "nameWithOffset" : "(-11:00) International Date Line West",
          "abbreviation" : "SST",
          "offset" : -11.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b3f8")
      },
      {
          "name" : "Pacific/Honolulu",
          "nameWithOffset" : "(-10:00) Hawaii",
          "abbreviation" : "HST",
          "offset" : -10.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b3f9")
      },
      {
          "name" : "America/Juneau",
          "nameWithOffset" : "(-09:00) Alaska",
          "abbreviation" : "AKST",
          "offset" : -9.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b3fa")
      },
      {
          "name" : "America/Los_Angeles",
          "nameWithOffset" : "(-08:00) Pacific Time (US & Canada",
          "abbreviation" : "PST",
          "offset" : -8.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b3fb")
      },
      {
          "name" : "America/Tijuana",
          "nameWithOffset" : "(-08:00) Tijuana",
          "abbreviation" : "PST",
          "offset" : -8.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b3fc")
      },
      {
          "name" : "America/Phoenix",
          "nameWithOffset" : "(-07:00) Arizona",
          "abbreviation" : "MST",
          "offset" : -7.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b3fd")
      },
      {
          "name" : "America/Denver",
          "nameWithOffset" : "(-07:00) Mountain Time (US & Canada",
          "abbreviation" : "MST",
          "offset" : -7.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b3fe")
      },
      {
          "name" : "America/Mazatlan",
          "nameWithOffset" : "(-07:00) Mazatlan",
          "abbreviation" : "MST",
          "offset" : -7.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b3ff")
      },
      {
          "name" : "America/Chihuahua",
          "nameWithOffset" : "(-07:00) Chihuahua",
          "abbreviation" : "MST",
          "offset" : -7.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b400")
      },
      {
          "name" : "America/Monterrey",
          "nameWithOffset" : "(-06:00) Monterrey",
          "abbreviation" : "CST",
          "offset" : -6.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b401")
      },
      {
          "name" : "America/Regina",
          "nameWithOffset" : "(-06:00) Saskatchewan",
          "abbreviation" : "CST",
          "offset" : -6.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b402")
      },
      {
          "name" : "America/Mexico_City",
          "nameWithOffset" : "(-06:00) Mexico City",
          "abbreviation" : "CST",
          "offset" : -6.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b403")
      },
      {
          "name" : "America/Guatemala",
          "nameWithOffset" : "(-06:00) Central America",
          "abbreviation" : "CST",
          "offset" : -6.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b404")
      },
      {
          "name" : "America/Mexico_City",
          "nameWithOffset" : "(-06:00) Guadalajara",
          "abbreviation" : "CST",
          "offset" : -6.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b405")
      },
      {
          "name" : "America/Chicago",
          "nameWithOffset" : "(-06:00) Central Time (US & Canada",
          "abbreviation" : "CST",
          "offset" : -6.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b406")
      },
      {
          "name" : "America/Indiana/Indianapolis",
          "nameWithOffset" : "(-05:00) Indiana (East)",
          "abbreviation" : "EST",
          "offset" : -5.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b407")
      },
      {
          "name" : "America/Lima",
          "nameWithOffset" : "(-05:00) Quito",
          "abbreviation" : "PET",
          "offset" : -5.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b408")
      },
      {
          "name" : "America/New_York",
          "nameWithOffset" : "(-05:00) Eastern Time (US & Canada)",
          "abbreviation" : "EST",
          "offset" : -5.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b409")
      },
      {
          "name" : "America/Bogota",
          "nameWithOffset" : "(-05:00) Bogota",
          "abbreviation" : "COT",
          "offset" : -5.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b40a")
      },
      {
          "name" : "America/Lima",
          "nameWithOffset" : "(-05:00) Lima",
          "abbreviation" : "PET",
          "offset" : -5.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b40b")
      },
      {
          "name" : "America/Guyana",
          "nameWithOffset" : "(-04:00) Georgetown",
          "abbreviation" : "GYT",
          "offset" : -4.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b40c")
      },
      {
          "name" : "America/La_Paz",
          "nameWithOffset" : "(-04:00) La Paz",
          "abbreviation" : "BOT",
          "offset" : -4.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b40d")
      },
      {
          "name" : "America/Caracas",
          "nameWithOffset" : "(-04:00) Caracas",
          "abbreviation" : "VET",
          "offset" : -4.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b40e")
      },
      {
          "name" : "America/Halifax",
          "nameWithOffset" : "(-04:00) Atlantic Time (Canada)",
          "abbreviation" : "AST",
          "offset" : -4.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b40f")
      },
      {
          "name" : "America/St_Johns",
          "nameWithOffset" : "(-03:30) Newfoundland",
          "abbreviation" : "NST",
          "offset" : -3.5,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b410")
      },
      {
          "name" : "America/Santiago",
          "nameWithOffset" : "(-03:00) Santiago",
          "abbreviation" : "CLST",
          "offset" : -3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b411")
      },
      {
          "name" : "America/Argentina/Buenos_Aires",
          "nameWithOffset" : "(-03:00) Buenos Aires",
          "abbreviation" : "ART",
          "offset" : -3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b412")
      },
      {
          "name" : "America/Sao_Paulo",
          "nameWithOffset" : "(-03:00) Brasilia",
          "abbreviation" : "BRT",
          "offset" : -3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b413")
      },
      {
          "name" : "America/Montevideo",
          "nameWithOffset" : "(-03:00) Montevideo",
          "abbreviation" : "UYT",
          "offset" : -3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b414")
      },
      {
          "name" : "America/Godthab",
          "nameWithOffset" : "(-03:00) Greenland",
          "abbreviation" : "WGT",
          "offset" : -3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b415")
      },
      {
          "name" : "Atlantic/South_Georgia",
          "nameWithOffset" : "(-02:00) Mid-Atlantic",
          "abbreviation" : "GST",
          "offset" : -2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b416")
      },
      {
          "name" : "Atlantic/Cape_Verde",
          "nameWithOffset" : "(-01:00) Cape Verde Is.",
          "abbreviation" : "CVT",
          "offset" : -1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b417")
      },
      {
          "name" : "Atlantic/Azores",
          "nameWithOffset" : "(-01:00) Azores",
          "abbreviation" : "AZOT",
          "offset" : -1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b418")
      },
      {
          "name" : "Europe/Lisbon",
          "nameWithOffset" : "(-00:00) Lisbon",
          "abbreviation" : "WET",
          "offset" : 0.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b419")
      },
      {
          "name" : "Europe/London",
          "nameWithOffset" : "(-00:00) London",
          "abbreviation" : "GMT",
          "offset" : 0.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b41a")
      },
      {
          "name" : "Etc/UTC",
          "nameWithOffset" : "(-00:00) UTC",
          "abbreviation" : "UTC",
          "offset" : 0.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b41b")
      },
      {
          "name" : "Europe/Dublin",
          "nameWithOffset" : "(-00:00) Dublin",
          "abbreviation" : "GMT",
          "offset" : 0.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b41c")
      },
      {
          "name" : "Europe/London",
          "nameWithOffset" : "(-00:00) Edinburgh",
          "abbreviation" : "GMT",
          "offset" : 0.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b41d")
      },
      {
          "name" : "Africa/Monrovia",
          "nameWithOffset" : "(-00:00) Monrovia",
          "abbreviation" : "GMT",
          "offset" : 0.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b41e")
      },
      {
          "name" : "Europe/Belgrade",
          "nameWithOffset" : "(+01:00) Belgrade",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b41f")
      },
      {
          "name" : "Africa/Casablanca",
          "nameWithOffset" : "(+01:00) Casablanca",
          "abbreviation" : "WEST",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b420")
      },
      {
          "name" : "Europe/Copenhagen",
          "nameWithOffset" : "(+01:00) Copenhagen",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b421")
      },
      {
          "name" : "Africa/Algiers",
          "nameWithOffset" : "(+01:00) West Central Africa",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b422")
      },
      {
          "name" : "Europe/Warsaw",
          "nameWithOffset" : "(+01:00) Warsaw",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b423")
      },
      {
          "name" : "Europe/Budapest",
          "nameWithOffset" : "(+01:00) Budapest",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b424")
      },
      {
          "name" : "Europe/Madrid",
          "nameWithOffset" : "(+01:00) Madrid",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b425")
      },
      {
          "name" : "Europe/Amsterdam",
          "nameWithOffset" : "(+01:00) Amsterdam",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b426")
      },
      {
          "name" : "Europe/Rome",
          "nameWithOffset" : "(+01:00) Rome",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b427")
      },
      {
          "name" : "Europe/Zagreb",
          "nameWithOffset" : "(+01:00) Zagreb",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b428")
      },
      {
          "name" : "Europe/Sarajevo",
          "nameWithOffset" : "(+01:00) Sarajevo",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b429")
      },
      {
          "name" : "Europe/Brussels",
          "nameWithOffset" : "(+01:00) Brussels",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b42a")
      },
      {
          "name" : "Europe/Berlin",
          "nameWithOffset" : "(+01:00) Berlin",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b42b")
      },
      {
          "name" : "Europe/Bratislava",
          "nameWithOffset" : "(+01:00) Bratislava",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b42c")
      },
      {
          "name" : "Europe/Stockholm",
          "nameWithOffset" : "(+01:00) Stockholm",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b42d")
      },
      {
          "name" : "Europe/Prague",
          "nameWithOffset" : "(+01:00) Prague",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b42e")
      },
      {
          "name" : "Europe/Berlin",
          "nameWithOffset" : "(+01:00) Bern",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b42f")
      },
      {
          "name" : "Europe/Vienna",
          "nameWithOffset" : "(+01:00) Vienna",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b430")
      },
      {
          "name" : "Europe/Ljubljana",
          "nameWithOffset" : "(+01:00) Ljubljana",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b431")
      },
      {
          "name" : "Europe/Skopje",
          "nameWithOffset" : "(+01:00) Skopje",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b432")
      },
      {
          "name" : "Europe/Paris",
          "nameWithOffset" : "(+01:00) Paris",
          "abbreviation" : "CET",
          "offset" : 1.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b433")
      },
      {
          "name" : "Europe/Bucharest",
          "nameWithOffset" : "(+02:00) Bucharest",
          "abbreviation" : "EET",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b434")
      },
      {
          "name" : "Europe/Kiev",
          "nameWithOffset" : "(+02:00) Kyiv",
          "abbreviation" : "EET",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b435")
      },
      {
          "name" : "Europe/Athens",
          "nameWithOffset" : "(+02:00) Athens",
          "abbreviation" : "EET",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b436")
      },
      {
          "name" : "Africa/Harare",
          "nameWithOffset" : "(+02:00) Harare",
          "abbreviation" : "CAT",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b437")
      },
      {
          "name" : "Europe/Riga",
          "nameWithOffset" : "(+02:00) Riga",
          "abbreviation" : "EET",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b438")
      },
      {
          "name" : "Europe/Helsinki",
          "nameWithOffset" : "(+02:00) Helsinki",
          "abbreviation" : "EET",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b439")
      },
      {
          "name" : "Asia/Jerusalem",
          "nameWithOffset" : "(+02:00) Jerusalem",
          "abbreviation" : "IST",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b43a")
      },
      {
          "name" : "Europe/Vilnius",
          "nameWithOffset" : "(+02:00) Vilnius",
          "abbreviation" : "EET",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b43b")
      },
      {
          "name" : "Europe/Sofia",
          "nameWithOffset" : "(+02:00) Sofia",
          "abbreviation" : "EET",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b43c")
      },
      {
          "name" : "Europe/Tallinn",
          "nameWithOffset" : "(+02:00) Tallinn",
          "abbreviation" : "EET",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b43d")
      },
      {
          "name" : "Africa/Johannesburg",
          "nameWithOffset" : "(+02:00) Pretoria",
          "abbreviation" : "SAST",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b43e")
      },
      {
          "name" : "Africa/Cairo",
          "nameWithOffset" : "(+02:00) Cairo",
          "abbreviation" : "EET",
          "offset" : 2.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b43f")
      },
      {
          "name" : "Europe/Istanbul",
          "nameWithOffset" : "(+03:00) Istanbul",
          "abbreviation" : "TRT",
          "offset" : 3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b440")
      },
      {
          "name" : "Europe/Moscow",
          "nameWithOffset" : "(+03:00) St. Petersburg",
          "abbreviation" : "MSK",
          "offset" : 3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b441")
      },
      {
          "name" : "Europe/Moscow",
          "nameWithOffset" : "(+03:00) Moscow",
          "abbreviation" : "MSK",
          "offset" : 3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b442")
      },
      {
          "name" : "Asia/Kuwait",
          "nameWithOffset" : "(+03:00) Kuwait",
          "abbreviation" : "AST",
          "offset" : 3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b443")
      },
      {
          "name" : "Europe/Minsk",
          "nameWithOffset" : "(+03:00) Minsk",
          "abbreviation" : "MSK",
          "offset" : 3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b444")
      },
      {
          "name" : "Europe/Moscow",
          "nameWithOffset" : "(+03:00) Volgograd",
          "abbreviation" : "MSK",
          "offset" : 3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b445")
      },
      {
          "name" : "Asia/Riyadh",
          "nameWithOffset" : "(+03:00) Riyadh",
          "abbreviation" : "AST",
          "offset" : 3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b446")
      },
      {
          "name" : "Africa/Nairobi",
          "nameWithOffset" : "(+03:00) Nairobi",
          "abbreviation" : "EAT",
          "offset" : 3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b447")
      },
      {
          "name" : "Asia/Baghdad",
          "nameWithOffset" : "(+03:00) Baghdad",
          "abbreviation" : "AST",
          "offset" : 3.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b448")
      },
      {
          "name" : "Asia/Tehran",
          "nameWithOffset" : "(+03:30) Tehran",
          "abbreviation" : "IRST",
          "offset" : 3.5,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b449")
      },
      {
          "name" : "Asia/Baku",
          "nameWithOffset" : "(+04:00) Baku",
          "abbreviation" : "AZT",
          "offset" : 4.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b44a")
      },
      {
          "name" : "Asia/Muscat",
          "nameWithOffset" : "(+04:00) Abu Dhabi",
          "abbreviation" : "GST",
          "offset" : 4.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b44b")
      },
      {
          "name" : "Asia/Muscat",
          "nameWithOffset" : "(+04:00) Muscat",
          "abbreviation" : "GST",
          "offset" : 4.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b44c")
      },
      {
          "name" : "Asia/Tbilisi",
          "nameWithOffset" : "(+04:00) Tbilisi",
          "abbreviation" : "GET",
          "offset" : 4.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b44d")
      },
      {
          "name" : "Asia/Yerevan",
          "nameWithOffset" : "(+04:00) Yerevan",
          "abbreviation" : "AMT",
          "offset" : 4.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b44e")
      },
      {
          "name" : "Asia/Kabul",
          "nameWithOffset" : "(+04:30) Kabul",
          "abbreviation" : "AFT",
          "offset" : 4.5,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b44f")
      },
      {
          "name" : "Asia/Tashkent",
          "nameWithOffset" : "(+05:00) Tashkent",
          "abbreviation" : "UZT",
          "offset" : 5.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b450")
      },
      {
          "name" : "Asia/Karachi",
          "nameWithOffset" : "(+05:00) Karachi",
          "abbreviation" : "PKT",
          "offset" : 5.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b451")
      },
      {
          "name" : "Asia/Karachi",
          "nameWithOffset" : "(+05:00) Islamabad",
          "abbreviation" : "PKT",
          "offset" : 5.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b452")
      },
      {
          "name" : "Asia/Yekaterinburg",
          "nameWithOffset" : "(+05:00) Ekaterinburg",
          "abbreviation" : "YEKT",
          "offset" : 5.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b453")
      },
      {
          "name" : "Asia/Kolkata",
          "nameWithOffset" : "(+05:30) Chennai",
          "abbreviation" : "IST",
          "offset" : 5.5,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b454")
      },
      {
          "name" : "Asia/Kolkata",
          "nameWithOffset" : "(+05:30) Mumbai",
          "abbreviation" : "IST",
          "offset" : 5.5,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b455")
      },
      {
          "name" : "Asia/Kolkata",
          "nameWithOffset" : "(+05:30) Kolkata",
          "abbreviation" : "IST",
          "offset" : 5.5,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b456")
      },
      {
          "name" : "Asia/Kolkata",
          "nameWithOffset" : "(+05:30) New Delhi",
          "abbreviation" : "IST",
          "offset" : 5.5,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b457")
      },
      {
          "name" : "Asia/Colombo",
          "nameWithOffset" : "(+05:30) Sri Jayawardenepura",
          "abbreviation" : "IST",
          "offset" : 5.5,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b458")
      },
      {
          "name" : "Asia/Kathmandu",
          "nameWithOffset" : "(+05:45) Kathmandu",
          "abbreviation" : "NPT",
          "offset" : 5.75,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b459")
      },
      {
          "name" : "Asia/Dhaka",
          "nameWithOffset" : "(+06:00) Astana",
          "abbreviation" : "BDT",
          "offset" : 6.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b45a")
      },
      {
          "name" : "Asia/Urumqi",
          "nameWithOffset" : "(+06:00) Urumqi",
          "abbreviation" : "XJT",
          "offset" : 6.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b45b")
      },
      {
          "name" : "Asia/Dhaka",
          "nameWithOffset" : "(+06:00) Dhaka",
          "abbreviation" : "BDT",
          "offset" : 6.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b45c")
      },
      {
          "name" : "Asia/Almaty",
          "nameWithOffset" : "(+06:00) Almaty",
          "abbreviation" : "ALMT",
          "offset" : 6.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b45d")
      },
      {
          "name" : "Asia/Rangoon",
          "nameWithOffset" : "(+06:30) Rangoon",
          "abbreviation" : "MMT",
          "offset" : 6.5,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b45e")
      },
      {
          "name" : "Asia/Bangkok",
          "nameWithOffset" : "(+07:00) Hanoi",
          "abbreviation" : "ICT",
          "offset" : 7.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b45f")
      },
      {
          "name" : "Asia/Bangkok",
          "nameWithOffset" : "(+07:00) Bangkok",
          "abbreviation" : "ICT",
          "offset" : 7.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b460")
      },
      {
          "name" : "Asia/Jakarta",
          "nameWithOffset" : "(+07:00) Jakarta",
          "abbreviation" : "WIB",
          "offset" : 7.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b461")
      },
      {
          "name" : "Asia/Novosibirsk",
          "nameWithOffset" : "(+07:00) Novosibirsk",
          "abbreviation" : "NOVT",
          "offset" : 7.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b462")
      },
      {
          "name" : "Asia/Krasnoyarsk",
          "nameWithOffset" : "(+07:00) Krasnoyarsk",
          "abbreviation" : "KRAT",
          "offset" : 7.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b463")
      },
      {
          "name" : "Asia/Shanghai",
          "nameWithOffset" : "(+08:00) Beijing",
          "abbreviation" : "CST",
          "offset" : 8.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b464")
      },
      {
          "name" : "Asia/Irkutsk",
          "nameWithOffset" : "(+08:00) Irkutsk",
          "abbreviation" : "IRKT",
          "offset" : 8.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b465")
      },
      {
          "name" : "Asia/Hong_Kong",
          "nameWithOffset" : "(+08:00) Hong Kong",
          "abbreviation" : "HKT",
          "offset" : 8.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b466")
      },
      {
          "name" : "Asia/Ulaanbaatar",
          "nameWithOffset" : "(+08:00) Ulaanbaatar",
          "abbreviation" : "ULAT",
          "offset" : 8.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b467")
      },
      {
          "name" : "Australia/Perth",
          "nameWithOffset" : "(+08:00) Perth",
          "abbreviation" : "AWST",
          "offset" : 8.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b468")
      },
      {
          "name" : "Asia/Singapore",
          "nameWithOffset" : "(+08:00) Singapore",
          "abbreviation" : "SGT",
          "offset" : 8.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b469")
      },
      {
          "name" : "Asia/Taipei",
          "nameWithOffset" : "(+08:00) Taipei",
          "abbreviation" : "CST",
          "offset" : 8.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b46a")
      },
      {
          "name" : "Asia/Kuala_Lumpur",
          "nameWithOffset" : "(+08:00) Kuala Lumpur",
          "abbreviation" : "MYT",
          "offset" : 8.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b46b")
      },
      {
          "name" : "Asia/Chongqing",
          "nameWithOffset" : "(+08:00) Chongqing",
          "abbreviation" : "CST",
          "offset" : 8.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b46c")
      },
      {
          "name" : "Asia/Yakutsk",
          "nameWithOffset" : "(+09:00) Yakutsk",
          "abbreviation" : "YAKT",
          "offset" : 9.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b46d")
      },
      {
          "name" : "Asia/Seoul",
          "nameWithOffset" : "(+09:00) Seoul",
          "abbreviation" : "KST",
          "offset" : 9.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b46e")
      },
      {
          "name" : "Asia/Tokyo",
          "nameWithOffset" : "(+09:00) Osaka",
          "abbreviation" : "JST",
          "offset" : 9.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b46f")
      },
      {
          "name" : "Asia/Tokyo",
          "nameWithOffset" : "(+09:00) Tokyo",
          "abbreviation" : "JST",
          "offset" : 9.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b470")
      },
      {
          "name" : "Asia/Tokyo",
          "nameWithOffset" : "(+09:00) Sapporo",
          "abbreviation" : "JST",
          "offset" : 9.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b471")
      },
      {
          "name" : "Australia/Darwin",
          "nameWithOffset" : "(+09:30) Darwin",
          "abbreviation" : "ACST",
          "offset" : 9.5,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b472")
      },
      {
          "name" : "Pacific/Port_Moresby",
          "nameWithOffset" : "(+10:00) Port Moresby",
          "abbreviation" : "PGT",
          "offset" : 10.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b473")
      },
      {
          "name" : "Asia/Vladivostok",
          "nameWithOffset" : "(+10:00) Vladivostok",
          "abbreviation" : "VLAT",
          "offset" : 10.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b474")
      },
      {
          "name" : "Australia/Brisbane",
          "nameWithOffset" : "(+10:00) Brisbane",
          "abbreviation" : "AEST",
          "offset" : 10.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b475")
      },
      {
          "name" : "Pacific/Guam",
          "nameWithOffset" : "(+10:00) Guam",
          "abbreviation" : "ChST",
          "offset" : 10.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b476")
      },
      {
          "name" : "Australia/Adelaide",
          "nameWithOffset" : "(+10:30) Adelaide",
          "abbreviation" : "ACDT",
          "offset" : 10.5,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b477")
      },
      {
          "name" : "Pacific/Noumea",
          "nameWithOffset" : "(+11:00) New Caledonia",
          "abbreviation" : "NCT",
          "offset" : 11.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b478")
      },
      {
          "name" : "Australia/Melbourne",
          "nameWithOffset" : "(+11:00) Canberra",
          "abbreviation" : "AEDT",
          "offset" : 11.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b479")
      },
      {
          "name" : "Australia/Sydney",
          "nameWithOffset" : "(+11:00) Sydney",
          "abbreviation" : "AEDT",
          "offset" : 11.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b47a")
      },
      {
          "name" : "Pacific/Guadalcanal",
          "nameWithOffset" : "(+11:00) Solomon Is.",
          "abbreviation" : "SBT",
          "offset" : 11.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b47b")
      },
      {
          "name" : "Australia/Hobart",
          "nameWithOffset" : "(+11:00) Hobart",
          "abbreviation" : "AEDT",
          "offset" : 11.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b47c")
      },
      {
          "name" : "Australia/Melbourne",
          "nameWithOffset" : "(+11:00) Melbourne",
          "abbreviation" : "AEDT",
          "offset" : 11.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b47d")
      },
      {
          "name" : "Asia/Magadan",
          "nameWithOffset" : "(+11:00) Magadan",
          "abbreviation" : "MAGT",
          "offset" : 11.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b47e")
      },
      {
          "name" : "Asia/Kamchatka",
          "nameWithOffset" : "(+12:00) Kamchatka",
          "abbreviation" : "PETT",
          "offset" : 12.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b47f")
      },
      {
          "name" : "Pacific/Majuro",
          "nameWithOffset" : "(+12:00) Marshall Is.",
          "abbreviation" : "MHT",
          "offset" : 12.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b480")
      },
      {
          "name" : "Pacific/Auckland",
          "nameWithOffset" : "(+13:00) Wellington",
          "abbreviation" : "NZDT",
          "offset" : 13.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b481")
      },
      {
          "name" : "Pacific/Fiji",
          "nameWithOffset" : "(+13:00) Fiji",
          "abbreviation" : "FJST",
          "offset" : 13.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b482")
      },
      {
          "name" : "Pacific/Apia",
          "nameWithOffset" : "(+13:00) Samoa",
          "abbreviation" : "WSST",
          "offset" : 13.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b483")
      },
      {
          "name" : "Pacific/Tongatapu",
          "nameWithOffset" : "(+13:00) Nuku'alofa",
          "abbreviation" : "TOT",
          "offset" : 13.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b484")
      },
      {
          "name" : "Pacific/Fakaofo",
          "nameWithOffset" : "(+13:00) Tokelau Is.",
          "abbreviation" : "TKT",
          "offset" : 13.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b485")
      },
      {
          "name" : "Pacific/Auckland",
          "nameWithOffset" : "(+13:00) Auckland",
          "abbreviation" : "NZDT",
          "offset" : 13.0,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b486")
      },
      {
          "name" : "Pacific/Chatham",
          "nameWithOffset" : "(+13:45) Chatham Is.",
          "abbreviation" : "CHADT",
          "offset" : 13.75,
          "reference_id" : ObjectId("63a18dc42a98dd6afac2b487")
      }
  ]
}


//  language Settings

const data ={
  "_id" : ObjectId("63ec47f1f58b2fd2360d271b"),
  "name" : "language_settings",
  "types" : {
      "data" : [
          {
              "language" : "arabic",
              "shortform" : "ar"
          },
          {
              "language" : "bengali",
              "shortform" : "bn"
          },
          {
              "language" : "chinese",
              "shortform" : "zh"
          },
          {
              "language" : "czech",
              "shortform" : "cs"
          },
          {
              "language" : "danish",
              "shortform" : "da"
          },
          {
              "language" : "dutch",
              "shortform" : "nl"
          },
          {
              "language" : "english",
              "shortform" : "en"
          },
          {
              "language" : "farsi",
              "shortform" : "fa"
          },
          {
              "language" : "finnish",
              "shortform" : "fi"
          },
          {
              "language" : "french",
              "shortform" : "fr"
          },
          {
              "language" : "german",
              "shortform" : "de"
          },
          {
              "language" : "greek",
              "shortform" : "el"
          },
          {
              "language" : "hebrew",
              "shortform" : "he"
          },
          {
              "language" : "hindi",
              "shortform" : "hi"
          },
          {
              "language" : "hungarian",
              "shortform" : "hu"
          },
          {
              "language" : "indonesian",
              "shortform" : "id"
          },
          {
              "language" : "italian",
              "shortform" : "it"
          },
          {
              "language" : "japanese",
              "shortform" : "ja"
          },
          {
              "language" : "korean",
              "shortform" : "ko"
          },
          {
              "language" : "malay",
              "shortform" : "ms"
          },
          {
              "language" : "norwegian",
              "shortform" : "no"
          },
          {
              "language" : "polish",
              "shortform" : "pl"
          },
          {
              "language" : "portuguese",
              "shortform" : "pt"
          },
          {
              "language" : "punjabi",
              "shortform" : "pa"
          },
          {
              "language" : "romanian",
              "shortform" : "ro"
          },
          {
              "language" : "russian",
              "shortform" : "ru"
          },
          {
              "language" : "serbian",
              "shortform" : "sr"
          },
          {
              "language" : "slovak",
              "shortform" : "sk"
          },
          {
              "language" : "slovenian",
              "shortform" : "sl"
          },
          {
              "language" : "spanish",
              "shortform" : "es"
          },
          {
              "language" : "swahili",
              "shortform" : "sw"
          },
          {
              "language" : "swedish",
              "shortform" : "sv"
          },
          {
              "language" : "tagalog",
              "shortform" : "tl"
          },
          {
              "language" : "tamil",
              "shortform" : "ta"
          },
          {
              "language" : "telugu",
              "shortform" : "te"
          },
          {
              "language" : "thai",
              "shortform" : "th"
          },
          {
              "language" : "turkish",
              "shortform" : "tr"
          },
          {
              "language" : "ukrainian",
              "shortform" : "uk"
          },
          {
              "language" : "urdu",
              "shortform" : "ur"
          },
          {
              "language" : "vietnamese",
              "shortform" : "vi"
          },
          {
              "language" : "yoruba",
              "shortform" : "yo"
          },
          {
              "language" : "zulu",
              "shortform" : "zu"
          }
      ]
  }
}