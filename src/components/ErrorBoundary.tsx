import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw',
          height: '100vh',
          background: '#000',
          color: '#00ff00',
          fontFamily: '"Courier New", monospace',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}>
          <div style={{ fontSize: '24px' }}>SYSTEM ERROR</div>
          <div style={{ fontSize: '14px', opacity: 0.6 }}>
            Something broke. Refresh to restart.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              border: '1px solid #00ff00',
              color: '#00ff00',
              padding: '8px 24px',
              fontFamily: '"Courier New", monospace',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            REBOOT
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
