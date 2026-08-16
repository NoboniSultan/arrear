import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { FlaggedItemsPage } from './pages/FlaggedItemsPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ProgramsPage } from './pages/ProgramsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { RulesPage } from './pages/RulesPage';
import { RuleEditorPage } from './pages/RuleEditorPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/flagged-items" element={<FlaggedItemsPage />} />
          <Route path="/flagged-items/:id" element={<ItemDetailPage />} />
          <Route
            path="/submissions"
            element={<FlaggedItemsPage presetStatus="submitted" breadcrumbSuffix="Submissions" />}
          />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/programs/:programId/rules" element={<RulesPage />} />
          <Route path="/programs/:programId/rules/:ruleId" element={<RuleEditorPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
