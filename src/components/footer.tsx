export function Footer() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer__inner">
        <nav className="app-footer__links" aria-label="Rechtliches">
          <a href="https://commons-and-code.eu/en/legal/privacy/">Datenschutz</a>
          <a href="https://commons-and-code.eu/en/legal/imprint/">Impressum</a>
        </nav>

        <div className="app-footer__note">
          Keine Cookies. Statische Seite.
        </div>
      </div>
    </footer>
  );
}
