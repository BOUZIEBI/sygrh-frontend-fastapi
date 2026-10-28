import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminSidebar from '@/shared/components/AdminSidebar'
import AdministrationPage from '@/pages/AdministrationPage'
import AgentPage from '@/pages/AgentPage'
import Sidebar from '@/shared/components/Sidebar'
import HeaderAgentAdmin from '@/shared/components/HeaderAgentAdmin'
import Dashboard from '@/shared/components/Dashboard'
import LoginPage from '@/features/auth/pages/LoginPage'
import { useAuthStore } from '@/store/useAuthStore'
import { useCryptoStore } from '@/store/useCryptoStore'
import { pageRefreshService } from '@/shared/services/pageRefreshService'
import '@/shared/styles/authenticatedapp/Layout.css'
import '@/shared/styles/authenticatedapp/Dashboard.css'
import '@/shared/styles/authenticatedapp/Sidebar.css'
import ProtectedRoute from '@/routes/ProtectedRoute'
import ListeagentsPage from './espaceagent/ListeagentsPage'
import AjoutagentPage from './espaceagent/AjoutagentPage'


function AuthenticatedApp() {
  const location = useLocation()
  const isLoginPage = ['/connexion', '/login'].includes(location.pathname.replace(/\/$/, ''))

  const auth = useAuthStore((state) => state.auth)
  const loadAuth = useAuthStore((state) => state.loadAuth)
  const loaded = useAuthStore((state) => state.loaded)
  const loading = useAuthStore((state) => state.loading)

  useEffect(() => {
    pageRefreshService.start()
    return () => pageRefreshService.stop()
  }, [])

  useEffect(() => {
    if ( isLoginPage || auth || loaded) return
    void loadAuth()
  }, [ isLoginPage, auth, loaded, loadAuth])

  if (isLoginPage) return <LoginPage />


  if ( loading || (!auth && !loaded)) {
    return <main role="status">Vérification de votre session…</main>
  }

  if (!auth?.success || auth.code !== 200) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />
  }

  return <AppLayout />
}

function AppLayout() {
  const { pathname } = useLocation()
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(pathname)
  const sidebarOpen = isMobile ? mobileMenuPath === pathname : desktopSidebarOpen
  const isAdministration = pathname === '/administration' || pathname.startsWith('/administration/')

  const closeMobileMenu = () => {
    setMobileMenuPath(null)
    document.getElementById('sidebar-toggle')?.focus()
  }

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)')
    const handleChange = () => {
      setIsMobile(query.matches)
      setMobileMenuPath(null)
    }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isMobile || !sidebarOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuPath(null)
        document.getElementById('sidebar-toggle')?.focus()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobile, sidebarOpen])

  return (
      <div className="app-layout">
        <div className="sidebar-slot" {...(isMobile && !sidebarOpen ? { inert: '' } : {})} onClick={(event) => {
          if (isMobile && event.target instanceof Element && event.target.closest('a')) closeMobileMenu()
        }}>
          {isAdministration ? <AdminSidebar isOpen={sidebarOpen} /> : <Sidebar isOpen={sidebarOpen} />}
        </div>
        {isMobile && sidebarOpen && <button className="sidebar-backdrop" aria-label="Fermer le menu" onClick={closeMobileMenu} />}
        <HeaderAgentAdmin sidebarOpen={sidebarOpen} isAdministration={isAdministration} onToggleSidebar={() => {
          if (isMobile) setMobileMenuPath(sidebarOpen ? null : pathname)
          else setDesktopSidebarOpen((open) => !open)
        }} />
        <div className="layout-container" {...(isMobile && sidebarOpen ? { inert: '' } : {})}>
          <main className={`dashboard ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/resume-fiche-identification" element={<AgentPage title="Résumé Fiche d’identification" />} />
              <Route path="/fiche-identification" element={<Navigate to="/fiche-identification/informations-generales"  replace />} />
              
              <Route
                element={
                  <ProtectedRoute
                    //</Routes>permissions={[
                    //  "SUPPRIMERAGENT",
                    //]}
                    requireAllPermissions={true}
                  />
                }
              >
                <Route
                  path="/fiche-identification/informations-generales"
                  element={<AgentPage title="Informations Générales" breadcrumb="Fiche d'Identification / Informations générales" />}
                />
              </Route>
              
              <Route path="/fiche-identification/enfants" element={<AgentPage title="Liste des Enfants" />} />
              <Route path="/fiche-identification/services" element={<AgentPage title="Services" />} />
              <Route path="/fiche-identification/autres-services" element={<AgentPage title="Autres services" />} />
              <Route path="/fiche-identification/etudes-formations-diplomes" element={<AgentPage title="Études, Formations professionnelles, Diplômes" />} />
              <Route path="/fiche-identification/stages-colloques" element={<AgentPage title="Stage, Colloque" />} />
              <Route path="/fiche-identification/enseignements" element={<AgentPage title="Enseignements dispensés" />} />
              <Route path="/fiche-identification/publications" element={<AgentPage title="Publications" />} />
              <Route path="/fiche-identification/activites-recherche" element={<AgentPage title="Activités de recherches" />} />
              <Route path="/fiche-identification/emplois" element={<AgentPage title="Emplois occupés" />} />
              <Route path="/fiche-identification/fonctions" element={<AgentPage title="Fonctions occupées" />} />
              <Route path="/fiche-identification/competences" element={<AgentPage title="Résumé des compétences" />} />
              <Route path="/fiche-identification/autres-renseignements" element={<AgentPage title="Autres renseignements" />} />
              <Route path="/fiche-identification/consultation" element={<AgentPage title="Consultation de la fiche d’identification" />} />
              <Route path="/presences" element={<AgentPage title="Présences" />} />
              <Route path="/mouvements" element={<AgentPage title="Mouvements" />} />
              <Route path="/attestations" element={<AgentPage title="Attestations" />} />
              <Route path="/certificats" element={<AgentPage title="Certificats" />} />
              <Route path="/prestation-sociale" element={<AgentPage title="Prestation sociale et autres" />} />
              <Route path="/liste-utilisateurs" element={<UnavailablePage title="Liste des utilisateurs" />} />
              <Route path="/ajouter-utilisateur" element={<UnavailablePage title="Ajouter un utilisateur" />} />
              <Route path="/administration" element={<Navigate to="/administration/dashboard" replace />} />
              <Route path="/administration/dashboard" element={<AdministrationPage title="Tableau de bord" />} />
              
              <Route path="/administration/agents" element={<Navigate to="/administration/agents/liste" replace />} />
              
              <Route
                element={
                  <ProtectedRoute
                    //</Routes>permissions={[
                    //  "CONSULTERAGENT",
                    //]}
                    requireAllPermissions={true}
                  />
                }
              >
                <Route
                  path="/administration/agents/liste"
                  element={<ListeagentsPage title="Liste des agents" breadcrumb="Agent / Liste des Agents" />}
                />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    //</Routes>permissions={[
                    //  "CONSULTERAGENT",
                    //]}
                    requireAllPermissions={true}
                  />
                }
              >
                <Route
                  path="/administration/agents/ajouter"
                  element={<AjoutagentPage  title="Ajouter un agent" breadcrumb="Agent / Ajouter un Agent" />}
                />
              </Route>


              <Route path="/administration/agents/absences" element={<AdministrationPage title="Gestion des absences" />} />
              <Route path="/administration/agents/mouvements" element={<AdministrationPage title="Gestion des Mouvements" />} />
              <Route path="/administration/agents/attestations" element={<AdministrationPage title="Gestion des Attestations" />} />
              <Route path="/administration/agents/certificats" element={<AdministrationPage title="Gestion des Certificats" />} />
              <Route path="/administration/agents/prestation-sociale" element={<AdministrationPage title="Prestation sociale et autres" />} />
              <Route path="/administration/besoins-rh" element={<AdministrationPage title="Besoins en RH" />} />
              <Route path="/administration/presences" element={<AdministrationPage title="Présences" />} />
              <Route path="/administration/statistiques" element={<AdministrationPage title="Statistiques" />} />
              <Route path="/administration/attestations" element={<AdministrationPage title="Attestations" />} />
              <Route path="/administration/certificats" element={<AdministrationPage title="Certificats" />} />
              <Route path="/administration/mouvements" element={<AdministrationPage title="Mouvements" />} />
              <Route path="/administration/roles" element={<AdministrationPage title="Rôles" />} />
              <Route path="/administration/structures" element={<AdministrationPage title="Structures" />} />
              <Route path="/administration/verification" element={<AdministrationPage title="Vérification" />} />
              <Route path="/administration/actualites" element={<AdministrationPage title="Actualités" />} />
              <Route path="/administration/communiques" element={<AdministrationPage title="Communiqués" />} />
              <Route path="/administration/services" element={<AdministrationPage title="Services" />} />
              <Route path="/administration/phototheque" element={<AdministrationPage title="Photothèque" />} />
              <Route path="/administration/*" element={<Navigate to="/administration/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <div className={`authenticated-footer ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
            <footer>
              Copyright © MESRS DRH {new Date().getFullYear()} - Système de Gestion des Ressources Humaines du MESRS
            </footer>
          </div>
        </div>
      </div>
  )
}

export default AuthenticatedApp

function UnavailablePage({ title }: { title: string }) {
  return <section className="content-section"><h1>{title}</h1><p>Cette page n’est pas encore disponible.</p></section>
}
