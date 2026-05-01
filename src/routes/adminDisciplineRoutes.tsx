import { lazy } from 'react';
import { Route } from 'react-router-dom';

// Reuse the same lazy chunks across both discipline trees so MMA + Boxeo
// share bundles instead of duplicating them.
const DisciplineDashboard = lazy(() => import('@/pages/admin/DisciplineDashboard'));
const EventosPelea = lazy(() => import('@/pages/admin/EventosPelea'));
const AdminFightersProfiles = lazy(() => import('@/pages/admin/FightersProfiles'));
const FightersProfilesInvite = lazy(() => import('@/pages/admin/FightersProfilesInvite'));
const FightersProfilesCreate = lazy(() => import('@/pages/admin/FightersProfilesCreate'));
const RankingsManagement = lazy(() => import('@/pages/admin/RankingsManagement'));
const GimnasiosAdmin = lazy(() => import('@/pages/admin/GimnasiosAdmin'));
const EntrenadoresAdmin = lazy(() => import('@/pages/admin/EntrenadoresAdmin'));
const PendingChangesHub = lazy(() => import('@/pages/admin/PendingChangesHub'));
const FightApproval = lazy(() => import('@/pages/admin/FightApproval'));
const Sanctions = lazy(() => import('@/pages/admin/Sanctions'));
const OrganizationsManagement = lazy(() => import('@/pages/admin/OrganizationsManagement'));
const OfficialsManagement = lazy(() => import('@/pages/admin/OfficialsManagement'));
const JudgesManagement = lazy(() => import('@/pages/admin/JudgesManagement'));
const JudgeStationsSetup = lazy(() => import('@/pages/admin/JudgeStationsSetup'));
const LiveEventsControl = lazy(() => import('@/pages/admin/LiveEventsControl'));
const LiveStreaming = lazy(() => import('@/pages/admin/LiveStreaming'));
const FightResults = lazy(() => import('@/pages/admin/FightResults'));
const ValidacionLicencias = lazy(() => import('@/pages/admin/ValidacionLicencias'));
const EmailMonitoring = lazy(() => import('@/pages/admin/EmailMonitoring'));
const EmailCampaigns = lazy(() => import('@/pages/admin/EmailCampaigns'));
const EmailCampaignDetail = lazy(() => import('@/pages/admin/EmailCampaignDetail'));
const EmailCampaignEditor = lazy(() => import('@/pages/admin/EmailCampaignEditor'));
const Comunidad = lazy(() => import('@/pages/admin/Comunidad'));
const AliadosEstrategicos = lazy(() => import('@/pages/admin/AliadosEstrategicos'));
const Betting = lazy(() => import('@/pages/admin/Betting'));
const AIStrikeMonitor = lazy(() => import('@/pages/admin/AIStrikeMonitor'));
const AIStrikeTestPanel = lazy(() => import('@/pages/admin/AIStrikeTestPanel'));
const VisionDiagnostics = lazy(() => import('@/pages/admin/VisionDiagnostics'));

/**
 * Returns the children `<Route>` elements for an admin discipline subtree
 * (mounted under `/admin/mma` or `/admin/boxeo`). Both disciplines share
 * the same admin surface — only the discipline context differs.
 *
 * `includeAi` toggles the AI/vision routes that are MMA-only today.
 */
export function adminDisciplineRoutes(opts: { includeAi?: boolean } = {}) {
  return (
    <>
      <Route index element={<DisciplineDashboard />} />
      <Route path="eventos-pelea" element={<EventosPelea />} />
      <Route path="fighters-profiles" element={<AdminFightersProfiles />} />
      <Route path="fighters-profiles/invite" element={<FightersProfilesInvite />} />
      <Route path="fighters-profiles/create" element={<FightersProfilesCreate />} />
      <Route path="rankings" element={<RankingsManagement />} />
      <Route path="gimnasios" element={<GimnasiosAdmin />} />
      <Route path="entrenadores" element={<EntrenadoresAdmin />} />
      <Route path="pending-changes" element={<PendingChangesHub />} />
      <Route path="fight-approval" element={<FightApproval />} />
      <Route path="sanctions" element={<Sanctions />} />
      <Route path="organizations" element={<OrganizationsManagement />} />
      <Route path="officials" element={<OfficialsManagement />} />
      <Route path="judges" element={<JudgesManagement />} />
      <Route path="scoring/stations" element={<JudgeStationsSetup />} />
      <Route path="live-events" element={<LiveEventsControl />} />
      <Route path="live-streaming" element={<LiveStreaming />} />
      <Route path="fight-results" element={<FightResults />} />
      {opts.includeAi && (
        <>
          <Route path="ai-strike-monitor" element={<AIStrikeMonitor />} />
          <Route path="ai-strike-test" element={<AIStrikeTestPanel />} />
          <Route path="vision-diagnostics" element={<VisionDiagnostics />} />
        </>
      )}
      <Route path="licencias" element={<ValidacionLicencias />} />
      <Route path="email-monitoring" element={<EmailMonitoring />} />
      <Route path="email-campaigns" element={<EmailCampaigns />} />
      <Route path="email-campaigns/:id" element={<EmailCampaignDetail />} />
      <Route path="email-campaigns/editor" element={<EmailCampaignEditor />} />
      <Route path="email-campaigns/editor/:id" element={<EmailCampaignEditor />} />
      <Route path="comunidad" element={<Comunidad />} />
      <Route path="aliados-estrategicos" element={<AliadosEstrategicos />} />
      <Route path="betting" element={<Betting />} />
    </>
  );
}
