import ProjectDetail from '../../../src/views/ProjectDetail';

export default async function ProjectPage({ params }) {
  const { id } = await params;
  return <ProjectDetail projectId={id} />;
}
