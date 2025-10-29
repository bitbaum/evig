// TinaCMS admin temporarily disabled due to configuration issues
// TODO: Re-enable when TinaCMS is properly configured

export default function AdminPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#6b7280',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Admin Panel</h1>
      <p style={{ marginBottom: '2rem', maxWidth: '600px' }}>
        The admin panel is temporarily disabled due to TinaCMS configuration issues.
      </p>
      <p style={{ marginBottom: '2rem', maxWidth: '600px' }}>
        <strong>Your content is safe!</strong> All content exists in the <code>/content/</code> directory as markdown files.
      </p>
      <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <p><strong>To manage content:</strong></p>
        <ol style={{ marginLeft: '1rem' }}>
          <li>Edit markdown files directly in <code>/content/services/</code>, <code>/content/posts/</code>, etc.</li>
          <li>Changes will be reflected immediately in development</li>
          <li>For production, content is served from these markdown files</li>
        </ol>
      </div>
      <p>
        To re-enable TinaCMS admin, set these environment variables:
        <br />
        <code>NEXT_PUBLIC_TINA_CLIENT_ID</code> and <code>TINA_TOKEN</code>
      </p>
    </div>
  )
}
