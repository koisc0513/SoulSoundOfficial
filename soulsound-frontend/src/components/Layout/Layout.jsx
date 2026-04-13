import { Outlet } from 'react-router-dom'
import Header    from './Header'
import PlayerBar from '../Player/PlayerBar'
import { usePlayer } from '../../context/PlayerContext'

export default function Layout() {
  const { currentTrack } = usePlayer()
  return (
    <div className={`app-wrapper${currentTrack ? ' has-player' : ''}`}>
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <PlayerBar />
    </div>
  )
}