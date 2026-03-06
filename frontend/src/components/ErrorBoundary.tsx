import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base flex items-center justify-center px-6">
          <div className="flex flex-col gap-5 max-w-sm w-full">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary rounded-sm flex items-center justify-center shrink-0">
                <div className="w-2 h-2 bg-red-500" />
              </div>
              <span className="font-serif text-lg tracking-tight font-medium">Echo</span>
            </div>

            <div className="border border-red-900 bg-red-950/20 px-4 py-4 flex flex-col gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-red-400">
                Something went wrong
              </span>
              <p className="text-sm text-muted leading-relaxed">
                {this.state.message}
              </p>
            </div>

            <button
              type="button"
              onClick={this.handleReset}
              className="self-start px-4 py-2.5 border border-primary bg-primary text-base text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
