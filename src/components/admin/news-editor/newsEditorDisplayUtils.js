export function formatNewsCategoryLabel(category) {
  return String(category || '').replace(/_/g, ' ');
}

export function getNewsCategoryBadgeClass(category) {
  switch (category) {
    case 'news':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'bounty':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'most_wanted':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

export function getNewsStatusBadgeClass(status) {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}
