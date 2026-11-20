import { otherSisterSites, relatedSisterSites, type SisterCluster } from '@/lib/sister-sites';

type Props = {
  selfUrl: string;
  clusters: SisterCluster[];
  /** When set, a short link goes to the full list. When omitted, other brands are named in the footer. */
  aboutHref?: string;
  className?: string;
};

export function SisterSites({ selfUrl, clusters, aboutHref, className }: Props) {
  const related = relatedSisterSites(clusters, selfUrl);
  const others = aboutHref ? [] : otherSisterSites(selfUrl, related);

  return (
    <section className={className} aria-labelledby="sister-sites-heading">
      <h2 id="sister-sites-heading">From the same maker</h2>
      {related.length > 0 ? (
        <ul>
          {related.map((site) => (
            <li key={site.url}>
              <a href={site.url} rel="noopener">
                {site.name}
              </a>
              {' — '}
              {site.blurb}
            </li>
          ))}
        </ul>
      ) : null}
      {others.length > 0 ? (
        <p>
          Cole Collins also makes{' '}
          {others.map((site, index) => (
            <span key={site.url}>
              {index > 0 ? (index === others.length - 1 ? ', and ' : ', ') : null}
              <a href={site.url} rel="noopener">
                {site.name}
              </a>
            </span>
          ))}
          .
        </p>
      ) : null}
      {aboutHref ? (
        <p>
          <a href={aboutHref}>More sites from the same maker</a>
        </p>
      ) : null}
    </section>
  );
}
