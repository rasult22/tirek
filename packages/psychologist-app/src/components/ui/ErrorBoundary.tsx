import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-danger/10">
            <AlertTriangle size={40} className="text-danger" strokeWidth={1.5} />
          </div>
          <h1 className="mt-5 text-xl font-bold text-text-main">
            Что-то пошло не так
          </h1>
          <p className="mt-2 text-center text-sm text-text-light max-w-xs">
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </p>
          <button
            onClick={this.handleReset}
            className="btn-press mt-6 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark"
          >
            <RefreshCw size={16} />
            Перезагрузить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
