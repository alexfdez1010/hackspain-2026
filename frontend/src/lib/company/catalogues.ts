/**
 * Famous companies a hashed identifier can be named after.
 *
 * The list is only a disguise for the anonymous `COMP_xxxx` identifiers of the
 * export; it is never sorted or searched, so its order is part of the contract:
 * appending keeps every existing name stable, inserting reshuffles them all.
 */
// prettier-ignore
export const COMPANY_NAMES: readonly string[] = [
  'Apple', 'Microsoft', 'Amazon', 'Alphabet', 'Meta', 'Tesla', 'Nvidia',
  'Netflix', 'Adobe', 'Salesforce', 'Oracle', 'IBM', 'Intel', 'Cisco',
  'Qualcomm', 'Broadcom', 'AMD', 'PayPal', 'Uber', 'Airbnb', 'Spotify',
  'Shopify', 'Zoom', 'Slack', 'Dropbox', 'Stripe', 'Square', 'Snap',
  'Pinterest', 'Reddit', 'Twitch', 'Coinbase', 'Robinhood', 'Palantir',
  'Snowflake', 'Datadog', 'Atlassian', 'GitHub', 'Figma', 'Notion', 'Canva',
  'Toyota', 'Honda', 'Nissan', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Audi',
  'Porsche', 'Ferrari', 'Ford', 'General Motors', 'Volvo', 'Renault',
  'Peugeot', 'SEAT', 'Hyundai', 'Kia', 'Boeing', 'Airbus', 'Rolls-Royce',
  'Coca-Cola', 'Pepsi', 'Nestlé', 'Danone', 'Unilever', 'Heineken',
  'Starbucks', 'McDonald’s', 'Burger King', 'Domino’s', 'Kellogg’s',
  'Mondelez', 'Red Bull', 'Estrella Damm', 'Mahou', 'Nike', 'Adidas', 'Puma',
  'Zara', 'Mango', 'Desigual', 'H&M', 'Uniqlo', 'Gucci', 'Prada', 'Chanel',
  'Hermès', 'Louis Vuitton', 'Rolex', 'Swatch', 'Ray-Ban', 'Levi’s',
  'IKEA', 'Lego', 'Nintendo', 'Sony', 'Samsung', 'LG', 'Panasonic', 'Philips',
  'Siemens', 'Bosch', 'Dyson', 'Xiaomi', 'Huawei', 'Lenovo', 'Dell', 'HP',
  'Canon', 'Nikon', 'GoPro', 'Garmin', 'Fitbit', 'Peloton',
  'Telefónica', 'Vodafone', 'Orange', 'Iberdrola', 'Endesa', 'Repsol',
  'Cepsa', 'Naturgy', 'Acciona', 'Ferrovial', 'ACS', 'Sacyr', 'Amadeus',
  'Inditex', 'Mercadona', 'El Corte Inglés', 'Iberia', 'Vueling', 'Renfe',
  'Cabify', 'Glovo', 'Wallapop', 'Idealista', 'Fotocasa', 'Privalia',
  'Typeform', 'Factorial', 'Freepik', 'Jobandtalent', 'Cabify Logistics',
  'Pfizer', 'Moderna', 'Novartis', 'Roche', 'Bayer', 'Grifols', 'Almirall',
  'Johnson & Johnson', 'AstraZeneca', 'Sanofi', 'GSK', '3M', 'Caterpillar',
  'John Deere', 'Honeywell', 'General Electric', 'Schneider Electric', 'ABB',
  'Shell', 'BP', 'TotalEnergies', 'ExxonMobil', 'Chevron', 'Ørsted',
  'Vestas', 'Siemens Gamesa', 'Walmart', 'Costco', 'Target', 'Carrefour',
  'Lidl', 'Aldi', 'Tesco', 'Decathlon', 'Leroy Merlin', 'FedEx', 'UPS',
  'DHL', 'Maersk', 'SEUR', 'Correos', 'Booking.com', 'Expedia', 'Tripadvisor',
  'Meliá', 'NH Hotels', 'Riu', 'Marriott', 'Hilton', 'Disney', 'Warner Bros',
  'Universal', 'Paramount', 'HBO', 'Pixar', 'Marvel', 'Atresmedia',
  'Mediaset', 'Movistar Plus', 'Duolingo', 'Coursera', 'Udemy', 'Evernote',
  'Trello', 'Asana', 'Monday.com', 'HubSpot', 'Mailchimp', 'Zendesk',
  'Intercom', 'Twilio', 'Cloudflare', 'Vercel', 'Supabase', 'MongoDB',
  'Elastic', 'Docker', 'Red Hat', 'VMware', 'SAP', 'ServiceNow', 'Workday',
];

/**
 * Famous corporate groups a hashed group identifier can be named after.
 *
 * Same contract as {@link COMPANY_NAMES}: append, never insert.
 */
// prettier-ignore
export const GROUP_NAMES: readonly string[] = [
  'Berkshire Hathaway', 'Alphabet Holdings', 'Grupo Inditex', 'LVMH',
  'Kering', 'Richemont', 'Mitsubishi Group', 'Mitsui', 'Sumitomo',
  'Tata Group', 'Reliance', 'Samsung Group', 'Hyundai Group', 'SoftBank',
  'Alibaba Group', 'Tencent', 'Grupo Mondragón', 'Grupo ACS', 'Grupo Ferrovial',
  'Grupo Planeta', 'Grupo Prisa', 'Grupo Antolin', 'Grupo Barceló',
  'Grupo Damm', 'Grupo Mahou San Miguel', 'Grupo Catalana Occidente',
  'Grupo Cosentino', 'Grupo Ebro', 'Grupo Lactalis', 'Grupo Bimbo',
  'Grupo Carso', 'Grupo Televisa', 'Grupo Modelo', 'Grupo Santander',
  'Grupo BBVA', 'CaixaBank Group', 'Grupo Sabadell', 'Grupo Mapfre',
  'Grupo Mutua', 'Allianz Group', 'AXA Group', 'Generali', 'Zurich Group',
  'Vinci', 'Bouygues', 'Eiffage', 'Saint-Gobain', 'Schneider Group',
  'Siemens Group', 'Bosch Group', 'ThyssenKrupp', 'Volkswagen Group',
  'Stellantis', 'Renault Group', 'Toyota Group', 'Honda Group', 'Nestlé Group',
  'Unilever Group', 'Procter & Gamble', 'Johnson & Johnson Group', 'Bayer Group',
  'Roche Group', 'Novartis Group', 'Pfizer Group', 'Merck Group',
  'Virgin Group', 'Tata Sons', 'Aditya Birla', 'Mahindra Group',
  'Jardine Matheson', 'Swire Group', 'CK Hutchison', 'Fosun', 'HNA Group',
  'Emaar', 'Al-Futtaim', 'Koç Holding', 'Sabancı Holding', 'Exor',
  'Agnelli Group', 'Benetton Group', 'Ferrero Group', 'Barilla Group',
  'Grupo Bimbo Iberia', 'Grupo Eulen', 'Grupo Konecta', 'Grupo Vips',
  'Grupo Día', 'Grupo Eroski', 'Grupo Alsea', 'Grupo Telepizza',
  'Grupo Iberostar', 'Grupo Piñero', 'Grupo Hotusa', 'Grupo Globalia',
  'Grupo Zena', 'Grupo Ybarra', 'Grupo Fuertes', 'Grupo Calvo',
  'Grupo Pescanova', 'Grupo Siro', 'Grupo Nueva Pescanova', 'Grupo Osborne',
  'Grupo Freixenet', 'Grupo Codorníu', 'Grupo Torres', 'Grupo Pascual',
  'Grupo Leche Pascual', 'Grupo Gallina Blanca', 'Grupo Ebro Foods',
  'Grupo Antolín Irausa', 'Grupo Gestamp', 'Grupo CIE', 'Grupo Sener',
  'Grupo Idom', 'Grupo Typsa', 'Grupo Ayesa', 'Grupo Tragsa', 'Grupo Ineco',
  'Grupo Indra', 'Grupo Amper', 'Grupo Cellnex', 'Grupo MásMóvil',
  'Grupo Euskaltel', 'Grupo Ezentis', 'Grupo Sacyr', 'Grupo OHLA',
  'Grupo FCC', 'Grupo Acciona', 'Grupo Abengoa', 'Grupo Elecnor',
];
