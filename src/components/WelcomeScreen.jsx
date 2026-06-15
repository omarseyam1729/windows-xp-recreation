const WelcomeScreen = ({ fading }) => {
  return (
    <div className={`xp-welcome-screen ${fading ? 'xp-welcome-fade' : ''}`}>
      {/* Top solid band */}
      <div className="xp-welcome-top" />

      {/* Light divider line */}
      <div className="xp-welcome-divider xp-welcome-divider-top" />

      {/* Middle: corner glow + centered "welcome" */}
      <div className="xp-welcome-middle">
        <div className="xp-welcome-glow" />
        <div className="xp-welcome-text">welcome</div>
      </div>

      {/* Gold divider line */}
      <div className="xp-welcome-divider xp-welcome-divider-bottom" />

      {/* Bottom solid band */}
      <div className="xp-welcome-bottom" />
    </div>
  )
}

export default WelcomeScreen
