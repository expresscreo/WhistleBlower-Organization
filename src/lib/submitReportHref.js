export const DEFAULT_SUBMIT_REPORT_HREF = '/submit-report';

export function buildBountySubmitReportHref({ bountyId, title, category = 'bounty' }) {
  if (!bountyId || !title) return DEFAULT_SUBMIT_REPORT_HREF;

  const params = new URLSearchParams({
    bounty_id: String(bountyId),
    bounty_title: title,
    category,
  });

  return `/submit-report?${params.toString()}`;
}

export function buildMostWantedSubmitReportHref({ newsId, title, mostWantedType }) {
  if (!newsId || !title) return DEFAULT_SUBMIT_REPORT_HREF;

  const params = new URLSearchParams({
    news_id: String(newsId),
    category: 'most_wanted',
    bounty_title: title,
  });

  if (mostWantedType) {
    params.set('most_wanted_type', mostWantedType);
  }

  return `/submit-report?${params.toString()}`;
}

export function buildNewsPostSubmitReportHref(post, { mostWantedType } = {}) {
  if (!post) return DEFAULT_SUBMIT_REPORT_HREF;

  if (post.category === 'bounty' && post.bounty_id) {
    return buildBountySubmitReportHref({
      bountyId: post.bounty_id,
      title: post.title,
      category: post.category,
    });
  }

  if (post.category === 'most_wanted') {
    return buildMostWantedSubmitReportHref({
      newsId: post.id,
      title: post.title,
      mostWantedType,
    });
  }

  return DEFAULT_SUBMIT_REPORT_HREF;
}
