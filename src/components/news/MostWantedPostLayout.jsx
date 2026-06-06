'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MaximizableImage from '@/components/media/MaximizableImage';
import EvidenceThumbnailGallery from '@/components/media/EvidenceThumbnailGallery';
import {
  displayMostWantedValue,
  getCaseFactsList,
  getPhysicalDescriptionList,
  normalizeMostWantedDetails,
} from '@/lib/mostWantedUtils';
import { getEvidencePathsForPublishedPost } from '@/lib/publishedEvidence';

function FactList({ items }) {
  return (
    <ul className="space-y-3 text-base md:text-lg">
      {items.map(({ label, value }) => (
        <li key={label}>
          <span className="text-muted-foreground">{label}:</span>{' '}
          <strong className="font-semibold text-foreground">{displayMostWantedValue(value)}</strong>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-3 border-t pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default function MostWantedPostLayout({ post, featuredImageUrl }) {
  const details = normalizeMostWantedDetails(post.most_wanted_details);
  const caseFacts = getCaseFactsList(details);
  const physicalDescription = getPhysicalDescriptionList(details);
  const galleryPaths = getEvidencePathsForPublishedPost(post, []);
  const galleryExclude = post.featured_image || null;

  const submitHref = `/submit-report?news_id=${encodeURIComponent(post.id)}&category=most_wanted&bounty_title=${encodeURIComponent(post.title)}`;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="md:col-span-5 lg:col-span-4">
          {featuredImageUrl && (
            <div className="overflow-hidden rounded-lg">
              <MaximizableImage
                src={featuredImageUrl}
                alt={details.suspect_name || post.title}
                wrapperClassName="aspect-[4/5] w-full border-0 ring-0 outline-none shadow-none"
                imageClassName="h-full w-full object-cover"
              />
            </div>
          )}
          {galleryPaths.length > 0 && (
            <div className="mt-4 [&_button]:border-0 [&_button]:shadow-none [&_button]:ring-0 [&_button]:outline-none">
              <EvidenceThumbnailGallery
                paths={galleryPaths}
                excludePath={galleryExclude}
                title=""
                showOtherAttachments={false}
              />
            </div>
          )}
        </div>

        {caseFacts.length > 0 && (
          <div className="md:col-span-7 lg:col-span-8">
            <FactList items={caseFacts} />
          </div>
        )}
      </div>

      {details.full_details?.trim() && (
        <Section title="Full Details">
          <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {details.full_details}
          </p>
        </Section>
      )}

      {physicalDescription.length > 0 && (
        <Section title="Suspect description">
          <FactList items={physicalDescription} />
        </Section>
      )}

      {details.additional_information?.trim() && (
        <Section title="Additional Information">
          <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {details.additional_information}
          </p>
        </Section>
      )}

      <section className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center dark:border-red-900/50 dark:bg-red-950/20">
        <h2 className="text-2xl font-bold mb-3">Recognise this person?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Submit an anonymous tip. Your information could help bring this person to justice.
        </p>
        <Link href={submitHref}>
          <Button size="lg" className="w-full md:w-auto bg-red-600 hover:bg-red-700 uppercase">
            <Info className="mr-2 h-5 w-5" />
            Report Information About This Person Anonymously
          </Button>
        </Link>
      </section>
    </div>
  );
}
