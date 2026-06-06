/**
 * Server-rendered JSON-LD for crawlers (Google Search, Google News).
 */
export default function JsonLd({ data }) {
  if (!data) return null;

  const items = Array.isArray(data) ? data : [data];

  return items.map((item, index) => (
    <script
      key={index}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
    />
  ));
}
