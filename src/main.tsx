import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { migratePersistedStoryIntoClosedBetaScope } from './lib/closedBetaMigration'
import { localPersistence } from './lib/localPersistence'
import { storyStateService } from './lib/storyStateService'
import './index.css'

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

const bootstrap = async () => {
  try {
    await localPersistence.waitForPendingRemoteReset()
    await localPersistence.waitForPendingChoiceSync()
    const snapshot = await storyStateService.loadCurrent()

    if (snapshot) {
      localPersistence.restoreRemoteSnapshot(snapshot)
    }
  } catch (error) {
    console.error('Failed to restore remote story state', error)
  } finally {
    try {
      migratePersistedStoryIntoClosedBetaScope()
    } catch (error) {
      console.error('Failed to migrate persisted story into the closed-beta scope', error)
    }
    renderApp()
  }
}

void bootstrap()
