import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Button } from './UIComponents';

/**
 * Error Boundary Component
 * Catches errors in child component tree and displays fallback UI
 * Logs errors for debugging purposes
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  /**
   * Log error details
   */
  componentDidCatch(error, errorInfo) {
    this.setState((prev) => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Log to console in development
    if (__DEV__) {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // Could send error to logging service here
    this.logErrorToService(error, errorInfo);
  }

  /**
   * Send error to logging service
   * @private
   */
  logErrorToService(error, errorInfo) {
    // TODO: Implement error logging to external service
    // Example: Sentry, LogRocket, etc.
    try {
      // Placeholder for error logging
      console.log('Error logged to service');
    } catch (err) {
      console.warn('Failed to log error:', err);
    }
  }

  /**
   * Reset error state
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call optional callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚠️</Text>
            </View>

            <Text style={styles.title}>Oops! Something went wrong</Text>

            <Text style={styles.message}>
              {this.props.message ||
                'An unexpected error occurred. Please try again or contact support.'}
            </Text>

            {/* Error details in development */}
            {__DEV__ && this.state.error && (
              <View style={styles.devSection}>
                <Text style={styles.devTitle}>Error Details (Development Only)</Text>

                <Text style={styles.errorTitle}>Error Message:</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>

                {this.state.errorInfo && (
                  <>
                    <Text style={styles.errorTitle}>Component Stack:</Text>
                    <Text style={styles.errorStack}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </>
                )}

                <Text style={styles.errorTitle}>Error Count:</Text>
                <Text style={styles.errorText}>{this.state.errorCount}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Try Again"
                variant="primary"
                size="large"
                onPress={this.handleReset}
              />

              {this.props.onNavigateHome && (
                <Button
                  title="Go Home"
                  variant="secondary"
                  size="large"
                  style={styles.secondaryButton}
                  onPress={this.props.onNavigateHome}
                />
              )}
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  devSection: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  devTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Courier New',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'Courier New',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    maxHeight: 150,
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
  secondaryButton: {
    marginTop: 8,
  },
});

export default ErrorBoundary;

/**
 * HOC to wrap a component with error boundary
 * @example
 * export default withErrorBoundary(MyComponent);
 */
export function withErrorBoundary(Component, errorProps = {}) {
  return (props) => (
    <ErrorBoundary {...errorProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
}
