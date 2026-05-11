// force-dynamic: prevents static pre-rendering which crashes on next-auth v5 beta + webpack
// due to React-null circular dep in SSR bundle during parallel static generation workers.
export const dynamic = 'force-dynamic'

import ProjectsPageClient from './ProjectsPageClient'
export default ProjectsPageClient
