import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * StructuredData Component
 * 
 * Renders JSON-LD structured data for rich search results
 * Supports all schema.org types
 * 
 * @param {Object} props
 * @param {Object|Array} props.data - Schema.org structured data object(s)
 * @param {string} props.type - Optional schema type for validation
 */
export default function StructuredData({ data }) {
  if (!data) {
    console.warn('StructuredData: No data provided');
    return null;
  }

  // Handle multiple schemas
  const schemas = Array.isArray(data) ? data : [data];
  const cspNonce = document.querySelector('meta[property="csp-nonce"]')?.nonce || undefined;

  // Validate schema data (basic validation)
  const validSchemas = schemas.filter(schema => {
    if (!schema['@context']) {
      console.warn('StructuredData: Missing @context in schema');
      return false;
    }
    if (!schema['@type']) {
      console.warn('StructuredData: Missing @type in schema');
      return false;
    }
    return true;
  });

  if (validSchemas.length === 0) {
    console.warn('StructuredData: No valid schemas to render');
    return null;
  }

  return (
    <Helmet>
      {validSchemas.map((schema, index) => (
        <script key={index} type="application/ld+json" nonce={cspNonce}>
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
