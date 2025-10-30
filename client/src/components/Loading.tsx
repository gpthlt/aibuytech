import './Loading.css';

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
}

function Loading({ fullScreen = false, text = 'Đang tải...' }: LoadingProps) {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <div className="spinner"></div>
      <p>{text}</p>
    </div>
  );
}

export default Loading;
