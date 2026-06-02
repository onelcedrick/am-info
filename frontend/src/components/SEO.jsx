// -*- coding: utf-8 -*-
import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title = 'AM Info', 
  description = 'Vente de materiel informatique et depannage technique a Madagascar. Ordinateurs, ecrans, imprimantes, pieces detachees.',
  keywords = 'informatique, Madagascar, depannage, ordinateur, ecran, imprimante, maintenance',
  image = '/og-image.png',
  url = '',
  type = 'website'
}) {
  const siteUrl = 'https://aminfo.mg';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullTitle = title.includes('AM Info') ? title : `${title} | AM Info`;

  return (
    <Helmet>
      {/* Balises de base */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="AM Info" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullUrl} />
      
      {/* Langue */}
      <meta httpEquiv="Content-Language" content="fr" />
      
      {/* Open Graph (Facebook, LinkedIn) */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="AM Info" />
      <meta property="og:locale" content="fr_MG" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Geo tags */}
      <meta name="geo.region" content="MG-T" />
      <meta name="geo.placename" content="Antananarivo" />
      <meta name="geo.position" content="-18.91368;47.53613" />
      <meta name="ICBM" content="-18.91368, 47.53613" />
    </Helmet>
  );
}
