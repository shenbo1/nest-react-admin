const JobMonitor: React.FC = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  const normalizedBase = apiBase.replace(/\/$/, '');
  const bullUrl = `${normalizedBase}/bull`;

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 140px)' }}>
      <iframe
        title="BullMQ Monitor"
        src={bullUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
};

export default JobMonitor;
