import { Component } from 'react';
import AppStatusScreen from './AppStatusScreen.jsx';

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Unhandled React error:', error);
  }

  render() {
    if (this.state.hasError) {
      const {
        actionHref = '../problems.html',
        actionLabel = 'Retour aux problemes',
        message = 'Recharge la page ou reviens au catalogue pour reprendre la session.',
        title = 'Une erreur a interrompu l interface',
      } = this.props;

      return (
        <AppStatusScreen
          title={title}
          message={message}
          actionHref={actionHref}
          actionLabel={actionLabel}
        />
      );
    }

    return this.props.children;
  }
}
